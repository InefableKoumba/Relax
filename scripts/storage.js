/**
 * Storage Module - Manages LocalStorage persistence and reactive state
 * Provides synchronous access and cross-tab/cross-component event broadcasting.
 */

const STORAGE_KEYS = {
  EVENTS: 'relax_events_v1',
  FAVORITES: 'relax_favorites_v1',
  BOOKINGS: 'relax_bookings_v1',
  CURRENT_USER: 'relax_current_user_v1',
  USERS: 'relax_users_v1'
};

const DEFAULT_USERS = [
  {
    id: 'usr-001',
    name: 'Alex Morgan',
    email: 'alex.morgan@design.io',
    role: 'Attendee',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-002',
    name: 'Taylor Reed',
    email: 'curator@soundscape.live',
    role: 'Organiser',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  }
];

class StorageManager {
  constructor() {
    this._initSession();
  }

  _initSession() {
    if (!this.get(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, DEFAULT_USERS, false);
    }
    if (!this.get(STORAGE_KEYS.CURRENT_USER)) {
      this.set(STORAGE_KEYS.CURRENT_USER, DEFAULT_USERS[0], false);
    }
    // Seed initial favorites matching the wireframe prompt if empty
    if (this.get(STORAGE_KEYS.FAVORITES) === null) {
      const now = new Date();
      const initialFavs = [
        { id: 'fav-1', userId: 'usr-001', eventId: 'evt-001', savedAt: new Date(now.getTime() - 86400000 * 2).toISOString() },
        { id: 'fav-2', userId: 'usr-001', eventId: 'evt-003', savedAt: new Date(now.getTime() - 86400000).toISOString() },
        { id: 'fav-3', userId: 'usr-001', eventId: 'evt-008', savedAt: now.toISOString() }
      ];
      this.set(STORAGE_KEYS.FAVORITES, initialFavs, false);
    }
    if (this.get(STORAGE_KEYS.BOOKINGS) === null) {
      const demoBookings = [
        {
          id: 'BK-2025-90142',
          userId: 'usr-001',
          eventId: 'evt-001',
          eventTitle: 'Design Systems Summit 2025',
          quantity: 2,
          unitPrice: 149.00,
          totalPrice: 298.00,
          attendeeName: 'Alex Morgan',
          attendeeEmail: 'alex.morgan@design.io',
          status: 'Confirmed',
          timestamp: '2025-10-14T15:20:00.000Z'
        }
      ];
      this.set(STORAGE_KEYS.BOOKINGS, demoBookings, false);
    }
  }

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[Storage] Failed to read ${key}:`, e);
      return defaultValue;
    }
  }

  set(key, value, notify = true) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (notify) {
        window.dispatchEvent(new CustomEvent('relax:storage-changed', {
          detail: { key, value }
        }));
      }
      return true;
    } catch (e) {
      console.error(`[Storage] Failed to write ${key}:`, e);
      return false;
    }
  }

  remove(key, notify = true) {
    try {
      localStorage.removeItem(key);
      if (notify) {
        window.dispatchEvent(new CustomEvent('relax:storage-changed', {
          detail: { key, value: null }
        }));
      }
    } catch (e) {
      console.error(`[Storage] Failed to remove ${key}:`, e);
    }
  }

  getCurrentUser() {
    return this.get(STORAGE_KEYS.CURRENT_USER) || DEFAULT_USERS[0];
  }

  setCurrentUser(user) {
    return this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  switchUserRole(role) {
    const users = this.get(STORAGE_KEYS.USERS) || DEFAULT_USERS;
    const target = users.find(u => u.role.toLowerCase() === role.toLowerCase()) || users[0];
    this.setCurrentUser(target);
    return target;
  }
}

// Global singleton instance
window.storageManager = new StorageManager();
window.STORAGE_KEYS = STORAGE_KEYS;
