import prisma from '../database/connection';
import { NotFound } from '../utils/errors';

export interface CreatePaymentInput {
  orderId: string;
  method: string; // qris, gopay, shopeepay, credit_card, debit_card
  provider: string; // xendit, stripe, adyen, gopay_api, shopeepay_api
  amount: number;
  providerReference?: string;
  receiptNumber?: string;
}

export interface UpdatePaymentStatusInput {
  status: string;
  providerReference?: string;
}

export class PaymentRepository {
  /**
   * Find a payment by ID
   */
  async findById(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFound(`Payment with ID ${paymentId} not found`);
    }

    return payment;
  }

  /**
   * Find a payment by order ID
   */
  async findByOrderId(orderId: string) {
    return prisma.payment.findFirst({
      where: { orderId },
    });
  }

  /**
   * Create a new payment
   */
  async create(input: CreatePaymentInput) {
    return prisma.payment.create({
      data: {
        orderId: input.orderId,
        method: input.method,
        provider: input.provider,
        status: 'pending',
        amount: input.amount,
        providerReference: input.providerReference,
        receiptNumber: input.receiptNumber,
      },
    });
  }

  /**
   * Update payment status
   */
  async updateStatus(paymentId: string, input: UpdatePaymentStatusInput) {
    const payment = await this.findById(paymentId);

    // Check if status is being changed
    if (payment.status === input.status) {
      return payment; // Idempotent - no change needed
    }

    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: input.status,
        providerReference: input.providerReference || payment.providerReference,
        completedAt: input.status === 'success' ? new Date() : payment.completedAt,
      },
    });
  }

  /**
   * Find payments in a specific status
   */
  async findByStatus(status: string, limit: number = 100) {
    return prisma.payment.findMany({
      where: { status },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find payments for reconciliation (status mismatch check)
   */
  async findProcessingPayments() {
    return prisma.payment.findMany({
      where: {
        status: 'processing',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });
  }

  /**
   * List payments for a store with filters
   */
  async listByStore(
    storeId: string,
    filters?: {
      status?: string;
      method?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    pagination?: {
      limit: number;
      offset: number;
    }
  ) {
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;

    const where: any = {
      order: {
        storeId,
      },
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.method) {
      where.method = filters.method;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      total,
      limit,
      offset,
    };
  }
}

export const paymentRepository = new PaymentRepository();
