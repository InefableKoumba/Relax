/**
 * UI Component Module - Handles reusable components, rendering helpers, modals, and toasts
 */

class UIManager {
  constructor() {
    this.toastContainer = null;
    this._ensureToastContainer();
  }

  _ensureToastContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
      this.toastContainer = container;
    } else {
      this.toastContainer = document.getElementById('toast-container');
    }
  }

  showToast(message, type = 'info', duration = 3200) {
    this._ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
    if (type === 'success') {
      icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    }

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${this.escapeHTML(message)}</div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    });

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? String(hours).padStart(2, '0') : '12';
    return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
  }

  formatDateCompact(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day} • ${hours}:${minutes} ${ampm} PST`;
  }

  formatPrice(price) {
    const num = Number(price);
    if (isNaN(num) || num === 0) return 'FREE';
    return `$${num.toFixed(2)}`;
  }

  getCategoryBadge(category) {
    if (!category) return 'EVENT';
    if (category.toLowerCase().includes('conference')) return 'CONFERENCE';
    if (category.toLowerCase().includes('music')) return 'MUSIC';
    if (category.toLowerCase().includes('workshop')) return 'WORKSHOP';
    if (category.toLowerCase().includes('meetup')) return 'MEETUP';
    if (category.toLowerCase().includes('art') || category.toLowerCase().includes('exhibition')) return 'EXHIBITION';
    return category.toUpperCase().split(' ')[0];
  }

  /**
   * Renders a Catalog Card matching Wireframe 1 exactly
   */
  createCatalogCard(event) {
    const isFav = window.favoritesManager.isFavorite(event.id);
    const badge = this.getCategoryBadge(event.category);
    const priceText = this.formatPrice(event.ticketPrice);
    const dateText = this.formatDateCompact(event.datetime);
    const venueName = event.venue?.name || 'San Francisco, CA';

    const card = document.createElement('article');
    card.className = 'event-card';
    card.dataset.id = event.id;

    card.innerHTML = `
      <div class="card-media">
        <img src="${event.imageUrl}" alt="${this.escapeHTML(event.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'" />
        <button class="favorite-heart-btn ${isFav ? 'is-active' : ''}" 
                aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}" 
                data-event-id="${event.id}">
          <svg viewBox="0 0 24 24" class="heart-icon">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>

      <div class="card-content">
        <div class="card-top-row">
          <span class="category-pill">${badge}</span>
          <span class="price-pill ${event.ticketPrice === 0 ? 'price-free' : ''}">${priceText}</span>
        </div>

        <h3 class="card-title" title="${this.escapeHTML(event.title)}">
          <a href="event-details.html?id=${encodeURIComponent(event.id)}">${this.escapeHTML(event.title)}</a>
        </h3>

        <div class="card-meta-line">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span class="meta-text">${dateText}</span>
        </div>

        <div class="card-meta-line">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span class="meta-text truncate">${this.escapeHTML(venueName)}</span>
        </div>

        <div class="card-footer">
          <button class="btn btn-outline btn-block view-details-btn" data-event-id="${event.id}">
            VIEW DETAILS
          </button>
        </div>
      </div>
    `;

    // Event listeners
    const favBtn = card.querySelector('.favorite-heart-btn');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const nowFav = window.favoritesManager.toggleFavorite(event.id);
      favBtn.classList.toggle('is-active', nowFav);
      favBtn.setAttribute('aria-label', nowFav ? 'Remove from favorites' : 'Add to favorites');
      this.showToast(nowFav ? `Saved to Favorites` : `Removed from Favorites`, nowFav ? 'success' : 'info');
    });

    const viewDetailsBtn = card.querySelector('.view-details-btn');
    viewDetailsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `event-details.html?id=${encodeURIComponent(event.id)}`;
    });

    return card;
  }

  /**
   * Renders a Favorite Item Card matching Wireframe 2 exactly
   */
  createFavoriteCard(event) {
    const card = document.createElement('div');
    card.className = 'favorite-item-card';
    card.dataset.id = event.id;

    const dateText = this.formatDate(event.datetime);
    const priceText = this.formatPrice(event.ticketPrice);
    const venueName = event.venue?.name || 'San Francisco, CA';

    card.innerHTML = `
      <div class="fav-card-body">
        <div class="fav-thumb-wrap">
          <img class="fav-thumb" src="${event.imageUrl}" alt="${this.escapeHTML(event.title)}" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=300&q=80'" />
        </div>

        <div class="fav-info-wrap">
          <div class="fav-header-row">
            <h3 class="fav-title">
              <a href="event-details.html?id=${encodeURIComponent(event.id)}">${this.escapeHTML(event.title)}</a>
            </h3>
            <button class="fav-active-heart-btn" aria-label="Remove favorite" data-event-id="${event.id}">
              <svg viewBox="0 0 24 24" class="heart-icon filled">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>

          <div class="fav-meta-row">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${dateText}</span>
          </div>

          <div class="fav-pricing-row">
            <span class="fav-price">${priceText}</span>
            <span class="fav-venue-tag">${this.escapeHTML(venueName)}</span>
          </div>
        </div>
      </div>

      <div class="fav-actions-row">
        <button class="btn btn-outline fav-remove-btn" data-event-id="${event.id}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Remove
        </button>
        <button class="btn btn-primary fav-book-btn" data-event-id="${event.id}">
          BOOK NOW &rsaquo;
        </button>
      </div>
    `;

    // Listeners
    const removeBtn = card.querySelector('.fav-remove-btn');
    const heartBtn = card.querySelector('.fav-active-heart-btn');
    const handleRemove = (e) => {
      e.preventDefault();
      card.classList.add('removing');
      setTimeout(() => {
        window.favoritesManager.removeFavorite(event.id);
        this.showToast(`Removed "${event.title}" from favorites`, 'info');
      }, 200);
    };

    removeBtn.addEventListener('click', handleRemove);
    heartBtn.addEventListener('click', handleRemove);

    const bookBtn = card.querySelector('.fav-book-btn');
    bookBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.openBookingModal(event);
    });

    return card;
  }

  /**
   * Calendar (.ics) export generator
   */
  exportToCalendar(event) {
    if (!event) return;
    const startDate = new Date(event.datetime);
    // Default duration: 2.5 hours
    const endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);

    const formatICSDate = (d) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const location = `${event.venue?.name || ''}, ${event.venue?.address || ''}, ${event.venue?.city || ''}`;
    const cleanDesc = (event.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,');
    const cleanTitle = (event.title || 'Event').replace(/,/g, '\\,');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Relax Local Events//Event Discovery//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:relax-${event.id}-${Date.now()}@relaxevents.local`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${cleanTitle}`,
      `DESCRIPTION:${cleanDesc}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    this.showToast('Downloaded calendar file (.ics)!', 'success');
  }

  /**
   * Social share helper with Web Share API and fallback modal
   */
  async shareEvent(event) {
    const shareUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + `event-details.html?id=${encodeURIComponent(event.id)}`;
    const shareData = {
      title: event.title,
      text: `Check out ${event.title} happening on ${this.formatDate(event.datetime)}!`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        this.showToast('Event shared successfully!', 'success');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[Share] navigator.share error:', err);
        }
      }
    }

    // Fallback: Copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      this.showToast('Event link copied to clipboard!', 'success');
    } catch (e) {
      this.openShareModal(event, shareUrl);
    }
  }

  /**
   * Opens the RSVP / Booking Modal
   */
  openBookingModal(event) {
    let modal = document.getElementById('booking-modal');
    if (!modal) {
      modal = document.createElement('dialog');
      modal.id = 'booking-modal';
      modal.className = 'modal-dialog';
      document.body.appendChild(modal);
    }

    const currentUser = window.storageManager.getCurrentUser();
    const unitPrice = Number(event.ticketPrice) || 0;
    const maxTickets = Math.min(6, event.availableSpots || 1);

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="badge badge-accent">RSVP &amp; Tickets</span>
            <h2 class="modal-title">${this.escapeHTML(event.title)}</h2>
          </div>
          <button class="modal-close-btn" aria-label="Close dialog">&times;</button>
        </div>

        <form id="booking-form" class="modal-body">
          <div class="booking-event-summary">
            <div class="summary-line">
              <span>Date &amp; Time:</span>
              <strong>${this.formatDate(event.datetime)}</strong>
            </div>
            <div class="summary-line">
              <span>Location:</span>
              <strong>${this.escapeHTML(event.venue?.name || 'San Francisco, CA')}</strong>
            </div>
            <div class="summary-line">
              <span>Remaining Spots:</span>
              <strong class="highlight-spots">${event.availableSpots} available</strong>
            </div>
          </div>

          <div class="form-group">
            <label for="ticket-quantity" class="form-label">Number of Tickets</label>
            <div class="ticket-stepper">
              <button type="button" id="qty-minus" class="stepper-btn" aria-label="Decrease">&minus;</button>
              <input type="number" id="ticket-quantity" name="quantity" min="1" max="${maxTickets}" value="1" readonly class="stepper-input" />
              <button type="button" id="qty-plus" class="stepper-btn" aria-label="Increase">&plus;</button>
            </div>
          </div>

          <div class="form-group">
            <label for="attendee-name" class="form-label">Attendee Full Name</label>
            <input type="text" id="attendee-name" class="form-control" required value="${this.escapeHTML(currentUser?.name || '')}" placeholder="Jane Doe" />
          </div>

          <div class="form-group">
            <label for="attendee-email" class="form-label">Confirmation Email</label>
            <input type="email" id="attendee-email" class="form-control" required value="${this.escapeHTML(currentUser?.email || '')}" placeholder="jane@example.com" />
          </div>

          <div class="price-breakdown-box">
            <div class="price-row">
              <span>Price per ticket:</span>
              <span>${unitPrice === 0 ? 'FREE' : `$${unitPrice.toFixed(2)}`}</span>
            </div>
            <div class="price-row total-row">
              <span>Total Amount:</span>
              <span id="booking-total-display">${unitPrice === 0 ? 'FREE' : `$${unitPrice.toFixed(2)}`}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline modal-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="confirm-booking-btn">Confirm Reservation</button>
          </div>
        </form>
      </div>
    `;

    const closeBtn = modal.querySelector('.modal-close-btn');
    const cancelBtn = modal.querySelector('.modal-cancel-btn');
    const qtyInput = modal.querySelector('#ticket-quantity');
    const minusBtn = modal.querySelector('#qty-minus');
    const plusBtn = modal.querySelector('#qty-plus');
    const totalDisplay = modal.querySelector('#booking-total-display');
    const form = modal.querySelector('#booking-form');

    const updateTotal = () => {
      const qty = parseInt(qtyInput.value, 10) || 1;
      const total = qty * unitPrice;
      totalDisplay.textContent = total === 0 ? 'FREE' : `$${total.toFixed(2)}`;
    };

    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10);
      if (val > 1) {
        qtyInput.value = val - 1;
        updateTotal();
      }
    });

    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10);
      if (val < maxTickets) {
        qtyInput.value = val + 1;
        updateTotal();
      } else {
        this.showToast(`Cannot book more than ${maxTickets} spots.`, 'info');
      }
    });

    const closeModal = () => {
      modal.close();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const qty = parseInt(qtyInput.value, 10);
      const name = modal.querySelector('#attendee-name').value.trim();
      const email = modal.querySelector('#attendee-email').value.trim();

      if (!name || !email) {
        this.showToast('Please provide your name and email.', 'error');
        return;
      }

      try {
        const booking = await window.eventService.reserveTickets(event.id, qty, { name, email });
        closeModal();
        this.openConfirmationModal(event, booking);
        this.showToast(`Reserved ${qty} ticket(s) for ${event.title}!`, 'success');
      } catch (err) {
        this.showToast(err.message || 'Failed to complete reservation.', 'error');
      }
    });

    modal.showModal();
  }

  /**
   * Confirmation ticket pass modal
   */
  openConfirmationModal(event, booking) {
    let modal = document.getElementById('confirmation-modal');
    if (!modal) {
      modal = document.createElement('dialog');
      modal.id = 'confirmation-modal';
      modal.className = 'modal-dialog';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card confirmation-ticket-card">
        <div class="ticket-header-strip">
          <span class="ticket-badge">CONFIRMED RESERVATION</span>
          <button class="modal-close-btn" aria-label="Close dialog">&times;</button>
        </div>

        <div class="ticket-body">
          <div class="ticket-top">
            <span class="ticket-event-type">${this.escapeHTML(event.category)}</span>
            <h2 class="ticket-title">${this.escapeHTML(event.title)}</h2>
          </div>

          <div class="ticket-grid">
            <div class="ticket-cell">
              <span class="cell-label">ATTENDEE</span>
              <span class="cell-value">${this.escapeHTML(booking.attendeeName)}</span>
            </div>
            <div class="ticket-cell">
              <span class="cell-label">REFERENCE CODE</span>
              <span class="cell-value code-font">${booking.id}</span>
            </div>
            <div class="ticket-cell">
              <span class="cell-label">DATE &amp; TIME</span>
              <span class="cell-value">${this.formatDate(event.datetime)}</span>
            </div>
            <div class="ticket-cell">
              <span class="cell-label">VENUE</span>
              <span class="cell-value">${this.escapeHTML(event.venue?.name || 'San Francisco')}</span>
            </div>
            <div class="ticket-cell">
              <span class="cell-label">QUANTITY</span>
              <span class="cell-value">${booking.quantity} Ticket(s)</span>
            </div>
            <div class="ticket-cell">
              <span class="cell-label">TOTAL PAID</span>
              <span class="cell-value">${booking.totalPrice === '0.00' ? 'FREE' : `$${booking.totalPrice}`}</span>
            </div>
          </div>

          <div class="ticket-divider-tear">
            <div class="tear-notch left"></div>
            <div class="tear-line"></div>
            <div class="tear-notch right"></div>
          </div>

          <div class="ticket-barcode-area">
            <div class="barcode-graphic">
              <!-- Stylized SVG Barcode -->
              <svg viewBox="0 0 240 45" width="240" height="45">
                <rect x="0" y="0" width="3" height="45" fill="#0f172a" />
                <rect x="6" y="0" width="6" height="45" fill="#0f172a" />
                <rect x="15" y="0" width="2" height="45" fill="#0f172a" />
                <rect x="20" y="0" width="8" height="45" fill="#0f172a" />
                <rect x="32" y="0" width="3" height="45" fill="#0f172a" />
                <rect x="40" y="0" width="5" height="45" fill="#0f172a" />
                <rect x="50" y="0" width="2" height="45" fill="#0f172a" />
                <rect x="56" y="0" width="7" height="45" fill="#0f172a" />
                <rect x="68" y="0" width="4" height="45" fill="#0f172a" />
                <rect x="76" y="0" width="3" height="45" fill="#0f172a" />
                <rect x="84" y="0" width="9" height="45" fill="#0f172a" />
                <rect x="98" y="0" width="2" height="45" fill="#0f172a" />
                <rect x="105" y="0" width="6" height="45" fill="#0f172a" />
                <rect x="116" y="0" width="4" height="45" fill="#0f172a" />
                <rect x="124" y="0" width="8" height="45" fill="#0f172a" />
                <rect x="136" y="0" width="2" height="45" fill="#0f172a" />
                <rect x="142" y="0" width="5" height="45" fill="#0f172a" />
                <rect x="152" y="0" width="7" height="45" fill="#0f172a" />
                <rect x="164" y="0" width="3" height="45" fill="#0f172a" />
                <rect x="172" y="0" width="6" height="45" fill="#0f172a" />
                <rect x="182" y="0" width="2" height="45" fill="#0f172a" />
                <rect x="190" y="0" width="8" height="45" fill="#0f172a" />
                <rect x="202" y="0" width="4" height="45" fill="#0f172a" />
                <rect x="210" y="0" width="5" height="45" fill="#0f172a" />
                <rect x="220" y="0" width="3" height="45" fill="#0f172a" />
                <rect x="228" y="0" width="6" height="45" fill="#0f172a" />
              </svg>
            </div>
            <span class="barcode-number">${booking.id}</span>
          </div>

          <div class="ticket-action-bar">
            <button class="btn btn-primary" id="ticket-calendar-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Add to Calendar (.ics)
            </button>
            <button class="btn btn-outline" id="ticket-share-btn">Share Event</button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.close();
    });

    modal.querySelector('#ticket-calendar-btn').addEventListener('click', () => {
      this.exportToCalendar(event);
    });

    modal.querySelector('#ticket-share-btn').addEventListener('click', () => {
      this.shareEvent(event);
    });

    modal.showModal();
  }

  /**
   * Opens User Session Switcher / Profile Modal
   */
  openUserSessionModal() {
    let modal = document.getElementById('user-modal');
    if (!modal) {
      modal = document.createElement('dialog');
      modal.id = 'user-modal';
      modal.className = 'modal-dialog';
      document.body.appendChild(modal);
    }

    const currentUser = window.storageManager.getCurrentUser();
    const bookings = window.storageManager.get(window.STORAGE_KEYS.BOOKINGS, []);
    const favCount = window.favoritesManager.getFavorites().length;

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="user-profile-header">
            <img class="profile-avatar" src="${currentUser.avatar}" alt="${this.escapeHTML(currentUser.name)}" />
            <div>
              <h2 class="modal-title">${this.escapeHTML(currentUser.name)}</h2>
              <span class="user-role-badge ${currentUser.role === 'Organiser' ? 'badge-organizer' : 'badge-attendee'}">${currentUser.role}</span>
            </div>
          </div>
          <button class="modal-close-btn" aria-label="Close dialog">&times;</button>
        </div>

        <div class="modal-body">
          <div class="profile-stats-grid">
            <div class="stat-box">
              <span class="stat-number">${favCount}</span>
              <span class="stat-label">Saved Favorites</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">${bookings.length}</span>
              <span class="stat-label">Active Bookings</span>
            </div>
          </div>

          <div class="section-divider">Switch Active Session Mode</div>
          <p class="text-muted text-sm">Experience the app as either a discovery attendee or an event creator/organizer.</p>

          <div class="session-switch-options">
            <label class="session-card ${currentUser.role === 'Attendee' ? 'active' : ''}">
              <input type="radio" name="session-role" value="Attendee" ${currentUser.role === 'Attendee' ? 'checked' : ''} />
              <div class="session-desc">
                <strong>Attendee (Alex Morgan)</strong>
                <span>Discover local events, bookmark favorites, reserve tickets &amp; export dates.</span>
              </div>
            </label>

            <label class="session-card ${currentUser.role === 'Organiser' ? 'active' : ''}">
              <input type="radio" name="session-role" value="Organiser" ${currentUser.role === 'Organiser' ? 'checked' : ''} />
              <div class="session-desc">
                <strong>Organiser (Taylor Reed)</strong>
                <span>Create new listings, track registered attendee lists &amp; live capacity.</span>
              </div>
            </label>
          </div>

          ${currentUser.role === 'Organiser' ? `
            <div class="organizer-shortcut-box">
              <a href="organizer.html" class="btn btn-primary btn-block">Go to Organizer Attendee Tracker &rsaquo;</a>
            </div>
          ` : ''}

          <div class="section-divider">My Reservations</div>
          <div class="my-bookings-list">
            ${bookings.length === 0 ? '<p class="text-muted">No reservations yet. Browse events to book tickets!</p>' : ''}
            ${bookings.map(b => `
              <div class="mini-booking-item">
                <div class="booking-item-title">${this.escapeHTML(b.eventTitle)}</div>
                <div class="booking-item-meta">${b.quantity} Ticket(s) &bull; Ref: <code class="code-font">${b.id}</code></div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline modal-close-action">Done</button>
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector('.modal-close-btn');
    const closeAction = modal.querySelector('.modal-close-action');
    const closeModal = () => modal.close();

    closeBtn.addEventListener('click', closeModal);
    closeAction.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const radios = modal.querySelectorAll('input[name="session-role"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const newRole = e.target.value;
        window.storageManager.switchUserRole(newRole);
        this.showToast(`Switched profile mode to: ${newRole}`, 'success');
        setTimeout(() => {
          window.location.reload();
        }, 400);
      });
    });

    modal.showModal();
  }
}

window.uiManager = new UIManager();
