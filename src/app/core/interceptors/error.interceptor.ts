// ===============================================
// ERROR INTERCEPTOR
// File: src/app/core/interceptors/error.interceptor.ts
// ===============================================

import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor to handle errors globally
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      // TODO: Implement proper error handling
      // - Show toast notifications
      // - Log to error tracking service
      // - Handle specific error codes
      
      console.error('HTTP Error:', error);
      
      // Handle specific error codes
      if (error.status === 401) {
        // Unauthorized - redirect to login
        console.error('Unauthorized access - redirecting to login');
      } else if (error.status === 403) {
        // Forbidden
        console.error('Access forbidden');
      } else if (error.status === 500) {
        // Server error
        console.error('Server error');
      }
      
      // Re-throw the error
      return throwError(() => error);
    })
  );

  
};