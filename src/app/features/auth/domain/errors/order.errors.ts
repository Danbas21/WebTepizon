// ==========================================================
// ORDER ERRORS
// ==========================================================
// src/app/features/orders/domain/errors/order.errors.ts

/**
 * Error base para el dominio de órdenes
 */
export class OrderError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly originalError?: any
    ) {
        super(message);
        this.name = 'OrderError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, OrderError);
        }
    }
}

/**
 * Errores específicos de órdenes
 */
export class OrderNotFoundError extends OrderError {
    constructor(orderId: string) {
        super('ORDER_NOT_FOUND', `Orden ${orderId} no encontrada`);
        this.name = 'OrderNotFoundError';
    }
}

export class InvalidOrderStatusError extends OrderError {
    constructor(currentStatus: string, newStatus: string) {
        super(
            'INVALID_STATUS_TRANSITION',
            `No se puede cambiar de estado ${currentStatus} a ${newStatus}`
        );
        this.name = 'InvalidOrderStatusError';
    }
}

export class OrderCancellationError extends OrderError {
    constructor(message = 'No se puede cancelar esta orden') {
        super('CANCELLATION_ERROR', message);
        this.name = 'OrderCancellationError';
    }
}
