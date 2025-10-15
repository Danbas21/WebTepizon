/**
 * Adapter: FirebaseWishlistAdapter
 * Implementa la comunicación con Firestore para Wishlist
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface WishlistDoc {
  id: string;
  userId: string;
  items: WishlistItemDoc[];
  settings: {
    isPublic: boolean;
    shareToken?: string;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSyncedAt: Timestamp;
}

export interface WishlistItemDoc {
  id: string;
  productId: string;
  variantId?: string;
  productSnapshot: {
    name: string;
    brand: string;
    mainImage: string;
    slug: string;
  };
  variantSnapshot?: {
    sku: string;
    size?: string;
    color?: string;
    price: number;
    compareAtPrice?: number;
    image?: string;
  };
  currentPrice: number;
  originalPrice: number;
  isAvailable: boolean;
  isInStock: boolean;
  stockQuantity: number;
  priceAlertEnabled: boolean;
  priceAlertThreshold?: number;
  stockAlertEnabled: boolean;
  addedAt: Timestamp;
  updatedAt: Timestamp;
  lastCheckedAt: Timestamp;
  notes?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface WishlistAlertDoc {
  id: string;
  wishlistItemId: string;
  type: 'PRICE_DROP' | 'BACK_IN_STOCK' | 'LOW_STOCK' | 'PRICE_INCREASE';
  message: string;
  oldValue?: number;
  newValue?: number;
  createdAt: Timestamp;
  isRead: boolean;
}

@Injectable({ providedIn: 'root' })
export class FirebaseWishlistAdapter {
  private readonly firestore = inject(Firestore);
  private readonly WISHLISTS_COLLECTION = 'wishlists';
  private readonly ALERTS_COLLECTION = 'wishlist_alerts';

  /**
   * Obtiene la wishlist de un usuario (una vez)
   */
  async getWishlist(userId: string): Promise<WishlistDoc | null> {
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);
    const wishlistSnap = await getDoc(wishlistRef);

    if (!wishlistSnap.exists()) {
      return this.createEmptyWishlist(userId);
    }

    return { id: wishlistSnap.id, ...wishlistSnap.data() } as WishlistDoc;
  }

  /**
   * Observa cambios en tiempo real de la wishlist
   */
  watchWishlist(userId: string): Observable<WishlistDoc> {
    return new Observable(observer => {
      const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);
      
      const unsubscribe = onSnapshot(
        wishlistRef,
        async (snapshot) => {
          if (!snapshot.exists()) {
            const emptyWishlist = await this.createEmptyWishlist(userId);
            observer.next(emptyWishlist);
          } else {
            observer.next({ id: snapshot.id, ...snapshot.data() } as WishlistDoc);
          }
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Agrega un item a la wishlist
   */
  async addItem(userId: string, item: Omit<WishlistItemDoc, 'id'>): Promise<WishlistItemDoc> {
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);
    const wishlist = await this.getWishlist(userId);

    const newItem: WishlistItemDoc = {
      ...item,
      id: doc(collection(this.firestore, 'temp')).id,
      addedAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      lastCheckedAt: serverTimestamp() as Timestamp
    };

    const updatedItems = [...(wishlist?.items || []), newItem];

    await setDoc(wishlistRef, {
      userId,
      items: updatedItems,
      settings: wishlist?.settings || {
        isPublic: false,
        notificationsEnabled: true,
        emailNotifications: false
      },
      updatedAt: serverTimestamp(),
      lastSyncedAt: serverTimestamp()
    }, { merge: true });

    return newItem;
  }

  /**
   * Remueve un item de la wishlist
   */
  async removeItem(userId: string, itemId: string): Promise<void> {
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);
    const wishlist = await this.getWishlist(userId);

    if (!wishlist) return;

    const updatedItems = wishlist.items.filter(item => item.id !== itemId);

    await updateDoc(wishlistRef, {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Actualiza un item de la wishlist
   */
  async updateItem(
    userId: string, 
    itemId: string, 
    updates: Partial<WishlistItemDoc>
  ): Promise<WishlistItemDoc | null> {
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);
    const wishlist = await this.getWishlist(userId);

    if (!wishlist) return null;

    const itemIndex = wishlist.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    const updatedItems = [...wishlist.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      ...updates,
      updatedAt: serverTimestamp() as Timestamp
    };

    await updateDoc(wishlistRef, {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });

    return updatedItems[itemIndex];
  }

  /**
   * Verifica si un producto está en la wishlist
   */
  async checkIfInWishlist(
    userId: string, 
    productId: string, 
    variantId?: string
  ): Promise<boolean> {
    const wishlist = await this.getWishlist(userId);
    
    if (!wishlist) return false;

    return wishlist.items.some(item => {
      if (variantId) {
        return item.productId === productId && item.variantId === variantId;
      }
      return item.productId === productId;
    });
  }

  /**
   * Obtiene un item específico
   */
  async getItem(userId: string, itemId: string): Promise<WishlistItemDoc | null> {
    const wishlist = await this.getWishlist(userId);
    
    if (!wishlist) return null;

    return wishlist.items.find(item => item.id === itemId) || null;
  }

  /**
   * Limpia toda la wishlist
   */
  async clearWishlist(userId: string): Promise<void> {
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);
    
    await updateDoc(wishlistRef, {
      items: [],
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Actualiza la configuración de la wishlist
   */
  async updateSettings(
    userId: string, 
    settings: Partial<WishlistDoc['settings']>
  ): Promise<void> {
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);
    const wishlist = await this.getWishlist(userId);

    if (!wishlist) return;

    await updateDoc(wishlistRef, {
      settings: { ...wishlist.settings, ...settings },
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Genera un token para compartir
   */
  async generateShareToken(userId: string): Promise<string> {
    const shareToken = this.generateRandomToken();
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);

    await updateDoc(wishlistRef, {
      'settings.shareToken': shareToken,
      'settings.isPublic': true,
      updatedAt: serverTimestamp()
    });

    return shareToken;
  }

  /**
   * Obtiene una wishlist compartida por su token
   */
  async getSharedWishlist(shareToken: string): Promise<WishlistDoc | null> {
    const q = query(
      collection(this.firestore, this.WISHLISTS_COLLECTION),
      where('settings.shareToken', '==', shareToken),
      where('settings.isPublic', '==', true)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WishlistDoc;
  }

  /**
   * Revoca el token de compartir
   */
  async revokeShareToken(userId: string): Promise<void> {
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);

    await updateDoc(wishlistRef, {
      'settings.shareToken': null,
      'settings.isPublic': false,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Guarda una alerta
   */
  async saveAlert(userId: string, alert: Omit<WishlistAlertDoc, 'id'>): Promise<void> {
    const alertRef = doc(collection(this.firestore, this.ALERTS_COLLECTION));
    
    await setDoc(alertRef, {
      ...alert,
      userId,
      id: alertRef.id,
      createdAt: serverTimestamp(),
      isRead: false
    });
  }

  /**
   * Obtiene las alertas del usuario
   */
  async getAlerts(userId: string, unreadOnly: boolean = false): Promise<WishlistAlertDoc[]> {
    let q = query(
      collection(this.firestore, this.ALERTS_COLLECTION),
      where('userId', '==', userId)
    );

    if (unreadOnly) {
      q = query(q, where('isRead', '==', false));
    }

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WishlistAlertDoc[];
  }

  /**
   * Marca una alerta como leída
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    const alertRef = doc(this.firestore, this.ALERTS_COLLECTION, alertId);
    await updateDoc(alertRef, { isRead: true });
  }

  /**
   * Marca todas las alertas como leídas
   */
  async markAllAlertsAsRead(userId: string): Promise<void> {
    const alerts = await this.getAlerts(userId, true);
    const batch = writeBatch(this.firestore);

    alerts.forEach(alert => {
      const alertRef = doc(this.firestore, this.ALERTS_COLLECTION, alert.id);
      batch.update(alertRef, { isRead: true });
    });

    await batch.commit();
  }

  // ========== HELPERS ==========

  private async createEmptyWishlist(userId: string): Promise<WishlistDoc> {
    const wishlistRef = doc(this.firestore, this.WISHLISTS_COLLECTION, userId);
    
    const emptyWishlist: Omit<WishlistDoc, 'id'> = {
      userId,
      items: [],
      settings: {
        isPublic: false,
        notificationsEnabled: true,
        emailNotifications: false
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      lastSyncedAt: serverTimestamp() as Timestamp
    };

    await setDoc(wishlistRef, emptyWishlist);
    
    return { id: userId, ...emptyWishlist } as WishlistDoc;
  }

  private generateRandomToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
