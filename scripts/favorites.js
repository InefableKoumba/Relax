/**
 * Favorites Module - Handles saving, retrieving, sorting, and removing favorite events
 */

class FavoritesManager {
  constructor() {
    this._listeners = new Set();
    // Listen for storage updates across tabs or modules
    window.addEventListener('relax:storage-changed', (e) => {
      if (e.detail && e.detail.key === window.STORAGE_KEYS.FAVORITES) {
        this._notify();
      }
    });
  }

  getFavorites() {
    return window.storageManager.get(window.STORAGE_KEYS.FAVORITES, []);
  }

  isFavorite(eventId) {
    const list = this.getFavorites();
    return list.some(item => String(item.eventId) === String(eventId));
  }

  addFavorite(eventId) {
    const list = this.getFavorites();
    if (!this.isFavorite(eventId)) {
      const currentUser = window.storageManager.getCurrentUser();
      list.push({
        id: `fav-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: currentUser ? currentUser.id : 'guest',
        eventId: String(eventId),
        savedAt: new Date().toISOString()
      });
      window.storageManager.set(window.STORAGE_KEYS.FAVORITES, list);
      this._notify();
      return true;
    }
    return false;
  }

  removeFavorite(eventId) {
    let list = this.getFavorites();
    const initialLength = list.length;
    list = list.filter(item => String(item.eventId) !== String(eventId));
    if (list.length !== initialLength) {
      window.storageManager.set(window.STORAGE_KEYS.FAVORITES, list);
      this._notify();
      return true;
    }
    return false;
  }

  toggleFavorite(eventId) {
    if (this.isFavorite(eventId)) {
      this.removeFavorite(eventId);
      return false; // now false
    } else {
      this.addFavorite(eventId);
      return true; // now true
    }
  }

  clearAll() {
    window.storageManager.set(window.STORAGE_KEYS.FAVORITES, []);
    this._notify();
  }

  async getFavoriteEventsWithDetails() {
    const favs = this.getFavorites();
    const allEvents = await window.eventService.getEvents();
    
    // Map favorite entries to full event data
    return favs
      .map(fav => {
        const evt = allEvents.find(e => String(e.id) === String(fav.eventId));
        if (!evt) return null;
        return {
          ...evt,
          favoriteRecordId: fav.id,
          savedAt: fav.savedAt
        };
      })
      .filter(Boolean);
  }

  async getFavoritesThisMonth() {
    const events = await this.getFavoriteEventsWithDetails();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return events.filter(evt => {
      const d = new Date(evt.datetime);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }

  onChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify() {
    const count = this.getFavorites().length;
    this._updateBadges(count);
    this._listeners.forEach(cb => {
      try { cb(count); } catch (e) { console.error(e); }
    });
  }

  _updateBadges(count) {
    const badgeElements = document.querySelectorAll('.favorites-count-badge');
    badgeElements.forEach(el => {
      el.textContent = count;
      if (count > 0) {
        el.style.display = 'inline-flex';
      } else {
        el.style.display = 'inline-flex';
      }
    });

    const labelElements = document.querySelectorAll('.favorites-nav-label');
    labelElements.forEach(el => {
      el.textContent = `FAVORITES (${count})`;
    });
  }
}

window.favoritesManager = new FavoritesManager();
