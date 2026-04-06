import { FieldError } from '../types'

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource already exists') {
    super(message)
    this.name = 'ConflictError'
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

export class ValidationError extends Error {
  fieldErrors: FieldError[]

  constructor(message = 'Validation failed', fieldErrors: FieldError[] = []) {
    super(message)
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class UnauthenticatedError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'UnauthenticatedError'
    Object.setPrototypeOf(this, UnauthenticatedError.prototype)
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message)
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}
