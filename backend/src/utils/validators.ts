import { ValidationError } from './errors';

/**
 * Basic validation helper for common fields
 */
export class Validator {
  /**
   * Validate that a value is a non-empty string
   */
  static string(value: any, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty string`);
    }
    return value.trim();
  }

  /**
   * Validate that a value is a valid number
   */
  static number(value: any, fieldName: string, min?: number, max?: number): number {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} must be a number`);
    }
    if (min !== undefined && num < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }
    if (max !== undefined && num > max) {
      throw new ValidationError(`${fieldName} must be at most ${max}`);
    }
    return num;
  }

  /**
   * Validate that a value is a valid email
   */
  static email(value: any): string {
    const email = this.string(value, 'Email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
    return email;
  }

  /**
   * Validate that a value is a valid phone number (basic check)
   */
  static phone(value: any): string {
    const phone = this.string(value, 'Phone');
    // Basic validation: at least 10 digits
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      throw new ValidationError('Phone number must contain at least 10 digits');
    }
    return phone;
  }

  /**
   * Validate that a value is in an enum
   */
  static enum(value: any, fieldName: string, allowedValues: string[]): string {
    const strValue = this.string(value, fieldName);
    if (!allowedValues.includes(strValue)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
    return strValue;
  }

  /**
   * Validate that a value is an array with minimum length
   */
  static array(value: any, fieldName: string, minLength: number = 1): any[] {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`);
    }
    if (value.length < minLength) {
      throw new ValidationError(
        `${fieldName} must have at least ${minLength} item(s)`
      );
    }
    return value;
  }

  /**
   * Validate that a value exists (not null or undefined)
   */
  static required(value: any, fieldName: string): any {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} is required`);
    }
    return value;
  }

  /**
   * Validate UUID format
   */
  static uuid(value: any, fieldName: string): string {
    const id = this.string(value, fieldName);
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^[a-z0-9]+$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError(`${fieldName} must be a valid UUID or ID`);
    }
    return id;
  }
}

/**
 * Order validation utilities
 */
export class OrderValidator {
  static validateOrderItem(item: any) {
    return {
      menuItemId: Validator.string(item.menuItemId, 'menuItemId'),
      variantId: item.variantId ? Validator.string(item.variantId, 'variantId') : undefined,
      quantity: Validator.number(item.quantity, 'quantity', 1),
      unitPrice: Validator.number(item.unitPrice, 'unitPrice', 0),
    };
  }

  static validateOrderItems(items: any) {
    const validatedItems = Validator.array(items, 'items', 1);
    return validatedItems.map((item) => this.validateOrderItem(item));
  }

  static validateOrderTotals(subtotal: any, tax: any, total: any) {
    const validatedSubtotal = Validator.number(subtotal, 'subtotal', 0);
    const validatedTax = Validator.number(tax, 'tax', 0);
    const validatedTotal = Validator.number(total, 'total', 0);

    // Basic sanity check
    if (validatedTotal < validatedSubtotal) {
      throw new ValidationError('Total cannot be less than subtotal');
    }

    return {
      subtotal: validatedSubtotal,
      tax: validatedTax,
      total: validatedTotal,
    };
  }
}

/**
 * Payment validation utilities
 */
export class PaymentValidator {
  static validatePaymentMethod(method: any): string {
    const validMethods = [
      'qris',
      'gopay',
      'shopeepay',
      'credit_card',
      'debit_card',
    ];
    return Validator.enum(method, 'method', validMethods);
  }

  static validatePaymentProvider(provider: any): string {
    const validProviders = [
      'xendit',
      'stripe',
      'adyen',
      'gopay_api',
      'shopeepay_api',
    ];
    return Validator.enum(provider, 'provider', validProviders);
  }

  static validatePaymentStatus(status: any): string {
    const validStatuses = [
      'pending',
      'processing',
      'success',
      'failed',
      'refunded',
    ];
    return Validator.enum(status, 'status', validStatuses);
  }
}
