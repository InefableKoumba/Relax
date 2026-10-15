/**
 * App Module - Primary controller and page routing logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Update header badges
  const favCount = window.favoritesManager.getFavorites().length;
  window.favoritesManager._updateBadges(favCount);

  // Bind global navigation buttons
  bindGlobalNav();

  // Detect current page view
  const pathname = window.location.pathname;
  if (pathname.endsWith('favorites.html') || pathname.includes('favorites')) {
    initFavoritesPage();
  } else if (pathname.endsWith('event-details.html') || pathname.includes('event-details')) {
    initEventDetailsPage();
  } else if (pathname.endsWith('organizer.html') || pathname.includes('organizer')) {
    initOrganizerPage();
  } else {
    // Default to main catalog
    initCatalogPage();
  }
});

/**
 * Global Nav & Header bindings
 */
function bindGlobalNav() {
  const profileBtns = document.querySelectorAll('.profile-btn, .nav-profile-link');
  profileBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.uiManager.openUserSessionModal();
    });
  });

  const currentUser = window.storageManager.getCurrentUser();
  const profileAvatars = document.querySelectorAll('.header-user-avatar');
  profileAvatars.forEach(img => {
    img.src = currentUser.avatar;
    img.alt = currentUser.name;
  });

  // Organizer quick nav badge if user is organizer
  const organizerNavLinks = document.querySelectorAll('.nav-organizer-link');
  organizerNavLinks.forEach(link => {
    if (currentUser.role === 'Organiser') {
      link.style.display = 'inline-flex';
    } else {
      link.style.display = 'none';
    }
  });
}

/**
 * =========================================================================
 * CATALOG PAGE LOGIC (index.html)
 * =========================================================================
 */
let currentFilterState = {
  query: '',
  categories: [],
  dateFrom: null,
  dateTo: null,
  location: '',
  maxPrice: 250,
  sortBy: 'upcoming',
  currentPage: 1,
  pageSize: 9
};

async function initCatalogPage() {
  const catalogGrid = document.getElementById('catalog-grid');
  if (!catalogGrid) return;

  // Initialize Category Checkboxes & Counts
  await setupCategoryFilters();

  // Search input with debounce
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilterState.query = e.target.value;
        currentFilterState.currentPage = 1;
        applyFiltersAndRender();
      }, 250);
    });
  }

  // Location filter input
  const locationInput = document.getElementById('filter-location-input');
  if (locationInput) {
    let debounceTimer;
    locationInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilterState.location = e.target.value;
        currentFilterState.currentPage = 1;
        applyFiltersAndRender();
      }, 250);
    });
  }

  // Date Range Inputs
  const dateFromInput = document.getElementById('date-from-input');
  const dateToInput = document.getElementById('date-to-input');
  if (dateFromInput) {
    dateFromInput.addEventListener('change', (e) => {
      currentFilterState.dateFrom = e.target.value || null;
      currentFilterState.currentPage = 1;
      applyFiltersAndRender();
    });
  }
  if (dateToInput) {
    dateToInput.addEventListener('change', (e) => {
      currentFilterState.dateTo = e.target.value || null;
      currentFilterState.currentPage = 1;
      applyFiltersAndRender();
    });
  }

  // Price Range Slider
  const priceSlider = document.getElementById('price-range-slider');
  const priceDisplay = document.getElementById('price-slider-display');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      currentFilterState.maxPrice = val;
      priceDisplay.textContent = val >= 250 ? '$0 - $250+' : `$0 - $${val}`;
      currentFilterState.currentPage = 1;
      applyFiltersAndRender();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilterState.sortBy = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Reset All Filters button
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetAllFilters();
    });
  }

  // Apply filters button (for mobile drawer or explicit apply)
  const applyBtn = document.getElementById('apply-filters-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applyFiltersAndRender();
      window.uiManager.showToast('Filters applied', 'info');
    });
  }

  // Listen for favorites changes to re-render hearts
  window.favoritesManager.onChange(() => {
    applyFiltersAndRender(false);
  });

  // Initial load
  await applyFiltersAndRender();
}

