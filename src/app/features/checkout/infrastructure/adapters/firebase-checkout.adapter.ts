/**
 * Adapter: FirebaseCheckoutAdapter
 * Implementa la comunicación con Firestore para Checkout
 * Parte 1: Addresses y Payment Methods
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// ========== ADDRESSES ==========

export interface AddressDoc {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  references?: string;
  additionalInfo?: string;
  isDefault: boolean;
  label?: string;
  type: 'HOME' | 'OFFICE' | 'OTHER';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp;
}

// ========== PAYMENT METHODS ==========

export interface PaymentMethodDoc {
  id: string;
  userId: string;
  type: 'CARD' | 'PAYPAL' | 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';
  provider: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpiryMonth?: number;
  cardExpiryYear?: number;
  cardHolderName?: string;
  paypalEmail?: string;
  providerToken?: string;
  isDefault: boolean;
  label?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp;
}

@Injectable({ providedIn: 'root' })
export class FirebaseCheckoutAdapter {
  private readonly firestore = inject(Firestore);
  
  private readonly ADDRESSES_COLLECTION = 'addresses';
  private readonly PAYMENT_METHODS_COLLECTION = 'payment_methods';

  // ========== ADDRESS OPERATIONS ==========

  /**
   * Obtiene todas las direcciones del usuario
   */
  watchUserAddresses(userId: string): Observable<AddressDoc[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, this.ADDRESSES_COLLECTION),
        where('userId', '==', userId),
        orderBy('isDefault', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const addresses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as AddressDoc[];
          observer.next(addresses);
        },
        error => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Obtiene una dirección específica
   */
  async getAddress(addressId: string): Promise<AddressDoc | null> {
    const addressRef = doc(this.firestore, this.ADDRESSES_COLLECTION, addressId);
    const addressSnap = await getDoc(addressRef);

    if (!addressSnap.exists()) {
      return null;
    }

    return { id: addressSnap.id, ...addressSnap.data() } as AddressDoc;
  }

  /**
   * Crea una nueva dirección
   */
  async createAddress(userId: string, data: Omit<AddressDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<AddressDoc> {
    const addressRef = doc(collection(this.firestore, this.ADDRESSES_COLLECTION));

    // Si es la primera dirección o se marca como default, desmarcar otras
    if (data.isDefault) {
      await this.unsetAllDefaultAddresses(userId);
    }

    const newAddress: Omit<AddressDoc, 'id'> = {
      ...data,
      userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await setDoc(addressRef, newAddress);

    return { id: addressRef.id, ...newAddress } as AddressDoc;
  }

  /**
   * Actualiza una dirección
   */
  async updateAddress(addressId: string, data: Partial<AddressDoc>): Promise<void> {
    const addressRef = doc(this.firestore, this.ADDRESSES_COLLECTION, addressId);
    
    // Si se marca como default, desmarcar otras
    if (data.isDefault) {
      const address = await this.getAddress(addressId);
      if (address) {
        await this.unsetAllDefaultAddresses(address.userId);
      }
    }

    await updateDoc(addressRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Elimina una dirección
   */
  async deleteAddress(addressId: string): Promise<void> {
    const addressRef = doc(this.firestore, this.ADDRESSES_COLLECTION, addressId);
    await deleteDoc(addressRef);
  }

  /**
   * Establece una dirección como predeterminada
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await this.unsetAllDefaultAddresses(userId);
    
    const addressRef = doc(this.firestore, this.ADDRESSES_COLLECTION, addressId);
    await updateDoc(addressRef, {
      isDefault: true,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Desmarca todas las direcciones como default
   */
  private async unsetAllDefaultAddresses(userId: string): Promise<void> {
    const q = query(
      collection(this.firestore, this.ADDRESSES_COLLECTION),
      where('userId', '==', userId),
      where('isDefault', '==', true)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isDefault: false });
    });

    await batch.commit();
  }

  // ========== PAYMENT METHOD OPERATIONS ==========

  /**
   * Obtiene todos los métodos de pago del usuario
   */
  watchUserPaymentMethods(userId: string): Observable<PaymentMethodDoc[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, this.PAYMENT_METHODS_COLLECTION),
        where('userId', '==', userId),
        orderBy('isDefault', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const methods = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as PaymentMethodDoc[];
          observer.next(methods);
        },
        error => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Obtiene un método de pago específico
   */
  async getPaymentMethod(methodId: string): Promise<PaymentMethodDoc | null> {
    const methodRef = doc(this.firestore, this.PAYMENT_METHODS_COLLECTION, methodId);
    const methodSnap = await getDoc(methodRef);

    if (!methodSnap.exists()) {
      return null;
    }

    return { id: methodSnap.id, ...methodSnap.data() } as PaymentMethodDoc;
  }

  /**
   * Crea un nuevo método de pago
   */
  async createPaymentMethod(
    userId: string,
    data: Omit<PaymentMethodDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<PaymentMethodDoc> {
    const methodRef = doc(collection(this.firestore, this.PAYMENT_METHODS_COLLECTION));

    // Si es el primero o se marca como default, desmarcar otros
    if (data.isDefault) {
      await this.unsetAllDefaultPaymentMethods(userId);
    }

    const newMethod: Omit<PaymentMethodDoc, 'id'> = {
      ...data,
      userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await setDoc(methodRef, newMethod);

    return { id: methodRef.id, ...newMethod } as PaymentMethodDoc;
  }

  /**
   * Elimina un método de pago
   */
  async deletePaymentMethod(methodId: string): Promise<void> {
    const methodRef = doc(this.firestore, this.PAYMENT_METHODS_COLLECTION, methodId);
    await deleteDoc(methodRef);
  }

  /**
   * Establece un método de pago como predeterminado
   */
  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    await this.unsetAllDefaultPaymentMethods(userId);
    
    const methodRef = doc(this.firestore, this.PAYMENT_METHODS_COLLECTION, methodId);
    await updateDoc(methodRef, {
      isDefault: true,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Desmarca todos los métodos de pago como default
   */
  private async unsetAllDefaultPaymentMethods(userId: string): Promise<void> {
    const q = query(
      collection(this.firestore, this.PAYMENT_METHODS_COLLECTION),
      where('userId', '==', userId),
      where('isDefault', '==', true)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isDefault: false });
    });

    await batch.commit();
  }

  // ========== CHECKOUT SESSION OPERATIONS ==========
  // Las operaciones de checkout session se implementarán aquí
  // Por ahora, estas son operaciones preparadas para la integración completa

  // ========== ORDER OPERATIONS ==========
  // Las operaciones de órdenes se gestionarán en el Orders Module
  // Este adapter se enfoca en addresses y payment methods
}
