/**
 * Orders Module Providers
 * Configuración de inyección de dependencias
 */

import { Provider } from '@angular/core';
import { OrderRepositoryPort } from './domain/order.repository.port';
import { OrderRepositoryImpl } from './infrastructure/order.repository.impl';

// Use Cases - Management
import {
  CreateOrderUseCase,
  GetOrderUseCase,
  GetUserOrdersUseCase,
  GetFilteredOrdersUseCase,
  GetUserStatisticsUseCase,
  UpdateOrderStatusUseCase,
  ReorderUseCase,
  AddOrderNoteUseCase,
  SearchOrdersUseCase,
  GetOrdersByDateRangeUseCase,
  GetOrdersByStatusUseCase
} from './application/use-cases/order-management.use-cases';

// Use Cases - Tracking
import {
  GetOrderTrackingUseCase,
  WatchOrderTrackingUseCase,
  UpdateTrackingUseCase,
  UpdateShippingInfoUseCase,
  GenerateTrackingUrlUseCase
} from './application/use-cases/order-tracking.use-cases';

// Use Cases - Cancellation & Returns
import {
  CanCancelOrderUseCase,
  RequestCancellationUseCase,
  GetCancellationUseCase,
  ProcessCancellationUseCase,
  CanReturnOrderUseCase,
  RequestReturnUseCase,
  GetReturnUseCase,
  GetUserReturnsUseCase,
  UpdateReturnStatusUseCase,
  CalculateReturnRefundUseCase,
  GetReturnPolicyUseCase
} from './application/use-cases/order-cancellation-return.use-cases';

/**
 * Providers del Orders Module
 * Agregar a app.config.ts en el array de providers
 */
export const ORDERS_PROVIDERS: Provider[] = [
  // Repository
  {
    provide: OrderRepositoryPort,
    useClass: OrderRepositoryImpl
  },
  
  // Use Cases - Management
  CreateOrderUseCase,
  GetOrderUseCase,
  GetUserOrdersUseCase,
  GetFilteredOrdersUseCase,
  GetUserStatisticsUseCase,
  UpdateOrderStatusUseCase,
  ReorderUseCase,
  AddOrderNoteUseCase,
  SearchOrdersUseCase,
  GetOrdersByDateRangeUseCase,
  GetOrdersByStatusUseCase,
  
  // Use Cases - Tracking
  GetOrderTrackingUseCase,
  WatchOrderTrackingUseCase,
  UpdateTrackingUseCase,
  UpdateShippingInfoUseCase,
  GenerateTrackingUrlUseCase,
  
  // Use Cases - Cancellation & Returns
  CanCancelOrderUseCase,
  RequestCancellationUseCase,
  GetCancellationUseCase,
  ProcessCancellationUseCase,
  CanReturnOrderUseCase,
  RequestReturnUseCase,
  GetReturnUseCase,
  GetUserReturnsUseCase,
  UpdateReturnStatusUseCase,
  CalculateReturnRefundUseCase,
  GetReturnPolicyUseCase
  
  // Facade se registra automáticamente con providedIn: 'root'
];