async function setupCategoryFilters() {
  const container = document.getElementById('categories-filter-list');
  if (!container) return;

  const counts = await window.eventService.getCategoryCounts();
  const allCategories = [
    { name: 'Tech & Design Conferences', label: 'Tech & Design Conferences' },
    { name: 'Music & Acoustic Nights', label: 'Music & Acoustic Nights' },
    { name: 'Workshops & Masterclasses', label: 'Workshops & Masterclasses' },
    { name: 'Art Exhibitions & Galas', label: 'Art Exhibitions & Galas' },
    { name: 'Community Meetups', label: 'Community Meetups' }
  ];

  container.innerHTML = allCategories.map(cat => {
    const count = counts[cat.name] || 0;
    return `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="category" value="${cat.name}" class="category-checkbox" />
        <span class="custom-checkbox"></span>
        <span class="category-name">${cat.label}</span>
        <span class="count-badge">(${count})</span>
      </label>
    `;
  }).join('');

  container.querySelectorAll('.category-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const selected = Array.from(container.querySelectorAll('.category-checkbox:checked')).map(el => el.value);
      currentFilterState.categories = selected;
      currentFilterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });
}

function resetAllFilters() {
  currentFilterState = {
    query: '',
    categories: [],
    dateFrom: null,
    dateTo: null,
    location: '',
    maxPrice: 250,
    sortBy: 'upcoming',
    currentPage: 1,
    pageSize: 9
  };

  const searchInput = document.getElementById('header-search-input');
  if (searchInput) searchInput.value = '';

  const locationInput = document.getElementById('filter-location-input');
  if (locationInput) locationInput.value = '';

  const dateFromInput = document.getElementById('date-from-input');
  if (dateFromInput) dateFromInput.value = '';

  const dateToInput = document.getElementById('date-to-input');
  if (dateToInput) dateToInput.value = '';

  const priceSlider = document.getElementById('price-range-slider');
  const priceDisplay = document.getElementById('price-slider-display');
  if (priceSlider) priceSlider.value = 250;
  if (priceDisplay) priceDisplay.textContent = '$0 - $250+';

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'upcoming';

  const checkboxes = document.querySelectorAll('.category-checkbox');
  checkboxes.forEach(cb => cb.checked = false);

  applyFiltersAndRender();
  window.uiManager.showToast('All filters have been reset', 'info');
}

async function applyFiltersAndRender(showLoading = true) {
  const catalogGrid = document.getElementById('catalog-grid');
  const countDisplay = document.getElementById('events-count-display');
  if (!catalogGrid) return;

  if (showLoading) {
    catalogGrid.innerHTML = `
      <div class="loading-state-wrapper">
        <div class="spinner"></div>
        <p>Loading matching events...</p>
      </div>
    `;
  }

  const filteredEvents = await window.eventService.filterAndSearch({
    query: currentFilterState.query,
    categories: currentFilterState.categories,
    dateFrom: currentFilterState.dateFrom,
    dateTo: currentFilterState.dateTo,
    location: currentFilterState.location,
    maxPrice: currentFilterState.maxPrice,
    sortBy: currentFilterState.sortBy
  });

  const total = filteredEvents.length;
  const startIndex = (currentFilterState.currentPage - 1) * currentFilterState.pageSize;
  const endIndex = Math.min(startIndex + currentFilterState.pageSize, total);
  const pagedEvents = filteredEvents.slice(startIndex, endIndex);

  // Update header count display: "Showing 9 of 135 matching events"
  if (countDisplay) {
    countDisplay.textContent = `Showing ${pagedEvents.length} of ${total} matching events`;
  }

  if (pagedEvents.length === 0) {
    catalogGrid.innerHTML = `
      <div class="empty-results-box">
        <div class="empty-icon">&#128269;</div>
        <h3>No events match your search</h3>
        <p>Try adjusting your category, price slider, or date range filters.</p>
        <button class="btn btn-primary" onclick="resetAllFilters()">Reset Filters</button>
      </div>
    `;
    renderPagination(0, 1);
    return;
  }

  catalogGrid.innerHTML = '';
  pagedEvents.forEach(evt => {
    const card = window.uiManager.createCatalogCard(evt);
    catalogGrid.appendChild(card);
  });

  const totalPages = Math.ceil(total / currentFilterState.pageSize);
  renderPagination(totalPages, currentFilterState.currentPage);
}

