/**
 * Event Service Module - Handles event data retrieval, search, filtering, and mutations
 */

class EventService {
  constructor() {
    this.events = [];
    this.isLoaded = false;
    this.loadPromise = this.init();
  }

  async init() {
    const cached = window.storageManager.get(window.STORAGE_KEYS.EVENTS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      this.events = cached;
      this.isLoaded = true;
      return this.events;
    }

    try {
      const response = await fetch('data/mock-events.json');
      if (!response.ok) {
        throw new Error(`Failed to load mock-events.json: ${response.statusText}`);
      }
      const data = await response.json();
      this.events = data;
      window.storageManager.set(window.STORAGE_KEYS.EVENTS, this.events, false);
      this.isLoaded = true;
      return this.events;
    } catch (err) {
      console.error('[EventService] Error loading events:', err);
      this.events = [];
      return [];
    }
  }

  async getEvents() {
    if (!this.isLoaded) {
      await this.loadPromise;
    }
    // Always refresh from storage to catch newly added events or spot updates
    const stored = window.storageManager.get(window.STORAGE_KEYS.EVENTS);
    if (stored) {
      this.events = stored;
    }
    return [...this.events];
  }

  async getEventById(id) {
    const events = await this.getEvents();
    return events.find(e => String(e.id) === String(id)) || null;
  }

  async filterAndSearch({
    query = '',
    categories = [],
    dateFrom = null,
    dateTo = null,
    location = '',
    maxPrice = null,
    sortBy = 'upcoming'
  } = {}) {
    let list = await this.getEvents();

    // 1. Text search
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(e => {
        return (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.venue && e.venue.name && e.venue.name.toLowerCase().includes(q)) ||
          (e.venue && e.venue.city && e.venue.city.toLowerCase().includes(q))
        );
      });
    }

    // 2. Category multi-selection
    if (categories && categories.length > 0) {
      list = list.filter(e => categories.includes(e.category));
    }

    // 3. Date range filter
    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      list = list.filter(e => new Date(e.datetime).getTime() >= fromTime);
    }
    if (dateTo) {
      // End of that day
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      const toTime = toDate.getTime();
      list = list.filter(e => new Date(e.datetime).getTime() <= toTime);
    }

    // 4. Location filter
    if (location && location.trim()) {
      const loc = location.toLowerCase().trim();
      list = list.filter(e => {
        if (!e.venue) return false;
        const nameMatch = e.venue.name && e.venue.name.toLowerCase().includes(loc);
        const cityMatch = e.venue.city && e.venue.city.toLowerCase().includes(loc);
        const addrMatch = e.venue.address && e.venue.address.toLowerCase().includes(loc);
        return nameMatch || cityMatch || addrMatch;
      });
    }

    // 5. Price filter
    if (maxPrice !== null && maxPrice !== undefined && !isNaN(maxPrice)) {
      list = list.filter(e => Number(e.ticketPrice) <= Number(maxPrice));
    }

    // 6. Sorting
    list.sort((a, b) => {
      if (sortBy === 'upcoming') {
        return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
      }
      if (sortBy === 'price-low') {
        return a.ticketPrice - b.ticketPrice;
      }
      if (sortBy === 'price-high') {
        return b.ticketPrice - a.ticketPrice;
      }
      if (sortBy === 'spots-left') {
        return a.availableSpots - b.availableSpots;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }

  async getCategoryCounts() {
    const events = await this.getEvents();
    const counts = {};
    events.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }

  async reserveTickets(eventId, quantity, attendeeInfo) {
    const events = await this.getEvents();
    const eventIndex = events.findIndex(e => String(e.id) === String(eventId));
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const event = events[eventIndex];
    if (event.availableSpots < quantity) {
      throw new Error(`Only ${event.availableSpots} tickets remaining.`);
    }

    // Deduct spots
    event.availableSpots -= quantity;
    events[eventIndex] = event;
    window.storageManager.set(window.STORAGE_KEYS.EVENTS, events);

    // Create booking record
    const bookingId = `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentUser = window.storageManager.getCurrentUser();
    const newBooking = {
      id: bookingId,
      userId: currentUser ? currentUser.id : 'guest',
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.datetime,
      venueName: event.venue?.name || '',
      quantity,
      unitPrice: event.ticketPrice,
      totalPrice: (event.ticketPrice * quantity).toFixed(2),
      attendeeName: attendeeInfo.name,
      attendeeEmail: attendeeInfo.email,
      status: 'Confirmed',
      timestamp: new Date().toISOString()
    };

    const bookings = window.storageManager.get(window.STORAGE_KEYS.BOOKINGS, []);
    bookings.unshift(newBooking);
    window.storageManager.set(window.STORAGE_KEYS.BOOKINGS, bookings);

    return newBooking;
  }

  async createEvent(eventData) {
    const events = await this.getEvents();
    const id = `evt-${Date.now()}`;
    const newEvent = {
      id,
      title: eventData.title.trim(),
      description: eventData.description.trim(),
      category: eventData.category,
      datetime: new Date(eventData.datetime).toISOString(),
      venue: {
        name: eventData.venueName.trim(),
        address: eventData.venueAddress.trim(),
        city: eventData.venueCity.trim() || 'San Francisco, CA',
        lat: Number(eventData.lat) || 37.7749,
        lng: Number(eventData.lng) || -122.4194
      },
      ticketPrice: Number(eventData.ticketPrice) || 0,
      availableSpots: Number(eventData.totalSpots) || 50,
      totalSpots: Number(eventData.totalSpots) || 50,
      imageUrl: eventData.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
      organizer: {
        name: eventData.organizerName || 'Community Organizer',
        email: eventData.organizerEmail || 'organizer@events.io',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      },
      featured: false
    };

    events.unshift(newEvent);
    window.storageManager.set(window.STORAGE_KEYS.EVENTS, events);
    return newEvent;
  }

  async getBookingsForEvent(eventId) {
    const bookings = window.storageManager.get(window.STORAGE_KEYS.BOOKINGS, []);
    return bookings.filter(b => String(b.eventId) === String(eventId));
  }

  async getAllBookings() {
    return window.storageManager.get(window.STORAGE_KEYS.BOOKINGS, []);
  }
}

window.eventService = new EventService();
