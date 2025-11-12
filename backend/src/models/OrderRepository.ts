import prisma from '../database/connection';
import { NotFound, Conflict } from '../utils/errors';

export interface CreateOrderInput {
  storeId: string;
  clientOrderId: string;
  source: 'mobile_pickup' | 'in_store';
  customerId: string;
  items: Array<{
    menuItemId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  promotionIds?: string[];
}

export interface UpdateOrderStatusInput {
  status: string;
  actorId: string;
}

export class OrderRepository {
  /**
   * Find an order by ID
   */
  async findById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFound(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  /**
   * Find an order by store ID and client order ID (for deduplication)
   */
  async findByClientOrderId(storeId: string, clientOrderId: string) {
    return prisma.order.findUnique({
      where: {
        storeId_clientOrderId: {
          storeId,
          clientOrderId,
        },
      },
      include: {
        customer: true,
        payment: true,
      },
    });
  }

  /**
   * Create a new order (with duplicate checking)
   */
  async create(input: CreateOrderInput) {
    // Check for duplicates
    const existingOrder = await this.findByClientOrderId(input.storeId, input.clientOrderId);
    if (existingOrder) {
      throw new Conflict(
        `Order with client_order_id ${input.clientOrderId} already exists for store ${input.storeId}`
      );
    }

    const order = await prisma.order.create({
      data: {
        storeId: input.storeId,
        clientOrderId: input.clientOrderId,
        source: input.source,
        customerId: input.customerId,
        items: JSON.stringify(input.items),
        subtotal: input.subtotal,
        discountAmount: input.discountAmount,
        taxAmount: input.taxAmount,
        total: input.total,
        promotionIds: input.promotionIds || [],
      },
      include: {
        customer: true,
      },
    });

    // Log order creation event
    await this.logEvent(input.storeId, order.id, 'created', 'system', {
      source: input.source,
      total: input.total,
    });

    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await this.findById(orderId);

    // Check if status is being changed
    if (order.status === input.status) {
      return order; // Idempotent - no change needed
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: input.status,
        completedAt: input.status === 'completed' ? new Date() : order.completedAt,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        payment: true,
      },
    });

    // Log status change event
    await this.logEvent(
      order.storeId,
      orderId,
      'status_changed',
      input.actorId,
      {
        oldStatus: order.status,
        newStatus: input.status,
      }
    );

    return updatedOrder;
  }

  /**
   * List orders for a store with filters and pagination
   */
  async listByStore(
    storeId: string,
    filters?: {
      status?: string;
      customerName?: string;
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

    const where: any = { storeId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerName) {
      where.customer = {
        name: {
          contains: filters.customerName,
          mode: 'insensitive',
        },
      };
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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      limit,
      offset,
    };
  }

  /**
   * Log an order event
   */
  async logEvent(storeId: string, orderId: string, eventType: string, actorId: string, data: any) {
    return prisma.orderEvent.create({
      data: {
        storeId,
        orderId,
        eventType,
        actorId,
        data: JSON.stringify(data),
      },
    });
  }

  /**
   * Get order history (events)
   */
  async getEventHistory(orderId: string) {
    return prisma.orderEvent.findMany({
      where: { orderId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get orders by status
   */
  async findByStatus(storeId: string, status: string) {
    return prisma.order.findMany({
      where: {
        storeId,
        status,
      },
      include: {
        customer: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const orderRepository = new OrderRepository();