function renderPagination(totalPages, currentPage) {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<span class="page-indicator">Page ${currentPage} of ${totalPages}</span>`;
  html += `<div class="page-buttons-group">`;

  // Previous button
  if (currentPage > 1) {
    html += `<button class="pagination-btn" data-page="${currentPage - 1}">&lsaquo; Prev</button>`;
  }

  // Page numbers
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
      html += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    } else if (p === currentPage - 2 || p === currentPage + 2) {
      html += `<span class="pagination-dots">...</span>`;
    }
  }

  // Next button
  if (currentPage < totalPages) {
    html += `<button class="pagination-btn" data-page="${currentPage + 1}">Next &rsaquo;</button>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetPage = parseInt(btn.dataset.page, 10);
      if (targetPage && targetPage !== currentFilterState.currentPage) {
        currentFilterState.currentPage = targetPage;
        applyFiltersAndRender();
        window.scrollTo({ top: 180, behavior: 'smooth' });
      }
    });
  });
}

/**
 * =========================================================================
 * FAVORITES PAGE LOGIC (favorites.html) - Matching Wireframe 2
 * =========================================================================
 */
let favoritesActiveTab = 'all'; // 'all' or 'this-month'

async function initFavoritesPage() {
  const listContainer = document.getElementById('favorites-list-container');
  if (!listContainer) return;

  // Tabs: ALL (3) vs THIS MONTH (2)
  const tabAllBtn = document.getElementById('fav-tab-all');
  const tabMonthBtn = document.getElementById('fav-tab-month');
  const clearAllBtn = document.getElementById('fav-clear-all-btn');

  if (tabAllBtn) {
    tabAllBtn.addEventListener('click', () => {
      favoritesActiveTab = 'all';
      tabAllBtn.classList.add('active');
      if (tabMonthBtn) tabMonthBtn.classList.remove('active');
      renderFavoritesList();
    });
  }

  if (tabMonthBtn) {
    tabMonthBtn.addEventListener('click', () => {
      favoritesActiveTab = 'this-month';
      tabMonthBtn.classList.add('active');
      if (tabAllBtn) tabAllBtn.classList.remove('active');
      renderFavoritesList();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all your saved favorites?')) {
        window.favoritesManager.clearAll();
        window.uiManager.showToast('Cleared all saved favorites', 'info');
        renderFavoritesList();
      }
    });
  }

  // Live search within favorites
  const favSearchInput = document.getElementById('fav-search-input');
  if (favSearchInput) {
    favSearchInput.addEventListener('input', () => {
      renderFavoritesList();
    });
  }

  // Re-render when favorites change in real-time
  window.favoritesManager.onChange(() => {
    renderFavoritesList();
  });

  await renderFavoritesList();
}

async function renderFavoritesList() {
  const listContainer = document.getElementById('favorites-list-container');
  const countHeading = document.getElementById('favorites-count-heading');
  const tabAllBtn = document.getElementById('fav-tab-all');
  const tabMonthBtn = document.getElementById('fav-tab-month');
  const favSearchInput = document.getElementById('fav-search-input');

  if (!listContainer) return;

  const allFavEvents = await window.favoritesManager.getFavoriteEventsWithDetails();
  const monthFavEvents = await window.favoritesManager.getFavoritesThisMonth();

  // Update tabs labels with dynamic count
  if (tabAllBtn) tabAllBtn.textContent = `ALL (${allFavEvents.length})`;
  if (tabMonthBtn) tabMonthBtn.textContent = `THIS MONTH (${monthFavEvents.length})`;
  if (countHeading) countHeading.textContent = `${allFavEvents.length} Saved Events`;

  let itemsToDisplay = favoritesActiveTab === 'this-month' ? monthFavEvents : allFavEvents;

  // Apply query filter if present
  if (favSearchInput && favSearchInput.value.trim()) {
    const q = favSearchInput.value.toLowerCase().trim();
    itemsToDisplay = itemsToDisplay.filter(e => 
      e.title.toLowerCase().includes(q) || 
      (e.venue?.name && e.venue.name.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q)
    );
  }

  listContainer.innerHTML = '';

  if (itemsToDisplay.length === 0) {
    const emptyMsg = favSearchInput && favSearchInput.value.trim()
      ? 'No saved favorites match your query.'
      : (favoritesActiveTab === 'this-month' 
        ? 'No saved events scheduled for this month.' 
        : 'You have not saved any events to your favorites yet.');
    
    listContainer.innerHTML = `
      <div class="empty-favorites-box">
        <svg class="empty-heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <p>${emptyMsg}</p>
        <a href="index.html" class="btn btn-primary">Discover Events</a>
      </div>
    `;
  } else {
    itemsToDisplay.forEach(evt => {
      const card = window.uiManager.createFavoriteCard(evt);
      listContainer.appendChild(card);
    });
  }

  // Append dashed "EXPLORE MORE EVENTS" box matching Wireframe 2
  const exploreBox = document.createElement('div');
  exploreBox.className = 'explore-more-card';
  exploreBox.innerHTML = `
    <a href="index.html" class="explore-more-link">
      <div class="explore-plus-icon">+</div>
      <div class="explore-content">
        <h4 class="explore-title">EXPLORE MORE EVENTS</h4>
        <p class="explore-subtitle">Add more sessions to your favorites wishlist</p>
      </div>
    </a>
  `;
  listContainer.appendChild(exploreBox);
}

