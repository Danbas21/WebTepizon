
// ===============================================
// AUTH INTERCEPTOR
// File: src/app/core/interceptors/auth.interceptor.ts
// ===============================================

import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP Interceptor to add authentication token to requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // TODO: Get token from auth service
  // const token = authService.getToken();
  
  // For now, just pass through the request
  // Later, you'll add the auth token here
  
  // Example of how to add token:
  // if (token) {
  //   req = req.clone({
  //     setHeaders: {
  //       Authorization: `Bearer ${token}`
  //     }
  //   });
  // }
  
  return next(req);
};

