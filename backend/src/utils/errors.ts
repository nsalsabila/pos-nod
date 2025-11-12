/**
 * Custom Error Classes for the NOD POS system
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequest extends AppError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, BadRequest.prototype);
  }
}

export class Unauthorized extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    Object.setPrototypeOf(this, Unauthorized.prototype);
  }
}

export class Forbidden extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    Object.setPrototypeOf(this, Forbidden.prototype);
  }
}

export class NotFound extends AppError {
  constructor(message: string) {
    super(404, message);
    Object.setPrototypeOf(this, NotFound.prototype);
  }
}

export class Conflict extends AppError {
  constructor(message: string) {
    super(409, message);
    Object.setPrototypeOf(this, Conflict.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Record<string, string>
  ) {
    super(400, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class PaymentError extends AppError {
  constructor(
    message: string,
    public provider?: string
  ) {
    super(402, message);
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, message);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    public service?: string
  ) {
    super(503, message);
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}