/**
 * =========================================================================
 * EVENT DETAILS PAGE LOGIC (event-details.html)
 * =========================================================================
 */
async function initEventDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id') || 'evt-001';

  const event = await window.eventService.getEventById(eventId);
  const container = document.getElementById('event-detail-content');
  if (!container) return;

  if (!event) {
    container.innerHTML = `
      <div class="empty-results-box">
        <h2>Event Not Found</h2>
        <p>The event you are looking for does not exist or was removed.</p>
        <a href="index.html" class="btn btn-primary">Back to Catalog</a>
      </div>
    `;
    return;
  }

  document.title = `${event.title} • Relax Local Events`;

  const isFav = window.favoritesManager.isFavorite(event.id);
  const dateFormatted = window.uiManager.formatDate(event.datetime);
  const priceFormatted = window.uiManager.formatPrice(event.ticketPrice);
  const spotsLeft = event.availableSpots;
  const spotsPercent = Math.max(8, Math.min(100, Math.round((spotsLeft / (event.totalSpots || 100)) * 100)));

  container.innerHTML = `
    <div class="detail-header-bar">
      <a href="index.html" class="back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back to Events
      </a>
      <div class="detail-header-actions">
        <button id="detail-share-btn" class="btn btn-outline btn-icon" title="Share event">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Share
        </button>
        <button id="detail-fav-btn" class="btn btn-outline btn-icon ${isFav ? 'is-active' : ''}">
          <svg width="18" height="18" viewBox="0 0 24 24" class="heart-icon ${isFav ? 'filled' : ''}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span id="detail-fav-text">${isFav ? 'Saved' : 'Favorite'}</span>
        </button>
      </div>
    </div>

    <div class="detail-grid">
      <!-- Left Column: Media & Full Description -->
      <div class="detail-main-col">
        <div class="detail-media-wrap">
          <img src="${event.imageUrl}" alt="${window.uiManager.escapeHTML(event.title)}" class="detail-hero-img" />
          <div class="detail-badge-strip">
            <span class="category-pill">${window.uiManager.getCategoryBadge(event.category)}</span>
            <span class="price-pill ${event.ticketPrice === 0 ? 'price-free' : ''}">${priceFormatted}</span>
          </div>
        </div>

        <h1 class="detail-title">${window.uiManager.escapeHTML(event.title)}</h1>

        <div class="detail-quick-meta">
          <div class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <span class="meta-label">Date &amp; Time</span>
              <strong class="meta-val">${dateFormatted}</strong>
            </div>
          </div>

          <div class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <div>
              <span class="meta-label">Venue</span>
              <strong class="meta-val">${window.uiManager.escapeHTML(event.venue?.name || 'Local Venue')}</strong>
            </div>
          </div>
        </div>

        <section class="detail-section">
          <h2 class="section-title">About this Event</h2>
          <p class="detail-description">${window.uiManager.escapeHTML(event.description)}</p>
        </section>

        <section class="detail-section">
          <h2 class="section-title">Location &amp; Map</h2>
          <p class="venue-address-text">
            <strong>${window.uiManager.escapeHTML(event.venue?.name)}</strong><br/>
            ${window.uiManager.escapeHTML(event.venue?.address)}, ${window.uiManager.escapeHTML(event.venue?.city)}
          </p>

          <!-- Interactive stylized SVG Map visualizer -->
          <div class="location-map-card">
            <svg class="map-bg-svg" viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" stroke-width="1.2"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#F8FAFC"/>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              <!-- Stylized Bay Water/Parks geometry -->
              <path d="M 0,260 Q 200,220 400,280 T 800,240 L 800,350 L 0,350 Z" fill="#E0F2FE" />
              <path d="M 0,0 L 260,0 Q 240,110 320,130 L 210,210 L 0,160 Z" fill="#DCFCE7" opacity="0.6"/>
              
              <!-- Road arteries -->
              <path d="M 50,350 L 380,0" stroke="#CBD5E1" stroke-width="8"/>
              <path d="M 0,180 L 800,180" stroke="#CBD5E1" stroke-width="6"/>
              <path d="M 400,0 L 400,350" stroke="#E2E8F0" stroke-width="5"/>
              <path d="M 200,350 L 600,0" stroke="#F1F5F9" stroke-width="4"/>

              <!-- Target Pin & Pulse Wave -->
              <circle cx="400" cy="180" r="32" fill="#1E3A8A" opacity="0.15">
                <animate attributeName="r" values="18;45;18" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0;0.25" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="400" cy="180" r="10" fill="#1E3A8A" />
              <circle cx="400" cy="180" r="4" fill="#FFFFFF" />

              <g transform="translate(415, 160)">
                <rect x="0" y="0" width="220" height="44" rx="8" fill="#0F172A" />
                <text x="14" y="26" fill="#FFFFFF" font-size="13" font-family="Inter, sans-serif" font-weight="600">${window.uiManager.escapeHTML(event.venue?.name)}</text>
              </g>
            </svg>
          </div>
        </section>

        <!-- Organizer Profile Card -->
        <section class="detail-section organizer-profile-section">
          <h2 class="section-title">Organizer Information</h2>
          <div class="organizer-card">
            <img src="${event.organizer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" class="organizer-avatar" alt="Organizer" />
            <div class="organizer-info">
              <h4 class="organizer-name">${window.uiManager.escapeHTML(event.organizer?.name || 'Local Event Host')}</h4>
              <p class="organizer-email">${window.uiManager.escapeHTML(event.organizer?.email || 'events@host.org')}</p>
              <span class="verified-tag">&#10003; Verified Community Partner</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Sticky Booking Widget -->
      <div class="detail-sidebar-col">
        <div class="sticky-booking-widget">
          <div class="widget-price-row">
            <div>
              <span class="widget-price-label">Ticket Price</span>
              <div class="widget-price">${priceFormatted}</div>
            </div>
            <span class="widget-category-tag">${window.uiManager.getCategoryBadge(event.category)}</span>
          </div>

          <div class="spots-indicator-box">
            <div class="spots-label-row">
              <span>Remaining Capacity</span>
              <strong>${spotsLeft} of ${event.totalSpots || 100} spots</strong>
            </div>
            <div class="spots-progress-bar">
              <div class="spots-fill" style="width: ${spotsPercent}%"></div>
            </div>
          </div>

          <button id="book-ticket-btn" class="btn btn-primary btn-block btn-lg" ${spotsLeft <= 0 ? 'disabled' : ''}>
            ${spotsLeft <= 0 ? 'SOLD OUT' : 'BOOK NOW &rsaquo;'}
          </button>

          <button id="detail-export-ics-btn" class="btn btn-outline btn-block">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Add to Calendar (.ics)
          </button>

          <div class="widget-guarantee-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Instant booking confirmation code with QR pass</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Listeners
  const bookBtn = document.getElementById('book-ticket-btn');
  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      window.uiManager.openBookingModal(event);
    });
  }

  const icsBtn = document.getElementById('detail-export-ics-btn');
  if (icsBtn) {
    icsBtn.addEventListener('click', () => {
      window.uiManager.exportToCalendar(event);
    });
  }

  const shareBtn = document.getElementById('detail-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      window.uiManager.shareEvent(event);
    });
  }

  const favBtn = document.getElementById('detail-fav-btn');
  const favText = document.getElementById('detail-fav-text');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      const active = window.favoritesManager.toggleFavorite(event.id);
      favBtn.classList.toggle('is-active', active);
      const icon = favBtn.querySelector('.heart-icon');
      if (icon) {
        icon.classList.toggle('filled', active);
        icon.setAttribute('fill', active ? 'currentColor' : 'none');
      }
      if (favText) favText.textContent = active ? 'Saved' : 'Favorite';
      window.uiManager.showToast(active ? 'Saved to Favorites' : 'Removed from Favorites', active ? 'success' : 'info');
    });
  }
}

/**
 * =========================================================================
 * ORGANIZER PAGE LOGIC (organizer.html)
 * =========================================================================
 */
async function initOrganizerPage() {
  const tableContainer = document.getElementById('organizer-attendees-table');
  const createForm = document.getElementById('create-event-form');
  const eventsListContainer = document.getElementById('organizer-events-list');

  // Load events & bookings
  const events = await window.eventService.getEvents();
  const bookings = await window.eventService.getAllBookings();

  // Summary Metrics
  const totalSpots = events.reduce((sum, e) => sum + (e.totalSpots || 50), 0);
  const totalBookingsCount = bookings.reduce((sum, b) => sum + (b.quantity || 1), 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

  const metricEvents = document.getElementById('metric-total-events');
  const metricAttendees = document.getElementById('metric-total-attendees');
  const metricRevenue = document.getElementById('metric-total-revenue');

  if (metricEvents) metricEvents.textContent = events.length;
  if (metricAttendees) metricAttendees.textContent = totalBookingsCount;
  if (metricRevenue) metricRevenue.textContent = `$${totalRevenue.toFixed(2)}`;

  // Render Attendee Tracker Table
  if (tableContainer) {
    if (bookings.length === 0) {
      tableContainer.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No registered attendees yet.</td></tr>`;
    } else {
      tableContainer.innerHTML = bookings.map(b => {
        return `
          <tr>
            <td><code class="code-font">${b.id}</code></td>
            <td><strong>${window.uiManager.escapeHTML(b.attendeeName)}</strong></td>
            <td>${window.uiManager.escapeHTML(b.attendeeEmail)}</td>
            <td>${window.uiManager.escapeHTML(b.eventTitle)}</td>
            <td><span class="badge badge-accent">${b.quantity} Ticket(s)</span></td>
            <td>${window.uiManager.formatDate(b.timestamp)}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // Render Organizer Events List
  if (eventsListContainer) {
    eventsListContainer.innerHTML = events.map(e => {
      const sold = (e.totalSpots || 100) - e.availableSpots;
      return `
        <div class="organizer-event-row">
          <div class="org-evt-thumb">
            <img src="${e.imageUrl}" alt="${window.uiManager.escapeHTML(e.title)}" />
          </div>
          <div class="org-evt-main">
            <h4><a href="event-details.html?id=${encodeURIComponent(e.id)}">${window.uiManager.escapeHTML(e.title)}</a></h4>
            <div class="text-sm text-muted">${window.uiManager.formatDate(e.datetime)} &bull; ${window.uiManager.escapeHTML(e.venue?.name || '')}</div>
          </div>
          <div class="org-evt-stats">
            <div class="stat-pill"><strong>${sold}</strong> sold</div>
            <div class="stat-pill"><strong>${e.availableSpots}</strong> left</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Handle Event Creation Form
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(createForm);
      try {
        const newEvt = await window.eventService.createEvent({
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category'),
          datetime: formData.get('datetime'),
          venueName: formData.get('venueName'),
          venueAddress: formData.get('venueAddress'),
          venueCity: formData.get('venueCity'),
          ticketPrice: formData.get('ticketPrice'),
          totalSpots: formData.get('totalSpots'),
          imageUrl: formData.get('imageUrl') || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
          organizerName: 'Taylor Reed (You)',
          organizerEmail: 'curator@soundscape.live'
        });

        window.uiManager.showToast(`Published "${newEvt.title}" successfully!`, 'success');
        createForm.reset();
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } catch (err) {
        window.uiManager.showToast('Failed to create event: ' + err.message, 'error');
      }
    });
  }
}

window.resetAllFilters = resetAllFilters;
