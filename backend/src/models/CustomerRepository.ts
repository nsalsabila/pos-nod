import prisma from '../database/connection';
import { NotFound } from '../utils/errors';

export interface CreateCustomerInput {
  storeId: string;
  phone: string;
  name: string;
  email?: string;
  contactPreference?: 'none' | 'sms' | 'whatsapp' | 'email';
}

export class CustomerRepository {
  /**
   * Find a customer by ID
   */
  async findById(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFound(`Customer with ID ${customerId} not found`);
    }

    return customer;
  }

  /**
   * Find or create a customer by phone (per store)
   */
  async findOrCreateByPhone(input: CreateCustomerInput) {
    const existing = await prisma.customer.findUnique({
      where: {
        storeId_phone: {
          storeId: input.storeId,
          phone: input.phone,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.customer.create({
      data: {
        storeId: input.storeId,
        phone: input.phone,
        name: input.name,
        email: input.email,
        contactPreference: input.contactPreference || 'whatsapp',
      },
    });
  }

  /**
   * Find a customer by phone
   */
  async findByPhone(storeId: string, phone: string) {
    return prisma.customer.findUnique({
      where: {
        storeId_phone: {
          storeId,
          phone,
        },
      },
    });
  }

  /**
   * Update a customer
   */
  async update(customerId: string, data: Partial<CreateCustomerInput>) {
    return prisma.customer.update({
      where: { id: customerId },
      data: {
        name: data.name,
        email: data.email,
        contactPreference: data.contactPreference,
      },
    });
  }

  /**
   * List customers for a store
   */
  async listByStore(storeId: string, pagination?: { limit: number; offset: number }) {
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: { storeId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where: { storeId } }),
    ]);

    return {
      customers,
      total,
      limit,
      offset,
    };
  }
}

export const customerRepository = new CustomerRepository();
