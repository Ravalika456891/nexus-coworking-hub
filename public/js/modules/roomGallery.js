// NEXUS HUB – Meeting Room Image Gallery
// -------------------------------------------------------------
// Responsibilities:
//   • Responsive, lazy-loaded 16:9 room thumbnails (thumb variant on listings,
//     full variant only in the gallery / details hero) with placeholders + fallback
//   • Interactive lightbox: next/previous, keyboard, swipe, thumbnails, fullscreen
//   • Room Details panel (side panel on desktop, full-height sheet on mobile)
//   • Admin photo manager: upload (multi), preview before saving, set primary,
//     reorder, replace, delete, alt text. Images are compressed client-side
//     (WebP when the browser supports encoding it, else JPEG) and uploaded
//     through window.store.uploadMeetingRoomImage → /api/meeting-rooms/images/upload.
//
// Data model: room.images = [{ id, url, thumbUrl, alt, caption, webpUrl?, webpThumbUrl? }]
//   Array order is display order; images[0] is the primary image.
//   Rooms saved before this feature fall back to the seed images in INITIAL_DATA.
// -------------------------------------------------------------

window.RoomGallery = {
  FULL_MAX_WIDTH: 1600,
  THUMB_MAX_WIDTH: 640,
  MAX_IMAGES_PER_ROOM: 12,
  MAX_SOURCE_BYTES: 15 * 1024 * 1024,   // raw file the admin picks (compressed before upload)
  MAX_UPLOAD_BYTES: 2.8 * 1024 * 1024,  // per stored variant after compression (server limit 3 MB)
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  FALLBACK_IMAGE: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="#eef0f7"/>' +
    '<g fill="none" stroke="#a5acc8" stroke-width="10" stroke-linejoin="round"><rect x="250" y="120" width="140" height="105" rx="12"/>' +
    '<circle cx="290" cy="155" r="13"/><path d="M262 212l38-38 26 26 18-16 36 28"/></g>' +
    '<text x="320" y="270" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="600" fill="#8c93b0">Photo unavailable</text></svg>'
  ),

  lightbox: null,
  manager: null,

  // ---------- Data helpers ----------
  esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  getRooms() {
    return (window.store && window.store.getMeetingRooms) ? window.store.getMeetingRooms() : [];
  },

  getRoom(roomId) {
    return this.getRooms().find(r => r.id === roomId) || null;
  },

  getSeedRoom(roomId) {
    const seed = (window.INITIAL_DATA && window.INITIAL_DATA.meetingRooms) || [];
    return seed.find(r => r.id === roomId) || null;
  },

  getImages(room) {
    if (!room) return [];
    if (Array.isArray(room.images) && room.images.length > 0) {
      const valid = room.images.filter(i => i && (i.url || typeof i === 'string'));
      if (valid.length > 0) return valid.map(i => typeof i === 'string' ? { url: i, thumbUrl: i } : i);
    }
    const seed = this.getSeedRoom(room.id);
    if (seed && Array.isArray(seed.images) && seed.images.length > 0) {
      return seed.images;
    }
    const single = room.image || room.fallbackImage || (seed && seed.image);
    if (single) {
      return [{ url: single, thumbUrl: single, alt: room.name }];
    }
    return [{ url: this.FALLBACK_IMAGE, thumbUrl: this.FALLBACK_IMAGE, alt: room.name || 'Room photo' }];
  },

  getDescription(room) {
    if (!room) return '';
    if (room.description) return room.description;
    const seed = this.getSeedRoom(room.id);
    return (seed && seed.description) || '';
  },

  altFor(room, img, index) {
    return (img && img.alt) || `${room ? room.name : 'Meeting room'} – photo ${index + 1}`;
  },

  // ---------- Image markup ----------
  // variant 'thumb': listing cards (≈640w), 'hero': details panel, 'full': lightbox.
  pictureHtml(img, { alt = '', variant = 'thumb', sizes = '', eager = false, cls = '' } = {}) {
    if (!img) {
      return `<img class="rg-img is-loaded ${cls}" src="${this.FALLBACK_IMAGE}" alt="${this.esc(alt || 'No photo available')}" width="640" height="360">`;
    }
    const thumb = img.thumbUrl || img.url;
    const full = img.url;
    const src = variant === 'thumb' ? thumb : full;
    const srcset = thumb !== full ? `${thumb} ${this.THUMB_MAX_WIDTH}w, ${full} ${img.width || this.FULL_MAX_WIDTH}w` : '';
    const sizesAttr = sizes || (variant === 'thumb' ? '(max-width: 640px) 92vw, 260px' : '(max-width: 900px) 100vw, 600px');
    const webpSrcset = img.webpUrl
      ? (img.webpThumbUrl ? `${img.webpThumbUrl} ${this.THUMB_MAX_WIDTH}w, ${img.webpUrl} ${this.FULL_MAX_WIDTH}w` : img.webpUrl)
      : '';
    const imgTag = `<img class="rg-img ${cls}" src="${this.esc(src)}" ${srcset ? `srcset="${this.esc(srcset)}" sizes="${sizesAttr}"` : ''}
      alt="${this.esc(alt)}" width="640" height="360" loading="${eager ? 'eager' : 'lazy'}" decoding="async"
      onload="this.classList.add('is-loaded')" onerror="RoomGallery.onImgError(this)">`;
    return webpSrcset
      ? `<picture><source type="image/webp" srcset="${this.esc(webpSrcset)}" sizes="${sizesAttr}">${imgTag}</picture>`
      : imgTag;
  },

  onImgError(el) {
    if (!el || el.dataset.fallback) return;
    el.dataset.fallback = '1';
    const pic = el.parentElement && el.parentElement.tagName === 'PICTURE' ? el.parentElement : null;
    if (pic) pic.querySelectorAll('source').forEach(s => s.remove());
    el.removeAttribute('srcset');
    el.src = this.FALLBACK_IMAGE;
    el.classList.add('is-loaded', 'is-fallback');
  },

  // Thumbnail used on room cards (clickable → opens gallery)
  renderCardThumb(room) {
    const images = this.getImages(room);
    const primary = images[0];
    const name = this.esc(room.name);
    return `
      <button type="button" class="rg-thumb" onclick="RoomGallery.openGallery('${this.esc(room.id)}', 0)"
        aria-label="View ${images.length || 'no'} photo${images.length === 1 ? '' : 's'} of ${name}" ${images.length ? '' : 'disabled'}>
        <span class="rg-frame">${this.pictureHtml(primary, { alt: this.altFor(room, primary, 0), variant: 'thumb' })}</span>
        ${images.length ? `<span class="rg-thumb-count" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/></svg>
          ${images.length}</span>` : ''}
      </button>
    `;
  },

  // Small inline thumbnail for tables (comparison / admin)
  renderMiniThumb(room, { width = 96, clickable = true } = {}) {
    const images = this.getImages(room);
    const primary = images[0];
    const inner = `<span class="rg-frame" style="width:${width}px;">${this.pictureHtml(primary, { alt: this.altFor(room, primary, 0), variant: 'thumb', sizes: `${width}px` })}</span>`;
    if (!clickable || !images.length) return `<span class="rg-mini">${inner}</span>`;
    return `<button type="button" class="rg-mini" onclick="RoomGallery.openGallery('${this.esc(room.id)}', 0)" aria-label="View photos of ${this.esc(room.name)}">${inner}</button>`;
  },

  // ---------- Lightbox ----------
  openGallery(roomId, index = 0, imagesOverride = null) {
    const room = this.getRoom(roomId) || this.getSeedRoom(roomId);
    const images = imagesOverride || this.getImages(room);
    if (!images.length) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast('No photos have been added for this room yet.', 'info');
      return;
    }
    this.closeGallery();
    this.lightbox = {
      roomId,
      roomName: room ? room.name : 'Meeting Room',
      images,
      index: Math.max(0, Math.min(index, images.length - 1)),
      lastFocus: document.activeElement
    };

    const el = document.createElement('div');
    el.id = 'rg-lightbox';
    el.className = 'rg-lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', `${this.lightbox.roomName} photo gallery`);
    el.innerHTML = `
      <div class="rg-lb-top">
        <div class="rg-lb-title">
          <strong>${this.esc(this.lightbox.roomName)}</strong>
          <span class="rg-lb-counter" id="rg-lb-counter"></span>
        </div>
        <div class="rg-lb-tools">
          <button type="button" class="rg-lb-icon" onclick="RoomGallery.toggleFullscreen()" title="Full screen (F)" aria-label="Toggle full screen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
          </button>
          <button type="button" class="rg-lb-icon" onclick="RoomGallery.closeGallery()" title="Close (Esc)" aria-label="Close gallery">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
      </div>
      <div class="rg-lb-stage" id="rg-lb-stage">
        <button type="button" class="rg-lb-nav prev" onclick="RoomGallery.step(-1)" aria-label="Previous photo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div class="rg-lb-imgwrap"><div class="rg-lb-spinner" aria-hidden="true"></div><img id="rg-lb-img" alt=""></div>
        <button type="button" class="rg-lb-nav next" onclick="RoomGallery.step(1)" aria-label="Next photo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div class="rg-lb-caption" id="rg-lb-caption"></div>
      <div class="rg-lb-strip" id="rg-lb-strip">
        ${images.map((img, i) => `
          <button type="button" class="rg-lb-strip-item" data-index="${i}" onclick="RoomGallery.goTo(${i})" aria-label="Show photo ${i + 1}">
            <img src="${this.esc(img.thumbUrl || img.url)}" alt="" loading="lazy" decoding="async" onerror="RoomGallery.onImgError(this)">
          </button>`).join('')}
      </div>
    `;
    el.addEventListener('click', (e) => { if (e.target === el || e.target.id === 'rg-lb-stage') this.closeGallery(); });

    // Swipe navigation (touch)
    let touchX = null;
    el.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 45) this.step(dx < 0 ? 1 : -1);
      touchX = null;
    });

    this._onKey = (e) => {
      if (!this.lightbox) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); this.step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.step(-1); }
      else if (e.key === 'Escape') { if (!document.fullscreenElement) this.closeGallery(); }
      else if (e.key === 'f' || e.key === 'F') this.toggleFullscreen();
    };
    document.addEventListener('keydown', this._onKey);
    document.body.appendChild(el);
    document.body.classList.add('rg-no-scroll');
    this.renderLightboxImage();
    const closeBtn = el.querySelector('.rg-lb-tools button:last-child');
    if (closeBtn) closeBtn.focus();
  },

  renderLightboxImage() {
    const lb = this.lightbox;
    if (!lb) return;
    const img = lb.images[lb.index];
    const imgEl = document.getElementById('rg-lb-img');
    const wrap = imgEl && imgEl.parentElement;
    if (!imgEl) return;
    wrap.classList.add('is-loading');
    imgEl.classList.remove('is-loaded');
    imgEl.removeAttribute('data-fallback');
    imgEl.onload = () => { wrap.classList.remove('is-loading'); imgEl.classList.add('is-loaded'); };
    imgEl.onerror = () => { wrap.classList.remove('is-loading'); this.onImgError(imgEl); };
    imgEl.src = img.webpUrl || img.url;
    imgEl.alt = this.altFor({ name: lb.roomName }, img, lb.index);

    const counter = document.getElementById('rg-lb-counter');
    if (counter) counter.textContent = `${lb.index + 1} / ${lb.images.length}`;
    const caption = document.getElementById('rg-lb-caption');
    if (caption) caption.textContent = img.caption || img.alt || '';

    document.querySelectorAll('#rg-lb-strip .rg-lb-strip-item').forEach(btn => {
      const active = Number(btn.dataset.index) === lb.index;
      btn.classList.toggle('active', active);
      if (active) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
    const single = lb.images.length < 2;
    document.querySelectorAll('#rg-lightbox .rg-lb-nav').forEach(b => { b.hidden = single; });
    const strip = document.getElementById('rg-lb-strip');
    if (strip) strip.hidden = single;

    // Preload neighbours for instant navigation
    [lb.index + 1, lb.index - 1].forEach(i => {
      const n = lb.images[(i + lb.images.length) % lb.images.length];
      if (n) { const p = new Image(); p.src = n.webpUrl || n.url; }
    });
  },

  step(delta) {
    const lb = this.lightbox;
    if (!lb) return;
    lb.index = (lb.index + delta + lb.images.length) % lb.images.length;
    this.renderLightboxImage();
  },

  goTo(index) {
    if (!this.lightbox) return;
    this.lightbox.index = index;
    this.renderLightboxImage();
  },

  toggleFullscreen() {
    const el = document.getElementById('rg-lightbox');
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen && document.exitFullscreen();
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  },

  closeGallery() {
    const el = document.getElementById('rg-lightbox');
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    if (el) el.remove();
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
    this._onKey = null;
    if (!document.getElementById('rg-details')) document.body.classList.remove('rg-no-scroll');
    const lastFocus = this.lightbox && this.lightbox.lastFocus;
    this.lightbox = null;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  },

  // ---------- Room Details panel & Custom Time Selection ----------
  activeRoomId: null,
  activeDate: null,
  selectedSlot: null,
  selectedDurationMins: 60,

  getSlotsForDate(room, dateStr) {
    const M = window.MeetingRoomsModule;
    // 30-minute intervals within Hub operating hours (08:00 - 11:00 & 15:00 - 19:00 IST)
    const slots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
    ];
    const ist = M && M.getISTNow ? M.getISTNow() : null;
    const now = new Date();
    const today = ist ? ist.todayStr : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const nowMin = ist ? ist.totalMinutes : (now.getHours() * 60 + now.getMinutes());
    
    const toMin = (t) => {
      const [h, m] = String(t || '00:00').split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const bookings = (room.bookings || []).filter(b => b.date === dateStr && b.status !== 'Cancelled' && b.status !== 'Rejected');
    const maint = M && M.isRoomUnderMaintenance ? M.isRoomUnderMaintenance(room) : false;

    return slots.map(s => {
      const start = toMin(s);
      const end = start + 30;
      const endH = Math.floor(end / 60);
      const endM = end % 60;
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      const booked = bookings.some(b => toMin(b.startTime) < end && toMin(b.endTime) > start);
      const past = dateStr < today || (dateStr === today && start <= nowMin);
      let state = 'open';
      if (maint) state = 'closed';
      else if (past) state = 'past';
      else if (booked) state = 'booked';
      return { start: s, end: endStr, state };
    });
  },

  fmt12(t) {
    const [h, m] = String(t).split(':').map(Number);
    const ampm = (h || 0) >= 12 ? 'PM' : 'AM';
    const displayH = ((h + 11) % 12) + 1;
    return `${displayH}:${String(m || 0).padStart(2, '0')} ${ampm}`;
  },

  renderBookingSection(room, dateStr) {
    const M = window.MeetingRoomsModule;
    const slots = this.getSlotsForDate(room, dateStr);
    const openCount = slots.filter(s => s.state === 'open').length;
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const nextDayObj = new Date(now.getTime() + 86400000);
    const nextDayStr = `${nextDayObj.getFullYear()}-${String(nextDayObj.getMonth()+1).padStart(2,'0')}-${String(nextDayObj.getDate()).padStart(2,'0')}`;
    
    const isToday = dateStr === todayStr;
    const isNextDay = dateStr === nextDayStr;
    const dateLabel = dateStr ? new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Today';

    const myStartup = M && M.getMyStartup ? M.getMyStartup() : null;
    const remainingCredits = myStartup ? Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0)) : 0;
    
    if (!this.selectedSlot || !slots.some(s => s.start === this.selectedSlot && s.state === 'open')) {
      const firstOpen = slots.find(s => s.state === 'open');
      this.selectedSlot = firstOpen ? firstOpen.start : null;
    }

    const durationHours = (this.selectedDurationMins || 60) / 60;
    const durationLabel = this.selectedDurationMins === 30 ? '30 mins' : `${durationHours} hr${durationHours > 1 ? 's' : ''}`;
    
    let endTime12 = '';
    if (this.selectedSlot) {
      const [sh, sm] = this.selectedSlot.split(':').map(Number);
      const totalMin = sh * 60 + sm + this.selectedDurationMins;
      const eh = Math.floor(totalMin / 60);
      const em = totalMin % 60;
      endTime12 = this.fmt12(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    }

    const totalRoomPrice = Math.round((room.hourlyRate || 0) * durationHours);
    const isCovered = remainingCredits >= durationHours;
    const creditsUsed = isCovered ? durationHours : remainingCredits;
    const billableAmount = isCovered ? 0 : Math.round(Math.max(0, durationHours - remainingCredits) * (room.hourlyRate || 0));

    return `
      <section class="rg-section">
        <h4>1. Select Meeting Date</h4>
        <div class="rg-date-bar">
          <div class="rg-date-input-wrap">
            <input type="date" class="rg-date-input" value="${dateStr}" min="${todayStr}"
              onchange="RoomGallery.changeDate(this.value)">
          </div>
          <button type="button" class="rg-quick-pill ${isToday ? 'active' : ''}" onclick="RoomGallery.changeDate('${todayStr}')">Today</button>
          <button type="button" class="rg-quick-pill ${isNextDay ? 'active' : ''}" onclick="RoomGallery.changeDate('${nextDayStr}')">Next Day</button>
        </div>
      </section>

      <section class="rg-section">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h4 style="margin: 0;">2. Booking Duration</h4>
          <span style="font-size: 11px; color: #4F3FE0; font-weight: 700;">30-min intervals supported</span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${[
            { mins: 30, label: '30m' },
            { mins: 60, label: '1 hr' },
            { mins: 90, label: '1.5 hrs' },
            { mins: 120, label: '2 hrs' },
            { mins: 180, label: '3 hrs' }
          ].map(d => `
            <button type="button" class="rg-quick-pill ${this.selectedDurationMins === d.mins ? 'active' : ''}"
              onclick="RoomGallery.selectDuration(${d.mins})" style="flex: 1; min-width: 60px; text-align: center;">
              ${d.label}
            </button>
          `).join('')}
        </div>
      </section>

      <section class="rg-section">
        <h4>
          <span>3. Live Available Time Slots</span>
          <span class="rg-muted" style="font-size: 11px; font-weight: 600;">${this.esc(dateLabel)} • ${openCount} open</span>
        </h4>
        <div class="rg-slots">
          ${slots.map(s => {
            const isSelected = this.selectedSlot === s.start;
            const cls = isSelected ? 'rg-slot selected' : `rg-slot ${s.state}`;
            const disabled = s.state !== 'open';
            const label = isSelected ? 'Selected' : s.state === 'open' ? 'Available' : s.state === 'booked' ? 'Booked' : s.state === 'closed' ? 'Closed' : 'Past';
            return `
              <button type="button" class="${cls}" ${disabled ? 'disabled' : ''}
                onclick="RoomGallery.selectSlot('${s.start}')"
                title="${isSelected ? 'Selected slot' : s.state === 'open' ? 'Click to select this slot' : label}">
                ${this.fmt12(s.start)}
                <small>${label}</small>
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <!-- 4. Dynamic Price & Credits Summary Box -->
      <div class="rg-summary-card">
        <div class="rg-summary-row">
          <span>Selected Reservation:</span>
          <strong>${this.selectedSlot ? `${this.fmt12(this.selectedSlot)} – ${endTime12} (${durationLabel})` : 'Select a time slot above'}</strong>
        </div>
        <div class="rg-summary-row">
          <span>Room Rate:</span>
          <strong>₹${Number(room.hourlyRate || 0).toLocaleString('en-IN')} / hour</strong>
        </div>
        <div class="rg-summary-row">
          <span>Startup Plan Credits:</span>
          <span style="color: #4F3FE0; font-weight: 700;">${remainingCredits} hrs free available</span>
        </div>
        <div class="rg-summary-divider"></div>
        <div class="rg-summary-total">
          <span>Estimated Total:</span>
          ${isCovered ? `
            <span class="rg-summary-covered">Covered by Plan (₹0)</span>
          ` : `
            <span style="color: #4F3FE0; font-size: 15px;">₹${billableAmount.toLocaleString('en-IN')}</span>
          `}
        </div>
        <div style="font-size: 10.5px; color: #8A90A2; text-align: right; margin-top: -2px;">
          ${isCovered ? `⚡ ${creditsUsed} hr credit will be deducted upon confirmation` : `⚡ Partial credit used (${creditsUsed} hr). Balance billed at checkout.`}
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 7px 12px; border-radius: 8px; border: 1px solid #BBF7D0; margin-top: 4px;">
          <span>🛡️</span>
          <span>Free cancellation until 1 hour before start</span>
        </div>
      </div>
    `;
  },

  selectSlot(slotTime) {
    this.selectedSlot = slotTime;
    this.refreshBookingMount();
    this.updateFooterSummary();
  },

  selectDuration(mins) {
    this.selectedDurationMins = Number(mins);
    this.refreshBookingMount();
    this.updateFooterSummary();
  },

  changeDate(newDate) {
    if (!newDate) return;
    this.activeDate = newDate;
    const M = window.MeetingRoomsModule;
    if (M) M.selectedDate = newDate;
    this.refreshBookingMount();
    this.updateFooterSummary();
  },

  refreshBookingMount() {
    const container = document.getElementById('rg-interactive-booking-mount');
    if (!container || !this.activeRoomId) return;
    const room = this.getRoom(this.activeRoomId);
    if (!room) return;
    container.innerHTML = this.renderBookingSection(room, this.activeDate);
  },

  updateFooterSummary() {
    const metaEl = document.getElementById('rg-foot-meta');
    if (!metaEl || !this.activeRoomId) return;
    const room = this.getRoom(this.activeRoomId);
    if (!room) return;
    const M = window.MeetingRoomsModule;
    const myStartup = M && M.getMyStartup ? M.getMyStartup() : null;
    const remainingCredits = myStartup ? Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0)) : 0;
    const durationHours = (this.selectedDurationMins || 60) / 60;
    const durationLabel = this.selectedDurationMins === 30 ? '30m' : `${durationHours}h`;

    let endTime12 = '';
    if (this.selectedSlot) {
      const [sh, sm] = this.selectedSlot.split(':').map(Number);
      const totalMin = sh * 60 + sm + this.selectedDurationMins;
      const eh = Math.floor(totalMin / 60);
      const em = totalMin % 60;
      endTime12 = this.fmt12(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    }

    const isCovered = remainingCredits >= durationHours;
    const billableAmount = isCovered ? 0 : Math.round(Math.max(0, durationHours - remainingCredits) * (room.hourlyRate || 0));

    metaEl.innerHTML = `
      <div style="min-width: 0; line-height: 1.3;">
        <div style="font-size: 13px; font-weight: 800; color: #111827;">
          ${this.selectedSlot ? `${this.fmt12(this.selectedSlot)} – ${endTime12} (${durationLabel})` : 'Select a time slot'}
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #15803D; display: flex; align-items: center; gap: 4px; margin-top: 1px;">
          <span>${isCovered ? 'Covered by Plan (₹0)' : `₹${billableAmount.toLocaleString('en-IN')}`}</span>
          <span>•</span>
          <span>🛡️ Free cancel 1h before</span>
        </div>
      </div>
    `;
  },

  proceedToBooking(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;
    const M = window.MeetingRoomsModule;
    if (!M) return;

    const dateStr = this.activeDate || (M && M.selectedDate);
    const slots = this.getSlotsForDate(room, dateStr);

    if (!this.selectedSlot || !slots.some(s => s.start === this.selectedSlot && s.state === 'open')) {
      const firstOpen = slots.find(s => s.state === 'open');
      if (firstOpen) {
        this.selectedSlot = firstOpen.start;
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(`Selected slot was unavailable. Automatically switched to ${this.fmt12(firstOpen.start)}.`, 'info');
        }
      } else {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('All slots for this room on this date are unavailable. Please pick another date or room.', 'warning');
        }
        return;
      }
    }

    const slot = this.selectedSlot;
    const duration = this.selectedDurationMins || 60;
    this.closeDetails();

    M.selectedSlotsByRoom = { [roomId]: [slot] };
    M.selectedDurationByRoom = { [roomId]: duration };
    if (this.activeDate) M.selectedDate = this.activeDate;
    
    if (M.render) M.render();
    if (M.openConfirmBookingModal) {
      M.openConfirmBookingModal(roomId);
    }
  },

  openDetails(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;
    const M = window.MeetingRoomsModule;
    this.activeRoomId = roomId;

    const images = this.getImages(room);
    const primary = images[0];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const dateStr = (M && M.selectedDate) || this.activeDate || todayStr;
    this.activeDate = dateStr;

    const status = M && M.computeRoomStatus ? M.computeRoomStatus(room, dateStr) : { status: 'Available', statusType: 'available' };
    const isMaint = M && M.isRoomUnderMaintenance ? M.isRoomUnderMaintenance(room) : false;
    const policies = (window.store && window.store.getMeetingRoomPolicies) ? window.store.getMeetingRoomPolicies() : {};
    const myStartup = M && M.getMyStartup ? M.getMyStartup() : null;
    const credits = myStartup ? Math.max(0, (myStartup.includedMeetingHours || 0) - (myStartup.usedMeetingHours || 0)) : 0;
    const description = this.getDescription(room);
    const id = this.esc(room.id);
    const extraThumbs = Math.max(0, images.length - 5);

    const policyItems = [
      policies.minDurationMins ? `Bookings from ${policies.minDurationMins} min up to ${policies.maxDurationHours || 4} h per reservation` : `Up to ${policies.maxDurationHours || 4} h per reservation`,
      `Book up to ${policies.advanceBookingDays || 30} days ahead${policies.minAdvanceNoticeMins ? `, at least ${policies.minAdvanceNoticeMins} min in advance` : ''}`,
      `Free cancellation until 1 hour before start; reschedule until 1 hour before`,
      policies.allowRecurring !== false ? `Recurring bookings allowed (up to ${policies.maxRecurringOccurrences || 12} occurrences)` : 'Recurring bookings are disabled',
      `Operating hours: ${policies.operatingHoursLabel || '08:00 AM – 11:00 AM & 03:00 PM – 07:00 PM IST'}`
    ];

    const html = `
      <div class="rg-details-overlay" id="rg-details" role="dialog" aria-modal="true" aria-labelledby="rg-details-title"
        style="position: fixed; inset: 0; z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px; background: rgba(15, 23, 42, 0.72); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"
        onclick="if (event.target === this) RoomGallery.closeDetails()">
        <aside class="rg-details-panel" style="margin: auto; width: 100%; max-width: 620px; max-height: min(92vh, 820px); border-radius: 20px; position: relative; background: #ffffff; box-shadow: 0 25px 65px -12px rgba(15, 23, 42, 0.45);">
          <div class="rg-details-head">
            <div style="min-width:0;">
              <h3 id="rg-details-title" class="rg-details-title" title="${this.esc(room.name)}">${this.esc(room.name)}</h3>
              <div class="rg-details-sub">${id}${room.floor ? ` • ${this.esc(room.floor)}` : ''} • Max ${room.capacity} Pax</div>
            </div>
            <button type="button" class="rg-close-btn" onclick="RoomGallery.closeDetails()" aria-label="Close room details">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>

          <div class="rg-details-body">
            <button type="button" class="rg-hero" onclick="RoomGallery.openGallery('${id}', 0)" ${images.length ? '' : 'disabled'} aria-label="Open photo gallery">
              <span class="rg-frame">${this.pictureHtml(primary, { alt: this.altFor(room, primary, 0), variant: 'hero', eager: true })}</span>
              ${images.length > 1 ? `<span class="rg-thumb-count">View all ${images.length} photos</span>` : ''}
            </button>
            ${images.length > 1 ? `
              <div class="rg-details-thumbs">
                ${images.slice(0, 5).map((img, i) => `
                  <button type="button" class="rg-details-thumb" onclick="RoomGallery.openGallery('${id}', ${i})" aria-label="Open photo ${i + 1}">
                    <span class="rg-frame">${this.pictureHtml(img, { alt: this.altFor(room, img, i), variant: 'thumb', sizes: '110px' })}</span>
                    ${i === 4 && extraThumbs ? `<span class="rg-more">+${extraThumbs}</span>` : ''}
                  </button>`).join('')}
              </div>` : ''}

            <div class="rg-facts">
              <div class="rg-fact"><span class="rg-fact-label">Capacity</span><span class="rg-fact-value">👥 ${room.capacity} people</span></div>
              <div class="rg-fact"><span class="rg-fact-label">Price</span><span class="rg-fact-value">₹${Number(room.hourlyRate || 0).toLocaleString('en-IN')}/hr</span></div>
              <div class="rg-fact"><span class="rg-fact-label">Status</span><span class="rg-fact-value rg-status ${this.esc(status.statusType)}">● ${this.esc(status.status)}</span></div>
            </div>
            ${credits > 0 ? `<div class="rg-credit-note">✓ Your plan includes ${credits} free meeting hour${credits === 1 ? '' : 's'} – eligible bookings are billed against credits first.</div>` : ''}

            <!-- Interactive Booking & Availability Section -->
            <div id="rg-interactive-booking-mount">
              ${this.renderBookingSection(room, dateStr)}
            </div>

            ${description ? `<section class="rg-section"><h4>About this room</h4><p class="rg-desc">${this.esc(description)}</p></section>` : ''}

            <section class="rg-section">
              <h4>Room Amenities</h4>
              <div class="rg-chips">${(room.amenities || []).map(a => `<span class="rg-chip">${this.esc(a)}</span>`).join('') || '<span class="rg-muted">Standard AV &amp; Wi-Fi</span>'}</div>
            </section>

            <section class="rg-section">
              <h4>Booking policies</h4>
              <ul class="rg-policies">${policyItems.map(p => `<li>${this.esc(p)}</li>`).join('')}</ul>
            </section>
          </div>

          <div class="rg-details-foot">
            <div class="rg-foot-meta" id="rg-foot-meta"></div>
            <div class="rg-foot-actions">
              <button type="button" class="btn btn-outline" onclick="RoomGallery.closeDetails(); if(window.MeetingRoomsModule) MeetingRoomsModule.setSchedulerViewMode('compare')">⚖️ Compare</button>
              <button type="button" class="btn btn-primary rg-book-btn" id="rg-foot-book-btn" ${isMaint ? 'disabled' : ''}
                onclick="RoomGallery.proceedToBooking('${id}')">
                ${isMaint ? '🔧 Under Maintenance' : '⚡ Confirm & Book Now'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    `;
    this.closeDetails();
    const mount = document.getElementById('modal-mount') || document.body;
    mount.insertAdjacentHTML('beforeend', html);
    this.updateFooterSummary();
    document.body.classList.add('rg-no-scroll');
    this._onDetailsKey = (e) => { if (e.key === 'Escape' && !this.lightbox) this.closeDetails(); };
    document.addEventListener('keydown', this._onDetailsKey);
    const closeBtn = document.querySelector('#rg-details .rg-close-btn');
    if (closeBtn) closeBtn.focus();
  },

  closeDetails() {
    const el = document.getElementById('rg-details');
    if (el) el.remove();
    if (this._onDetailsKey) document.removeEventListener('keydown', this._onDetailsKey);
    this._onDetailsKey = null;
    this.activeRoomId = null;
    if (!document.getElementById('rg-lightbox')) document.body.classList.remove('rg-no-scroll');
  },

  bookSlot(roomId, slot) {
    this.selectedSlot = slot;
    this.proceedToBooking(roomId);
  },

  // ---------- Admin photo manager ----------
  isAdmin() {
    const M = window.MeetingRoomsModule;
    return M && M.isAdminUser ? M.isAdminUser() : false;
  },

  toast(msg, type = 'info') {
    if (typeof App !== 'undefined' && App.showToast) App.showToast(msg, type);
  },

  openImageManager(roomId) {
    if (!this.isAdmin()) {
      this.toast('⚠️ Only Hub Administrators can manage room photos.', 'danger');
      return;
    }
    const room = this.getRoom(roomId);
    if (!room) return;
    this.manager = {
      roomId,
      roomName: room.name,
      description: this.getDescription(room),
      items: this.getImages(room).map(img => ({ ...img, key: img.id || img.url, status: 'saved', preview: img.thumbUrl || img.url })),
      busy: false,
      progress: '',
      replaceIndex: null,
      dirty: false
    };
    this.renderManager();
  },

  renderManager() {
    const m = this.manager;
    if (!m) return;
    const mount = document.getElementById('modal-mount');
    const existing = document.getElementById('rg-manager');
    const count = m.items.length;
    const html = `
      <div class="modal-overlay active rg-manager-overlay" id="rg-manager" onclick="if (event.target === this) RoomGallery.closeManager()">
        <div class="modal rg-manager" role="dialog" aria-modal="true" aria-labelledby="rg-manager-title">
          <div class="rg-manager-head">
            <div>
              <h3 id="rg-manager-title">🖼️ Room Photos – ${this.esc(m.roomName)}</h3>
              <p>${count}/${this.MAX_IMAGES_PER_ROOM} photos • First photo is the primary image shown on room cards • JPEG, PNG, WebP or AVIF, max 15 MB each</p>
            </div>
            <button type="button" class="rg-close-btn" onclick="RoomGallery.closeManager()" aria-label="Close" ${m.busy ? 'disabled' : ''}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>

          <div class="rg-manager-body">
            <label class="rg-dropzone ${count >= this.MAX_IMAGES_PER_ROOM || m.busy ? 'disabled' : ''}" id="rg-dropzone"
              ondragover="event.preventDefault(); this.classList.add('drag')" ondragleave="this.classList.remove('drag')"
              ondrop="event.preventDefault(); this.classList.remove('drag'); RoomGallery.addFiles(event.dataTransfer.files)">
              <input type="file" accept="${this.ACCEPTED_TYPES.join(',')}" multiple ${count >= this.MAX_IMAGES_PER_ROOM || m.busy ? 'disabled' : ''}
                onchange="RoomGallery.addFiles(this.files); this.value='';">
              <span class="rg-dropzone-icon">⬆️</span>
              <span><strong>Click to upload</strong> or drag &amp; drop photos</span>
              <small>Main view, conference table, presentation equipment, whiteboard, facilities</small>
            </label>
            <input type="file" id="rg-replace-input" accept="${this.ACCEPTED_TYPES.join(',')}" hidden onchange="RoomGallery.replaceFile(this.files[0]); this.value='';">

            ${count === 0 ? `<div class="rg-empty">No photos yet. Upload at least one photo so members can see the room.</div>` : `
              <ol class="rg-manager-grid">
                ${m.items.map((it, i) => `
                  <li class="rg-manager-item ${i === 0 ? 'primary' : ''}">
                    <div class="rg-frame">
                      <img class="rg-img is-loaded" src="${this.esc(it.preview)}" alt="${this.esc(it.alt || '')}" onerror="RoomGallery.onImgError(this)">
                      ${i === 0 ? '<span class="rg-badge primary">★ Primary</span>' : ''}
                      ${it.status === 'new' ? '<span class="rg-badge new">New – not saved</span>' : ''}
                      <button type="button" class="rg-preview-btn" onclick="RoomGallery.previewManager(${i})" aria-label="Preview photo ${i + 1}">🔍</button>
                    </div>
                    <input type="text" class="form-control rg-alt-input" maxlength="140" value="${this.esc(it.alt || '')}"
                      placeholder="Describe the photo (alt text)" aria-label="Alt text for photo ${i + 1}"
                      oninput="RoomGallery.setAlt(${i}, this.value)" ${m.busy ? 'disabled' : ''}>
                    <div class="rg-item-actions">
                      <button type="button" title="Move earlier" aria-label="Move photo ${i + 1} earlier" onclick="RoomGallery.move(${i}, -1)" ${i === 0 || m.busy ? 'disabled' : ''}>◀</button>
                      <button type="button" title="Move later" aria-label="Move photo ${i + 1} later" onclick="RoomGallery.move(${i}, 1)" ${i === count - 1 || m.busy ? 'disabled' : ''}>▶</button>
                      <button type="button" title="Set as primary" onclick="RoomGallery.setPrimary(${i})" ${i === 0 || m.busy ? 'disabled' : ''}>★ Primary</button>
                      <button type="button" title="Replace photo" onclick="RoomGallery.startReplace(${i})" ${m.busy ? 'disabled' : ''}>↻ Replace</button>
                      <button type="button" class="danger" title="Delete photo" onclick="RoomGallery.removeItem(${i})" ${m.busy ? 'disabled' : ''}>🗑</button>
                    </div>
                  </li>`).join('')}
              </ol>`}

            <label class="form-label" style="font-size: 11px; font-weight: 700; margin-top: 14px; display:block;">Room description (shown in Room Details)</label>
            <textarea class="form-control" rows="3" maxlength="600" style="font-size: 12.5px; resize: vertical;"
              oninput="RoomGallery.manager.description = this.value; RoomGallery.manager.dirty = true;" ${m.busy ? 'disabled' : ''}>${this.esc(m.description)}</textarea>
          </div>

          <div class="rg-manager-foot">
            <span class="rg-muted" id="rg-manager-progress">${this.esc(m.progress || (m.dirty ? 'Unsaved changes' : ''))}</span>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="RoomGallery.closeManager()" ${m.busy ? 'disabled' : ''}>Cancel</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="RoomGallery.saveManager()" ${m.busy ? 'disabled' : ''}>
                ${m.busy ? 'Saving…' : '💾 Save Photos'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    if (existing) existing.outerHTML = html;
    else if (mount) mount.innerHTML = html;
    else document.body.insertAdjacentHTML('beforeend', html);
  },

  closeManager(force = false) {
    const m = this.manager;
    if (m && m.busy) return;
    if (m && m.dirty && !force && !window.confirm('Discard unsaved photo changes?')) return;
    if (m) m.items.forEach(it => { if (it.objectUrl) URL.revokeObjectURL(it.objectUrl); });
    this.manager = null;
    const el = document.getElementById('rg-manager');
    if (el) el.remove();
  },

  previewManager(index) {
    const m = this.manager;
    if (!m) return;
    const imgs = m.items.map(it => ({ url: it.status === 'new' ? it.fullDataUrl : it.url, thumbUrl: it.preview, alt: it.alt, caption: it.alt }));
    this.openGallery(m.roomId, index, imgs);
  },

  validateFile(file) {
    if (!file) return 'No file selected.';
    if (!this.ACCEPTED_TYPES.includes(file.type)) return `"${file.name}" is not a supported image (JPEG, PNG, WebP, AVIF).`;
    if (file.size > this.MAX_SOURCE_BYTES) return `"${file.name}" is larger than 15 MB.`;
    return null;
  },

  async addFiles(fileList) {
    const m = this.manager;
    if (!m || m.busy) return;
    const files = Array.from(fileList || []);
    const room = this.MAX_IMAGES_PER_ROOM - m.items.length;
    if (files.length > room) this.toast(`⚠️ Only ${room} more photo(s) can be added (max ${this.MAX_IMAGES_PER_ROOM}).`, 'warning');
    for (const file of files.slice(0, Math.max(0, room))) {
      const err = this.validateFile(file);
      if (err) { this.toast(`⚠️ ${err}`, 'danger'); continue; }
      try {
        const item = await this.processFile(file, `${m.roomName} – photo ${m.items.length + 1}`);
        m.items.push(item);
        m.dirty = true;
      } catch (e) {
        this.toast(`⚠️ Could not read "${file.name}": ${e.message}`, 'danger');
      }
    }
    this.renderManager();
  },

  startReplace(index) {
    if (!this.manager || this.manager.busy) return;
    this.manager.replaceIndex = index;
    const input = document.getElementById('rg-replace-input');
    if (input) input.click();
  },

  async replaceFile(file) {
    const m = this.manager;
    if (!m || m.replaceIndex == null || !file) return;
    const err = this.validateFile(file);
    if (err) { this.toast(`⚠️ ${err}`, 'danger'); return; }
    try {
      const old = m.items[m.replaceIndex];
      const item = await this.processFile(file, old.alt || `${m.roomName} – photo ${m.replaceIndex + 1}`);
      if (old && old.objectUrl) URL.revokeObjectURL(old.objectUrl);
      m.items[m.replaceIndex] = item;
      m.dirty = true;
    } catch (e) {
      this.toast(`⚠️ Could not read "${file.name}": ${e.message}`, 'danger');
    }
    m.replaceIndex = null;
    this.renderManager();
  },

  setAlt(index, value) {
    const m = this.manager;
    if (!m || !m.items[index]) return;
    m.items[index].alt = value;
    m.dirty = true;
    const p = document.getElementById('rg-manager-progress');
    if (p) p.textContent = 'Unsaved changes';
  },

  move(index, delta) {
    const m = this.manager;
    const j = index + delta;
    if (!m || j < 0 || j >= m.items.length) return;
    [m.items[index], m.items[j]] = [m.items[j], m.items[index]];
    m.dirty = true;
    this.renderManager();
  },

  setPrimary(index) {
    const m = this.manager;
    if (!m || index <= 0) return;
    const [item] = m.items.splice(index, 1);
    m.items.unshift(item);
    m.dirty = true;
    this.renderManager();
  },

  removeItem(index) {
    const m = this.manager;
    if (!m || !m.items[index]) return;
    if (m.items[index].status === 'saved' && !window.confirm('Delete this photo? It will be removed when you save.')) return;
    const [removed] = m.items.splice(index, 1);
    if (removed && removed.objectUrl) URL.revokeObjectURL(removed.objectUrl);
    m.dirty = true;
    this.renderManager();
  },

  // Decodes, resizes and compresses an image into full (≤1600w) + thumb (≤640w) variants.
  async processFile(file, defaultAlt) {
    const bitmap = await this.decodeImage(file);
    const format = this.supportsWebpEncoding() ? 'image/webp' : 'image/jpeg';
    const full = await this.encodeVariant(bitmap, this.FULL_MAX_WIDTH, format, 0.84);
    const thumb = await this.encodeVariant(bitmap, this.THUMB_MAX_WIDTH, format, 0.76);
    if (bitmap.close) bitmap.close();
    const objectUrl = URL.createObjectURL(thumb.blob);
    return {
      key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'new',
      mime: format,
      fullDataUrl: full.dataUrl,
      thumbDataUrl: thumb.dataUrl,
      objectUrl,
      preview: objectUrl,
      alt: defaultAlt,
      caption: ''
    };
  },

  decodeImage(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file).catch(() => this.decodeViaImgTag(file));
    }
    return this.decodeViaImgTag(file);
  },

  decodeViaImgTag(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('the file is not a readable image')); };
      img.src = url;
    });
  },

  supportsWebpEncoding() {
    if (this._webpEnc === undefined) {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        this._webpEnc = c.toDataURL('image/webp').startsWith('data:image/webp');
      } catch (_) { this._webpEnc = false; }
    }
    return this._webpEnc;
  },

  async encodeVariant(source, maxWidth, format, quality) {
    const sw = source.width || source.naturalWidth;
    const sh = source.height || source.naturalHeight;
    if (!sw || !sh) throw new Error('image has no dimensions');
    const scale = Math.min(1, maxWidth / sw);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    let q = quality;
    let blob = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      blob = await new Promise(res => canvas.toBlob(res, format, q));
      if (!blob) throw new Error('could not encode image');
      if (blob.size <= this.MAX_UPLOAD_BYTES) break;
      q -= 0.12;
    }
    if (blob.size > this.MAX_UPLOAD_BYTES) throw new Error('image is still too large after compression');
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('could not read encoded image'));
      r.readAsDataURL(blob);
    });
    return { blob, dataUrl };
  },

  async saveManager() {
    const m = this.manager;
    if (!m || m.busy) return;
    if (!this.isAdmin()) { this.toast('⚠️ Only Hub Administrators can manage room photos.', 'danger'); return; }
    m.busy = true;
    const pending = m.items.filter(it => it.status === 'new');
    m.progress = pending.length ? `Uploading 0/${pending.length}…` : 'Saving…';
    this.renderManager();

    try {
      let done = 0;
      for (const it of m.items) {
        if (it.status !== 'new') continue;
        const res = await window.store.uploadMeetingRoomImage({
          roomId: m.roomId,
          mime: it.mime,
          data: it.fullDataUrl,
          thumbMime: it.mime,
          thumbData: it.thumbDataUrl,
          alt: it.alt
        });
        if (!res || !res.success) throw new Error((res && res.message) || 'Upload failed');
        Object.assign(it, res.image, { status: 'saved', alt: it.alt, preview: res.image.thumbUrl || res.image.url });
        done++;
        m.progress = `Uploading ${done}/${pending.length}…`;
        const p = document.getElementById('rg-manager-progress');
        if (p) p.textContent = m.progress;
      }

      const images = m.items.map(it => ({ id: it.id, url: it.url, thumbUrl: it.thumbUrl || it.url, alt: (it.alt || '').trim(), caption: it.caption || '', ...(it.webpUrl ? { webpUrl: it.webpUrl, webpThumbUrl: it.webpThumbUrl } : {}) }));
      const res = await window.store.manageMeetingRoomAdmin({ action: 'update_images', roomId: m.roomId, images, description: m.description });
      if (!res || !res.success) throw new Error((res && res.message) || 'Could not save photos');

      m.busy = false;
      m.dirty = false;
      this.toast(`✅ ${res.message || 'Room photos saved.'}`, 'success');
      this.closeManager(true);
      if (window.MeetingRoomsModule) window.MeetingRoomsModule.render();
    } catch (err) {
      m.busy = false;
      m.progress = `⚠️ ${err.message}`;
      this.toast(`⚠️ ${err.message}`, 'danger');
      this.renderManager();
    }
  }
};
