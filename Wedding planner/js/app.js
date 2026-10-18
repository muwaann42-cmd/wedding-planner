/* ==========================================================================
   LUMIÈRE & CO. — Interactive Application Controller (Enhanced V2)
   Covers all requested features:
   - Dashboard with cover photo & logo upload, realtime countdown, and clickable highlight cards
   - Moodboard categorized for vendor discussions
   - Vendor Workspace grouped by category with slips, photos, and payment deadlines
   - Checklist with 10 specific time stages (12m, 6m, 3m, 1m, 2w, 1w, 5d, 3d, 1d, Wedding Day)
   - Guest List with Real Seating Plan Floor Plan Image upload & viewer
   - Categorized Budget Tracker with multi-slip uploads
   - Detailed Rundown (time, status, lead person, phone, location, song & cue notes)
   ========================================================================== */

const CHECKLIST_STAGES = [
  '12 เดือนก่อนงาน',
  '6 เดือนก่อนงาน',
  '3 เดือนก่อนงาน',
  '1 เดือนก่อนงาน',
  '2 สัปดาห์ก่อนงาน',
  '1 สัปดาห์ก่อนงาน',
  '5 วันก่อนงาน',
  '3 วันก่อนงาน',
  '1 วันก่อนงาน',
  'วันงาน'
];

const App = {
  currentView: 'dashboard',
  filters: {
    moodCategory: 'all',
    moodSearch: '',
    vendorCategory: 'all',
    vendorSearch: '',
    checklistStage: 'all',
    checklistSearch: '',
    guestRsvp: 'all',
    guestSide: 'all',
    guestSearch: '',
    budgetCategory: 'all',
    budgetSearch: '',
    rundownSession: 'all',
    rundownStatus: 'all',
    rundownSearch: ''
  },

  // Temporary container for uploads inside modals
  tempUploads: {
    vendorImages: [],
    vendorSlips: [],
    budgetSlips: []
  },

  init() {
    this.bindNavigation();
    this.renderAll();
    window.weddingStore.subscribe(() => this.renderAll());
    this.startCountdownTimer();
  },

  /* --------------------------------------------------------------------------
     Utilities & Helpers
     -------------------------------------------------------------------------- */
  formatCurrency(num) {
    const val = Number(num) || 0;
    return '฿' + val.toLocaleString('th-TH');
  },

  formatDateThai(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  toast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${icon}</span><span>${this.escapeHtml(message)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 250);
    }, 2800);
  },

  // Compress image via Canvas to keep base64 compact for IndexedDB & LocalStorage
  compressImage(file, maxDimension = 800, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /* --------------------------------------------------------------------------
     Safe Deletion Confirmation Handlers (Prevents Accidental Loss)
     -------------------------------------------------------------------------- */
  deleteVendorConfirm(id, name) {
    if (confirm(`คุณต้องการลบผู้ให้บริการ "${name}" ใช่หรือไม่?\n(ข้อมูลค่าใช้จ่ายและบันทึกในงบประมาณจะไม่สูญหาย)`)) {
      window.weddingStore.deleteVendor(id);
      this.toast(`ลบผู้ให้บริการ "${name}" เรียบร้อย`, '🗑');
    }
  },

  deleteVendorMeetingConfirm(vendorId, meetingId, topic) {
    if (confirm(`คุณต้องการลบบันทึกการประชุม "${topic}" ใช่หรือไม่?`)) {
      window.weddingStore.deleteVendorMeeting(vendorId, meetingId);
      this.toast('ลบบันทึกการประชุมแล้ว', '🗑');
    }
  },

  deleteTaskConfirm(id, title) {
    if (confirm(`คุณต้องการลบงาน "${title}" ใช่หรือไม่?`)) {
      window.weddingStore.deleteTask(id);
      this.toast(`ลบงาน "${title}" เรียบร้อย`, '🗑');
    }
  },

  deleteGuestConfirm(id, name) {
    if (confirm(`คุณต้องการลบรายชื่อแขก "${name}" ใช่หรือไม่?`)) {
      window.weddingStore.deleteGuest(id);
      this.toast(`ลบรายชื่อแขก "${name}" เรียบร้อย`, '🗑');
    }
  },

  deleteBudgetConfirm(id, title) {
    if (confirm(`คุณต้องการลบรายการงบประมาณ "${title}" ใช่หรือไม่?`)) {
      window.weddingStore.deleteBudgetItem(id);
      this.toast(`ลบรายการงบประมาณ "${title}" เรียบร้อย`, '🗑');
    }
  },

  deleteRundownConfirm(id, title) {
    if (confirm(`คุณต้องการลบคิวพิธีการ "${title}" ใช่หรือไม่?`)) {
      window.weddingStore.deleteRunOfShowItem(id);
      this.toast(`ลบคิวพิธีการ "${title}" เรียบร้อย`, '🗑');
    }
  },

  deleteMoodConfirm(id, title) {
    if (confirm(`คุณต้องการลบรายการ "${title}" ใน Moodboard ใช่หรือไม่?`)) {
      window.weddingStore.deleteMoodItem(id);
      this.toast(`ลบรายการ "${title}" แล้ว`, '🗑');
    }
  },

  deleteColorConfirm(id, name) {
    if (confirm(`คุณต้องการลบแถบสี "${name}" ใช่หรือไม่?`)) {
      window.weddingStore.deleteColorSwatch(id);
      this.toast(`ลบแถบสี "${name}" แล้ว`, '🎨');
    }
  },


  openLightbox(src) {
    const backdrop = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    if (backdrop && img) {
      img.src = src;
      backdrop.classList.add('open');
    }
  },

  closeLightbox() {
    const backdrop = document.getElementById('lightbox-modal');
    if (backdrop) backdrop.classList.remove('open');
  },

  /* --------------------------------------------------------------------------
     Navigation & Modals
     -------------------------------------------------------------------------- */
  bindNavigation() {
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-nav');
        this.switchView(target);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });
  },

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-nav') === viewName);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('open');
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('open');
  },

  /* --------------------------------------------------------------------------
     Live Countdown Timer
     -------------------------------------------------------------------------- */
  startCountdownTimer() {
    const updateClock = () => {
      const info = window.weddingStore.state.weddingInfo;
      const targetStr = `${info.weddingDate}T${info.weddingTime || '09:00'}:00`;
      const target = new Date(targetStr).getTime();
      const now = Date.now();
      const diff = target - now;

      const elDays = document.getElementById('cd-days');
      const elHours = document.getElementById('cd-hours');
      const elMins = document.getElementById('cd-mins');
      const elSecs = document.getElementById('cd-secs');
      const elSideDays = document.getElementById('sidebar-cd-text');

      if (isNaN(target) || diff <= 0) {
        if (elDays) elDays.textContent = '0';
        if (elHours) elHours.textContent = '00';
        if (elMins) elMins.textContent = '00';
        if (elSecs) elSecs.textContent = '00';
        if (elSideDays) elSideDays.textContent = 'ถึงวันมงคลสมรสแล้ว 💍';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      if (elDays) elDays.textContent = days;
      if (elHours) elHours.textContent = String(hours).padStart(2, '0');
      if (elMins) elMins.textContent = String(mins).padStart(2, '0');
      if (elSecs) elSecs.textContent = String(secs).padStart(2, '0');
      if (elSideDays) elSideDays.textContent = `อีก ${days} วันจะถึงวันงาน`;
    };

    updateClock();
    setInterval(updateClock, 1000);
  },

  /* --------------------------------------------------------------------------
     Master Render
     -------------------------------------------------------------------------- */
  renderAll() {
    const summary = window.weddingStore.getSummary();
    this.renderSidebarAndHeader(summary);
    this.renderDashboard(summary);
    this.renderMoodboard();
    this.renderVendors();
    this.renderChecklist(summary);
    this.renderGuests(summary);
    this.renderBudget(summary);
    this.renderRundown();
  },

  renderSidebarAndHeader(summary) {
    const info = window.weddingStore.state.weddingInfo;
    const coupleTitle = `${info.brideName.split(' ')[0]} & ${info.groomName.split(' ')[0]}`;

    const sideNames = document.getElementById('sidebar-couple-names');
    const sideDate = document.getElementById('sidebar-wedding-date');
    const mobNames = document.getElementById('mobile-couple-names');
    const sideLogo = document.getElementById('sidebar-logo-slot');

    if (sideNames) sideNames.textContent = coupleTitle;
    if (sideDate) sideDate.textContent = this.formatDateThai(info.weddingDate);
    if (mobNames) mobNames.textContent = coupleTitle;

    if (sideLogo) {
      if (info.logoPhoto) {
        sideLogo.innerHTML = `<img src="${this.escapeHtml(info.logoPhoto)}" class="hero-logo-img" alt="Wedding Logo" />`;
      } else {
        sideLogo.innerHTML = 'L&amp;C';
      }
    }

    // Nav Badges
    const setBadge = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    setBadge('badge-moodboard', window.weddingStore.state.moodboard.length);
    setBadge('badge-vendors', `${summary.approvedVendors}/${summary.totalVendors}`);
    setBadge('badge-checklist', `${summary.completedTasks}/${summary.totalTasks}`);
    setBadge('badge-guests', `${summary.confirmedSeats} ที่นั่ง`);
    setBadge('badge-budget', `${summary.budgetPercentUsed}%`);
    setBadge('badge-rundown', `${summary.completedCues}/${summary.totalCues}`);
  },

  /* ==========================================================================
     1. DASHBOARD VIEW (With Editable Cover, Logo & Clickable Highlights)
     ========================================================================== */
  renderDashboard(summary) {
    const info = window.weddingStore.state.weddingInfo;

    // Cover Image & Logo
    const coverBg = document.getElementById('hero-cover-bg');
    if (coverBg) {
      if (info.coverPhoto) {
        coverBg.src = info.coverPhoto;
        coverBg.style.display = 'block';
      } else {
        coverBg.style.display = 'none';
      }
    }

    const heroLogo = document.getElementById('hero-logo-slot');
    if (heroLogo) {
      if (info.logoPhoto) {
        heroLogo.innerHTML = `<img src="${this.escapeHtml(info.logoPhoto)}" class="hero-logo-img" alt="Logo" />`;
      } else {
        heroLogo.innerHTML = `<span style="font-family:var(--font-serif); font-size:24px; font-weight:700; color:var(--blush-600);">💍</span>`;
      }
    }

    document.getElementById('hero-couple-names').textContent = `${info.brideName} & ${info.groomName}`;
    document.getElementById('hero-hashtag').textContent = info.hashtag || '#OurWeddingDay';
    document.getElementById('hero-date').textContent = `${this.formatDateThai(info.weddingDate)} | ฤกษ์เช้า ${info.weddingTime} น. • เลี้ยงฉลอง ${info.receptionTime} น.`;
    document.getElementById('hero-venue').textContent = info.venue;
    document.getElementById('hero-theme').textContent = `${info.theme} (${info.dressCode})`;
    document.getElementById('hero-couple-note').textContent = info.coupleNote || '';

    // Clickable Highlight Cards Values
    document.getElementById('hl-budget-spent').textContent = this.formatCurrency(summary.totalActual);
    document.getElementById('hl-budget-remain').textContent = `คงเหลือ ${this.formatCurrency(summary.remainingBudgetFromCap)}`;

    document.getElementById('hl-checklist-done').textContent = `${summary.completedTasks} / ${summary.totalTasks} งาน`;
    document.getElementById('hl-checklist-sub').textContent = `สำเร็จแล้ว ${summary.taskProgressPercent}%`;

    document.getElementById('hl-guest-seats').textContent = `${summary.confirmedSeats} ที่นั่ง`;
    document.getElementById('hl-guest-sub').textContent = `จากเป้าหมาย ${info.targetGuests} ท่าน`;

    document.getElementById('hl-vendor-count').textContent = `${summary.approvedVendors} / ${summary.totalVendors} ร้าน`;
    document.getElementById('hl-vendor-sub').textContent = `อนุมัติแล้ว • รอตัดสินใจ ${summary.negotiatingVendors} ร้าน`;

    document.getElementById('hl-rundown-count').textContent = `${summary.completedCues} / ${summary.totalCues} คิวงาน`;
    document.getElementById('hl-rundown-sub').textContent = `ฤกษ์สำคัญ 09:09 น. และ 18:00 น.`;

    // Upcoming Checklist Tasks on Dashboard
    const upcomingContainer = document.getElementById('dash-upcoming-tasks');
    const upcoming = [...window.weddingStore.state.checklist]
      .sort((a, b) => Number(a.completed) - Number(b.completed) || String(a.dueDate).localeCompare(String(b.dueDate)))
      .slice(0, 5);

    upcomingContainer.innerHTML = upcoming.map(task => `
      <div class="checklist-item ${task.completed ? 'completed' : ''}" style="padding:11px 14px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="custom-checkbox" onclick="window.weddingStore.toggleTask('${task.id}')">
            ${task.completed ? '✓' : ''}
          </div>
          <div>
            <div class="task-title" style="font-size:13.5px; font-weight:500;">${this.escapeHtml(task.title)}</div>
            <div style="font-size:11.5px; color:var(--text-muted);">
              👤 ${this.escapeHtml(task.assignee)} • ⏳ ${this.escapeHtml(task.timeframe)} • 📅 กำหนด ${this.formatDateThai(task.dueDate)}
            </div>
          </div>
        </div>
        <span class="badge ${task.priority === 'สูง' ? 'badge-blush' : 'badge-champagne'}">${this.escapeHtml(task.priority)}</span>
      </div>
    `).join('');

    // Dashboard Rundown Highlight
    const rdContainer = document.getElementById('dash-rundown-highlight');
    if (rdContainer) {
      const topRundown = window.weddingStore.state.runOfShow.slice(0, 4);
      rdContainer.innerHTML = topRundown.map(r => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-surface-solid); border:1px solid var(--border-soft); border-radius:var(--radius-md); margin-bottom:8px; cursor:pointer;" onclick="App.switchView('rundown')">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge badge-champagne" style="font-weight:700;">${this.escapeHtml(r.startTime)} น.</span>
            <div>
              <div style="font-weight:500; font-size:13px;">${this.escapeHtml(r.title)}</div>
              <div style="font-size:11.5px; color:var(--text-muted);">📍 ${this.escapeHtml(r.location)} • 👤 ${this.escapeHtml(r.leadPerson)}</div>
            </div>
          </div>
          <span class="badge ${r.status === 'เสร็จสิ้น' ? 'badge-success' : (r.status === 'กำลังดำเนินการ' ? 'badge-warning' : 'badge-info')}">${this.escapeHtml(r.status || 'เตรียมพร้อม')}</span>
        </div>
      `).join('');
    }
  },

  openWeddingInfoModal() {
    const info = window.weddingStore.state.weddingInfo;
    document.getElementById('wi-bride').value = info.brideName;
    document.getElementById('wi-groom').value = info.groomName;
    document.getElementById('wi-date').value = info.weddingDate;
    document.getElementById('wi-time').value = info.weddingTime;
    document.getElementById('wi-reception').value = info.receptionTime || '18:00';
    document.getElementById('wi-venue').value = info.venue;
    document.getElementById('wi-theme').value = info.theme;
    document.getElementById('wi-dresscode').value = info.dressCode || '';
    document.getElementById('wi-hashtag').value = info.hashtag || '';
    document.getElementById('wi-budget').value = info.totalBudget;
    document.getElementById('wi-guests').value = info.targetGuests;
    document.getElementById('wi-note').value = info.coupleNote || '';
    document.getElementById('wi-cover-url').value = info.coverPhoto || '';
    document.getElementById('wi-logo-url').value = info.logoPhoto || '';
    this.openModal('modal-wedding-info');
  },

  async handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const compressed = await this.compressImage(file, 1000, 0.72);
      document.getElementById('wi-cover-url').value = compressed;
      this.toast('อัปโหลดและประมวลผลภาพหน้าปกเรียบร้อย', '🖼');
    } catch (e) {
      alert('ไม่สามารถอ่านไฟล์ภาพได้');
    }
  },

  async handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const compressed = await this.compressImage(file, 400, 0.75);
      document.getElementById('wi-logo-url').value = compressed;
      this.toast('อัปโหลดและประมวลผลโลโก้งานแต่งเรียบร้อย', '💍');
    } catch (e) {
      alert('ไม่สามารถอ่านไฟล์ภาพได้');
    }
  },

  saveWeddingInfoForm(e) {
    e.preventDefault();
    window.weddingStore.updateWeddingInfo({
      brideName: document.getElementById('wi-bride').value.trim(),
      groomName: document.getElementById('wi-groom').value.trim(),
      weddingDate: document.getElementById('wi-date').value,
      weddingTime: document.getElementById('wi-time').value,
      receptionTime: document.getElementById('wi-reception').value,
      venue: document.getElementById('wi-venue').value.trim(),
      theme: document.getElementById('wi-theme').value.trim(),
      dressCode: document.getElementById('wi-dresscode').value.trim(),
      hashtag: document.getElementById('wi-hashtag').value.trim(),
      totalBudget: Number(document.getElementById('wi-budget').value) || 0,
      targetGuests: Number(document.getElementById('wi-guests').value) || 0,
      coupleNote: document.getElementById('wi-note').value.trim(),
      coverPhoto: document.getElementById('wi-cover-url').value.trim(),
      logoPhoto: document.getElementById('wi-logo-url').value.trim()
    });
    this.closeModal('modal-wedding-info');
    this.toast('อัปเดตข้อมูลงานแต่งงานเรียบร้อยแล้ว');
  },

  /* ==========================================================================
     2. MOODBOARD VIEW (Categorized for Vendor Discussions)
     ========================================================================== */
  renderMoodboard() {
    // 1. Color Palette
    const palEl = document.getElementById('mood-palette-list');
    palEl.innerHTML = window.weddingStore.state.palette.map(sw => `
      <div class="swatch-card">
        <div class="swatch-circle" style="background:${this.escapeHtml(sw.hex)}" title="คลิกเพื่อคัดลอกโค้ดสี" onclick="App.copyHex('${this.escapeHtml(sw.hex)}')"></div>
        <div class="swatch-info">
          <div class="swatch-name">${this.escapeHtml(sw.name)}</div>
          <div class="swatch-hex" onclick="App.copyHex('${this.escapeHtml(sw.hex)}')">${this.escapeHtml(sw.hex)} • ${this.escapeHtml(sw.role || '')}</div>
        </div>
        <button class="btn-icon" style="width:26px;height:26px;font-size:12px;" onclick="App.deleteColorConfirm('${sw.id}', '${this.escapeHtml(sw.name)}')" title="ลบสีนี้">✕</button>
      </div>
    `).join('');

    // 2. Moodboard Gallery Cards
    const catFilter = this.filters.moodCategory;
    const q = this.filters.moodSearch.toLowerCase();

    const items = window.weddingStore.state.moodboard.filter(item => {
      const matchCat = catFilter === 'all' || (catFilter === 'fav' ? item.favorite : item.category === catFilter);
      const matchSearch = !q || item.title.toLowerCase().includes(q) || (item.notes || '').toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    const gridEl = document.getElementById('mood-gallery-grid');
    if (items.length === 0) {
      gridEl.innerHTML = `<div class="card" style="grid-column:1/-1; text-align:center; padding:40px;">ไม่พบไอเดียในหมวดหมู่นี้ กดปุ่ม "+ เพิ่มไอเดีย & ภาพอ้างอิง" ด้านบนเพื่อเริ่มจัดบอร์ด</div>`;
      return;
    }

    gridEl.innerHTML = items.map(item => `
      <div class="mood-card">
        <div class="mood-img-wrap" onclick="App.openLightbox('${this.escapeHtml(item.imageUrl)}')" title="คลิกเพื่อดูรูปขยายใหญ่">
          <img class="mood-img" src="${this.escapeHtml(item.imageUrl || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80')}" alt="${this.escapeHtml(item.title)}" onerror="this.src='https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80'">
          <span class="mood-category-tag">${this.escapeHtml(item.category)}</span>
          <button class="mood-fav-btn ${item.favorite ? 'active' : ''}" onclick="event.stopPropagation(); window.weddingStore.toggleMoodFavorite('${item.id}')" title="รายการโปรด">
            ${item.favorite ? '♥' : '♡'}
          </button>
        </div>
        <div class="mood-body">
          <div>
            <div class="mood-title">${this.escapeHtml(item.title)}</div>
            <div class="mood-notes" style="background:var(--bg-ivory); padding:8px 10px; border-radius:8px; border-left:3px solid var(--blush-400); margin:8px 0;">
              <strong>📝 บรีฟ Vendor:</strong> ${this.escapeHtml(item.notes || 'ไม่มีหมายเหตุ')}
            </div>
          </div>
          <div class="mood-footer">
            ${item.pinterestUrl
              ? `<a href="${this.escapeHtml(item.pinterestUrl)}" target="_blank" rel="noopener" class="pinterest-link">📌 ลิงก์ Pinterest ↗</a>`
              : `<span style="color:var(--text-muted);font-size:12px;">ภาพอ้างอิงบรีฟงาน</span>`
            }
            <div style="display:flex; gap:6px;">
              <button class="btn-icon" style="width:30px;height:30px;" onclick="App.openMoodModal('${item.id}')" title="แก้ไข">✎</button>
              <button class="btn-icon" style="width:30px;height:30px;" onclick="App.deleteMoodConfirm('${item.id}', '${this.escapeHtml(item.title)}')" title="ลบ">🗑</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  copyHex(hex) {
    if (navigator.clipboard) navigator.clipboard.writeText(hex);
    this.toast(`คัดลอกโค้ดสี ${hex} แล้ว`, '🎨');
  },

  addSwatchPrompt(e) {
    e.preventDefault();
    const hex = document.getElementById('new-swatch-hex').value;
    const name = document.getElementById('new-swatch-name').value.trim();
    const role = document.getElementById('new-swatch-role').value.trim();
    if (!name) return;
    window.weddingStore.addColorSwatch({ hex, name, role });
    document.getElementById('new-swatch-name').value = '';
    document.getElementById('new-swatch-role').value = '';
    this.closeModal('modal-swatch');
    this.toast('เพิ่มโทนสีเข้า Moodboard แล้ว', '🎨');
  },

  openMoodModal(id = '') {
    const item = window.weddingStore.state.moodboard.find(m => m.id === id);
    document.getElementById('mood-id').value = item ? item.id : '';
    document.getElementById('mood-title-input').value = item ? item.title : '';
    document.getElementById('mood-category-input').value = item ? item.category : 'ดอกไม้ & ซุ้มพิธี';
    document.getElementById('mood-img-input').value = item ? item.imageUrl : '';
    document.getElementById('mood-pin-input').value = item ? item.pinterestUrl : '';
    document.getElementById('mood-notes-input').value = item ? item.notes : '';
    document.getElementById('mood-modal-title').textContent = item ? 'แก้ไขภาพอ้างอิง Moodboard' : 'เพิ่มไอเดีย & ภาพอ้างอิง Moodboard';
    this.openModal('modal-mood');
  },

  async handleMoodImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const compressed = await this.compressImage(file, 800, 0.72);
      document.getElementById('mood-img-input').value = compressed;
      this.toast('อัปโหลดและย่อขนาดรูปภาพเรียบร้อย', '🖼');
    } catch (e) {
      alert('ไม่สามารถอ่านไฟล์รูปภาพได้');
    }
  },

  saveMoodForm(e) {
    e.preventDefault();
    window.weddingStore.saveMoodItem({
      id: document.getElementById('mood-id').value,
      title: document.getElementById('mood-title-input').value.trim(),
      category: document.getElementById('mood-category-input').value,
      imageUrl: document.getElementById('mood-img-input').value.trim(),
      pinterestUrl: document.getElementById('mood-pin-input').value.trim(),
      notes: document.getElementById('mood-notes-input').value.trim()
    });
    this.closeModal('modal-mood');
    this.toast('บันทึกไอเดียลง Moodboard เรียบร้อย');
  },

  /* ==========================================================================
     3. VENDOR WORKSPACE (Categorized with Slips, Photos & Payment Deadlines)
     ========================================================================== */
  renderVendors() {
    const catFilter = this.filters.vendorCategory;
    const q = this.filters.vendorSearch.toLowerCase();

    const filtered = window.weddingStore.state.vendors.filter(v => {
      const matchCat = catFilter === 'all' || v.category === catFilter;
      const matchSearch = !q ||
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.contactName || '').toLowerCase().includes(q) ||
        (v.notes || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    const container = document.getElementById('vendor-categorized-container');
    if (filtered.length === 0) {
      container.innerHTML = `<div class="card" style="text-align:center; padding:40px;">ไม่พบข้อมูลผู้ให้บริการในหมวดหมู่นี้</div>`;
      return;
    }

    // Group by Category
    const groups = {};
    filtered.forEach(v => {
      const cat = v.category || 'อื่นๆ';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });

    container.innerHTML = Object.entries(groups).map(([catName, list]) => `
      <div style="margin-bottom:28px;">
        <div class="category-group-header">
          <div class="category-group-title">
            <span>🏷️</span>
            <span>${this.escapeHtml(catName)} (${list.length} ร้าน)</span>
          </div>
          <span style="font-size:12px; color:var(--text-secondary);">รวม ฿${list.reduce((acc, x) => acc + (Number(x.quotedPrice) || 0), 0).toLocaleString('th-TH')}</span>
        </div>

        <div class="vendor-grid">
          ${list.map(v => {
            let badgeClass = 'badge-warning';
            if (v.status.includes('อนุมัติแล้ว')) badgeClass = 'badge-success';
            else if (v.status.includes('ปฏิเสธ')) badgeClass = 'badge-danger';
            else if (v.status.includes('นัดคุย')) badgeClass = 'badge-info';

            const balance = Math.max(0, (Number(v.quotedPrice) || 0) - (Number(v.depositAmount) || 0));
            const images = Array.isArray(v.images) ? v.images : [];
            const slips = Array.isArray(v.paymentSlips) ? v.paymentSlips : [];
            const meetings = Array.isArray(v.meetings) ? v.meetings : [];

            return `
              <div class="vendor-card">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <span class="badge badge-champagne">${this.escapeHtml(v.category)}</span>
                    <span class="badge ${badgeClass}">${this.escapeHtml(v.status)}</span>
                  </div>

                  <h3 style="font-family:var(--font-serif); font-size:23px; margin:10px 0 4px;">${this.escapeHtml(v.name)}</h3>
                  <div style="font-size:12.5px; color:var(--text-secondary); line-height:1.5;">
                    <div>👤 <strong>ผู้ติดต่อ:</strong> ${this.escapeHtml(v.contactName || '-')}</div>
                    <div>📞 <strong>เบอร์โทร:</strong> ${this.escapeHtml(v.phone || '-')} • 💬 <strong>Line/IG:</strong> ${this.escapeHtml(v.lineOrIg || '-')}</div>
                  </div>

                  <!-- Price & Deadline Box -->
                  <div class="vendor-price-box">
                    <div>
                      <div style="font-size:11.5px; color:var(--text-secondary);">ใบเสนอราคา: <strong>${this.escapeHtml(v.quotationRef || '-')}</strong></div>
                      <div style="font-family:var(--font-serif); font-size:22px; font-weight:700; color:var(--text-primary);">
                        ${this.formatCurrency(v.quotedPrice)}
                      </div>
                      <div style="font-size:11px; color:var(--blush-600); margin-top:2px;">
                        ⏰ สิ้นสุดชำระ: <strong>${this.formatDateThai(v.finalPaymentDate)}</strong>
                      </div>
                    </div>
                    <div style="text-align:right; font-size:12px;">
                      <div style="color:var(--status-success-text); font-weight:600;">มัดจำแล้ว: ${this.formatCurrency(v.depositAmount)}</div>
                      <div style="color:var(--status-danger-text); font-weight:700; margin-top:2px;">ค้างชำระ: ${this.formatCurrency(balance)}</div>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div style="font-size:13px; color:var(--text-secondary); margin-bottom:12px; background:var(--bg-ivory); padding:8px 12px; border-radius:8px;">
                    <strong>📝 โน้ตรายละเอียด:</strong> ${this.escapeHtml(v.notes || '-')}
                  </div>

                  <!-- Photo & Slip Thumbnails -->
                  ${(images.length > 0 || slips.length > 0) ? `
                    <div style="margin-bottom:12px;">
                      <div style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">
                        📷 รูปภาพและสลิปโอนเงิน (${images.length + slips.length} รูป) <span style="font-size:11px; color:var(--text-muted);">(คลิกดูรูปขยาย)</span>:
                      </div>
                      <div class="slips-grid">
                        ${images.map(img => `
                          <img src="${this.escapeHtml(img)}" class="slip-thumb" title="รูปตัวอย่างผลงาน" onclick="App.openLightbox('${this.escapeHtml(img)}')" />
                        `).join('')}
                        ${slips.map(sl => `
                          <div style="position:relative;">
                            <img src="${this.escapeHtml(sl)}" class="slip-thumb" style="border-color:var(--sage-500);" title="สลิปโอนเงิน" onclick="App.openLightbox('${this.escapeHtml(sl)}')" />
                            <span style="position:absolute; bottom:2px; right:2px; font-size:9px; background:var(--sage-500); color:#FFF; padding:1px 3px; border-radius:3px;">สลิป</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}

                  <!-- Meeting Log -->
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <span style="font-size:12.5px; font-weight:600;">📝 บันทึกประชุม (${meetings.length})</span>
                    <button class="btn btn-soft btn-sm" onclick="App.openMeetingModal('${v.id}')">+ เพิ่มประชุม</button>
                  </div>
                  ${meetings.length > 0 ? `
                    <div class="meeting-log-list" style="margin-top:6px;">
                      ${meetings.map(m => `
                        <div class="meeting-item">
                          <div style="display:flex; justify-content:space-between; font-weight:500;">
                            <span>📅 ${this.formatDateThai(m.date)} — ${this.escapeHtml(m.topic)}</span>
                            <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;" onclick="App.deleteVendorMeetingConfirm('${v.id}', '${m.id}', '${this.escapeHtml(m.topic)}')" title="ลบบันทึก">✕</button>
                          </div>
                          <div style="color:var(--text-secondary); margin-top:2px;">${this.escapeHtml(m.summary)}</div>
                          ${m.nextAction ? `<div style="color:var(--blush-600); font-size:11.5px; margin-top:2px;">📌 นัดหมายถัดไป: ${this.escapeHtml(m.nextAction)}</div>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding-top:12px; border-top:1px solid var(--border-soft);">
                  <span style="font-size:11.5px; color:${v.syncedToBudget ? 'var(--status-success-text)' : 'var(--text-muted)'};">
                    ${v.syncedToBudget ? '✓ ซิงก์เข้า Budget แล้ว' : '• ยังไม่ซิงก์เข้า Budget'}
                  </span>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-secondary btn-sm" onclick="App.openVendorModal('${v.id}')">✎ แก้ไข</button>
                    <button class="btn btn-danger-soft btn-sm" onclick="App.deleteVendorConfirm('${v.id}', '${this.escapeHtml(v.name)}')">ลบ</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  },

  openVendorModal(id = '') {
    const v = window.weddingStore.state.vendors.find(x => x.id === id);
    document.getElementById('ven-id').value = v ? v.id : '';
    document.getElementById('ven-name').value = v ? v.name : '';
    document.getElementById('ven-cat').value = v ? v.category : 'สถานที่ & แคเทอริ่ง';
    document.getElementById('ven-contact').value = v ? v.contactName : '';
    document.getElementById('ven-phone').value = v ? v.phone : '';
    document.getElementById('ven-line').value = v ? v.lineOrIg : '';
    document.getElementById('ven-qref').value = v ? v.quotationRef : '';
    document.getElementById('ven-price').value = v ? v.quotedPrice : '';
    document.getElementById('ven-deposit').value = v ? v.depositAmount : 0;
    document.getElementById('ven-deadline').value = v ? (v.finalPaymentDate || '') : '';
    document.getElementById('ven-status').value = v ? v.status : 'รอดำเนินการ (Pending)';
    document.getElementById('ven-notes').value = v ? v.notes : '';
    document.getElementById('ven-sync-budget').checked = v ? Boolean(v.syncedToBudget) : true;

    this.tempUploads.vendorImages = v && Array.isArray(v.images) ? [...v.images] : [];
    this.tempUploads.vendorSlips = v && Array.isArray(v.paymentSlips) ? [...v.paymentSlips] : [];
    this.renderVendorModalUploads();

    document.getElementById('vendor-modal-title').textContent = v ? 'แก้ไขข้อมูลผู้ให้บริการ' : 'เพิ่มผู้ให้บริการ & ใบเสนอราคา';
    this.openModal('modal-vendor');
  },

  renderVendorModalUploads() {
    const grid = document.getElementById('ven-modal-slips-preview');
    if (!grid) return;
    grid.innerHTML = [
      ...this.tempUploads.vendorImages.map((src, i) => `
        <div style="position:relative;">
          <img src="${this.escapeHtml(src)}" class="slip-thumb" onclick="App.openLightbox('${this.escapeHtml(src)}')" />
          <button type="button" style="position:absolute;top:-6px;right:-6px;background:#A94A56;color:#FFF;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;" onclick="App.removeTempUpload('vendorImages', ${i})">✕</button>
        </div>
      `),
      ...this.tempUploads.vendorSlips.map((src, i) => `
        <div style="position:relative;">
          <img src="${this.escapeHtml(src)}" class="slip-thumb" style="border-color:var(--sage-500);" onclick="App.openLightbox('${this.escapeHtml(src)}')" />
          <span style="position:absolute;bottom:2px;right:2px;font-size:8px;background:var(--sage-500);color:#FFF;padding:0 2px;border-radius:2px;">สลิป</span>
          <button type="button" style="position:absolute;top:-6px;right:-6px;background:#A94A56;color:#FFF;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;" onclick="App.removeTempUpload('vendorSlips', ${i})">✕</button>
        </div>
      `)
    ].join('');
  },

  removeTempUpload(key, index) {
    if (this.tempUploads[key]) {
      this.tempUploads[key].splice(index, 1);
      if (key.startsWith('vendor')) this.renderVendorModalUploads();
      else if (key.startsWith('budget')) this.renderBudgetModalUploads();
    }
  },

  async handleVendorMultiUpload(event, type) {
    const files = Array.from(event.target.files);
    for (const f of files) {
      try {
        const compressed = await this.compressImage(f, 800, 0.70);
        if (type === 'image') this.tempUploads.vendorImages.push(compressed);
        else if (type === 'slip') this.tempUploads.vendorSlips.push(compressed);
      } catch (err) {
        console.error(err);
      }
    }
    this.renderVendorModalUploads();
    this.toast(`อัปโหลดไฟล์รูปสำเร็จ ${files.length} รูป`, '📎');
  },

  saveVendorForm(e) {
    e.preventDefault();
    const sync = document.getElementById('ven-sync-budget').checked;
    window.weddingStore.saveVendor({
      id: document.getElementById('ven-id').value,
      name: document.getElementById('ven-name').value.trim(),
      category: document.getElementById('ven-cat').value,
      contactName: document.getElementById('ven-contact').value.trim(),
      phone: document.getElementById('ven-phone').value.trim(),
      lineOrIg: document.getElementById('ven-line').value.trim(),
      quotationRef: document.getElementById('ven-qref').value.trim(),
      quotedPrice: Number(document.getElementById('ven-price').value) || 0,
      depositAmount: Number(document.getElementById('ven-deposit').value) || 0,
      finalPaymentDate: document.getElementById('ven-deadline').value,
      status: document.getElementById('ven-status').value,
      notes: document.getElementById('ven-notes').value.trim(),
      images: this.tempUploads.vendorImages,
      paymentSlips: this.tempUploads.vendorSlips
    }, sync);
    this.tempUploads.vendorImages = [];
    this.tempUploads.vendorSlips = [];
    this.closeModal('modal-vendor');
    this.toast('บันทึกข้อมูลผู้ให้บริการเรียบร้อย');
  },

  openMeetingModal(vendorId) {
    const v = window.weddingStore.state.vendors.find(x => x.id === vendorId);
    if (!v) return;
    document.getElementById('mt-vendor-id').value = vendorId;
    document.getElementById('mt-vendor-name').textContent = v.name;
    document.getElementById('mt-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('mt-topic').value = '';
    document.getElementById('mt-summary').value = '';
    document.getElementById('mt-next').value = '';
    this.openModal('modal-meeting');
  },

  saveMeetingForm(e) {
    e.preventDefault();
    const vendorId = document.getElementById('mt-vendor-id').value;
    window.weddingStore.addVendorMeeting(vendorId, {
      date: document.getElementById('mt-date').value,
      topic: document.getElementById('mt-topic').value.trim(),
      summary: document.getElementById('mt-summary').value.trim(),
      nextAction: document.getElementById('mt-next').value.trim()
    });
    this.closeModal('modal-meeting');
    this.toast('เพิ่มบันทึกการประชุมเรียบร้อยแล้ว', '📝');
  },

  /* ==========================================================================
     4. CHECKLIST & TIMELINE (10 Granular Stages)
     ========================================================================== */
  renderChecklist(summary) {
    document.getElementById('chk-progress-label').textContent = `ดำเนินการเสร็จแล้ว ${summary.completedTasks} จาก ${summary.totalTasks} งาน (${summary.taskProgressPercent}%)`;
    document.getElementById('chk-progress-bar').style.width = `${summary.taskProgressPercent}%`;

    // Render 10 Stages Selector Pills
    const stageNav = document.getElementById('checklist-stage-pills');
    stageNav.innerHTML = [
      `<button class="stage-pill ${this.filters.checklistStage === 'all' ? 'active' : ''}" onclick="App.filters.checklistStage='all'; App.renderChecklist(window.weddingStore.getSummary());">ทั้งหมด (All Stages)</button>`,
      ...CHECKLIST_STAGES.map(st => `
        <button class="stage-pill ${this.filters.checklistStage === st ? 'active' : ''}" onclick="App.filters.checklistStage='${st}'; App.renderChecklist(window.weddingStore.getSummary());">
          ${st}
        </button>
      `)
    ].join('');

    const q = this.filters.checklistSearch.toLowerCase();
    const activeStage = this.filters.checklistStage;

    const tasks = window.weddingStore.state.checklist.filter(t => {
      const matchStage = activeStage === 'all' || t.timeframe === activeStage;
      const matchQ = !q || t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return matchStage && matchQ;
    });

    const container = document.getElementById('checklist-container');
    if (tasks.length === 0) {
      container.innerHTML = `<div class="card" style="text-align:center; padding:40px;">ไม่พบรายการงานในช่วงเวลานี้</div>`;
      return;
    }

    // Group by Stage
    const stagesToRender = activeStage === 'all' ? CHECKLIST_STAGES : [activeStage];
    container.innerHTML = stagesToRender.map(stageName => {
      const stageTasks = tasks.filter(t => t.timeframe === stageName);
      if (stageTasks.length === 0) return '';

      return `
        <div class="timeline-group" style="margin-bottom:24px;">
          <div class="timeline-dot"></div>
          <h3 style="font-family:var(--font-serif); font-size:22px; color:var(--blush-600); margin-bottom:12px;">
            ⏳ ${stageName} (${stageTasks.length} งาน)
          </h3>

          ${stageTasks.map(t => `
            <div class="checklist-item ${t.completed ? 'completed' : ''}">
              <div style="display:flex; align-items:flex-start; gap:14px; flex:1;">
                <div class="custom-checkbox" style="margin-top:3px;" onclick="window.weddingStore.toggleTask('${t.id}')">
                  ${t.completed ? '✓' : ''}
                </div>
                <div style="flex:1;">
                  <div class="task-title" style="font-size:15px; font-weight:500;">${this.escapeHtml(t.title)}</div>
                  <div style="display:flex; flex-wrap:wrap; gap:8px 16px; font-size:12.5px; color:var(--text-secondary); margin-top:4px;">
                    <span>🏷 ${this.escapeHtml(t.category)}</span>
                    <span>👤 ผู้รับผิดชอบ: <strong>${this.escapeHtml(t.assignee)}</strong></span>
                    <span>📅 กำหนดส่ง: <strong>${this.formatDateThai(t.dueDate)}</strong></span>
                  </div>
                  ${t.notes ? `<div style="font-size:12.5px; color:var(--text-muted); margin-top:4px; background:var(--bg-ivory); padding:4px 8px; border-radius:4px;">💡 ${this.escapeHtml(t.notes)}</div>` : ''}
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge ${t.priority === 'สูง' ? 'badge-danger' : (t.priority === 'กลาง' ? 'badge-warning' : 'badge-info')}">สำคัญ${this.escapeHtml(t.priority)}</span>
                <button class="btn-icon" onclick="App.openTaskModal('${t.id}')" title="แก้ไข">✎</button>
                <button class="btn-icon" onclick="App.deleteTaskConfirm('${t.id}', '${this.escapeHtml(t.title)}')" title="ลบ">🗑</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  },

  openTaskModal(id = '') {
    const t = window.weddingStore.state.checklist.find(x => x.id === id);
    document.getElementById('chk-id').value = t ? t.id : '';
    document.getElementById('chk-title').value = t ? t.title : '';
    document.getElementById('chk-cat').value = t ? t.category : 'สถานที่ & แคเทอริ่ง';
    document.getElementById('chk-timeframe').value = t ? t.timeframe : '12 เดือนก่อนงาน';
    document.getElementById('chk-assignee').value = t ? t.assignee : 'ทำร่วมกัน';
    document.getElementById('chk-duedate').value = t ? t.dueDate : new Date().toISOString().split('T')[0];
    document.getElementById('chk-priority').value = t ? t.priority : 'สูง';
    document.getElementById('chk-notes').value = t ? t.notes : '';
    document.getElementById('chk-modal-title').textContent = t ? 'แก้ไขรายการงาน' : 'เพิ่มงานใน Checklist & Timeline';
    this.openModal('modal-task');
  },

  saveTaskForm(e) {
    e.preventDefault();
    window.weddingStore.saveTask({
      id: document.getElementById('chk-id').value,
      title: document.getElementById('chk-title').value.trim(),
      category: document.getElementById('chk-cat').value,
      timeframe: document.getElementById('chk-timeframe').value,
      assignee: document.getElementById('chk-assignee').value,
      dueDate: document.getElementById('chk-duedate').value,
      priority: document.getElementById('chk-priority').value,
      notes: document.getElementById('chk-notes').value.trim()
    });
    this.closeModal('modal-task');
    this.toast('บันทึกรายการงานเรียบร้อย');
  },

  /* ==========================================================================
     5. GUEST LIST & REAL SEATING PLAN IMAGE
     ========================================================================== */
  renderGuests(summary) {
    document.getElementById('gst-sum-confirmed').textContent = `${summary.confirmedSeats} ที่นั่ง (${summary.confirmedGroups} กลุ่ม)`;
    document.getElementById('gst-sum-pending').textContent = `${summary.pendingSeats} ที่นั่ง (${summary.pendingGroups} กลุ่ม)`;
    document.getElementById('gst-sum-declined').textContent = `${summary.declinedCount} รายชื่อ`;
    document.getElementById('gst-sum-total').textContent = `${summary.totalProjectedSeats} ที่นั่งรวม`;

    // Real Seating Plan Image Preview
    const realImgSlot = document.getElementById('seating-real-plan-slot');
    const realPlanImg = window.weddingStore.state.weddingInfo.seatingPlanImage;
    if (realImgSlot) {
      if (realPlanImg) {
        realImgSlot.innerHTML = `
          <img src="${this.escapeHtml(realPlanImg)}" class="seating-plan-preview-img" alt="ผังที่นั่งวันจริง" onclick="App.openLightbox('${this.escapeHtml(realPlanImg)}')" />
          <div style="font-size:11.5px; color:var(--text-muted); margin-top:6px;">คลิกที่รูปภาพเพื่อเปิดดูผังขนาดใหญ่เต็มจอ (Zoom Lightbox)</div>
        `;
      } else {
        realImgSlot.innerHTML = `<div style="padding:24px; color:var(--text-muted); font-size:13px;">ยังไม่มีการอัปโหลดรูปผังที่นั่งวันจริง สามารถกดปุ่ม "+ อัปโหลดผังที่นั่ง" ด้านบนได้เลย</div>`;
      }
    }

    // Table Summary Header Update
    const tableSub = document.getElementById('table-summary-subtitle');
    if (tableSub) {
      tableSub.textContent = `รวมทั้งหมด ${summary.totalTables || 0} โต๊ะ • รองรับได้ ${summary.totalTableCapacity || 0} ที่นั่ง • จัดคนนั่งแล้ว ${summary.totalSeatedGuests || 0} ที่นั่ง`;
    }

    // Table Breakdown & Seating Management Cards
    const tableGrid = document.getElementById('guest-seating-grid');
    const tables = Object.entries(summary.tableMap);

    if (tables.length === 0) {
      tableGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:32px; background:var(--bg-surface-solid); border:1px dashed var(--border-soft); border-radius:var(--radius-md);">
          <div style="font-size:32px; margin-bottom:8px;">🪑</div>
          <div style="font-weight:600; font-size:15px;">ยังไม่มีโต๊ะในระบบ</div>
          <p style="font-size:12.5px; color:var(--text-muted); margin:4px 0 14px;">กดปุ่ม "+ เพิ่มโต๊ะใหม่" หรือ "⚡ +1 โต๊ะด่วน" เพื่อเริ่มจัดผังที่นั่งแขก</p>
          <button class="btn btn-primary btn-sm" onclick="App.openTableModal()">+ เพิ่มโต๊ะแรก</button>
        </div>
      `;
    } else {
      tableGrid.innerHTML = tables.map(([tableName, data]) => {
        const capacity = data.capacity || 10;
        const seats = data.seats || 0;
        const isOver = seats > capacity;
        const isFull = seats === capacity;
        const remaining = capacity - seats;
        const percent = Math.min(100, Math.round((seats / capacity) * 100));

        let statusText = `ว่าง ${remaining} ที่`;
        let statusBadgeClass = 'badge-success';
        if (isOver) {
          statusText = `เกิน ${seats - capacity} ที่`;
          statusBadgeClass = 'badge-danger';
        } else if (isFull) {
          statusText = `เต็ม ${capacity}/${capacity}`;
          statusBadgeClass = 'badge-champagne';
        }

        return `
          <div class="table-card ${isOver ? 'table-card-over' : (isFull ? 'table-card-full' : '')}">
            <div>
              <div class="table-card-header">
                <div>
                  <div class="table-card-title">🪑 ${this.escapeHtml(tableName)}</div>
                  ${data.notes ? `<div class="table-card-notes">${this.escapeHtml(data.notes)}</div>` : ''}
                </div>
                <div class="table-card-actions">
                  <button class="btn-icon" style="width:28px;height:28px;" onclick="App.openTableModal('${data.id}')" title="แก้ไขโต๊ะนี้">✎</button>
                  <button class="btn-icon" style="width:28px;height:28px;" onclick="App.deleteTableConfirm('${data.id}', '${this.escapeHtml(tableName)}')" title="ลบโต๊ะนี้">🗑</button>
                </div>
              </div>

              <!-- Capacity Progress -->
              <div style="margin:10px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; margin-bottom:4px;">
                  <span style="font-weight:600; color:${isOver ? 'var(--status-danger-text)' : 'var(--text-primary)'};">
                    ${seats} / ${capacity} ที่นั่ง
                  </span>
                  <span class="badge ${statusBadgeClass}" style="font-size:10.5px;">${statusText}</span>
                </div>
                <div class="table-progress-bar">
                  <div class="table-progress-fill ${isOver ? 'fill-over' : (isFull ? 'fill-full' : '')}" style="width:${percent}%;"></div>
                </div>
              </div>

              <!-- Seated Guests List -->
              <div class="table-guests-box">
                <div style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">
                  👥 คนที่นั่งโต๊ะนี้ (${data.guests.length} กลุ่ม):
                </div>
                ${data.guests.length === 0 ? `
                  <div style="font-size:12px; color:var(--text-muted); font-style:italic; padding:6px 0;">ยังไม่มีคนนั่งโต๊ะนี้</div>
                ` : `
                  <ul class="table-guest-list">
                    ${data.guests.map(g => `
                      <li class="table-guest-item">
                        <div style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                          <span class="table-guest-name">${this.escapeHtml(g.name)}</span>
                          <span class="table-guest-seats">${g.seats} ที่</span>
                        </div>
                        <button class="table-remove-btn" onclick="App.removeGuestFromTableConfirm('${g.id}', '${this.escapeHtml(g.name)}', '${this.escapeHtml(tableName)}')" title="ถอดออกจากโต๊ะนี้">✕</button>
                      </li>
                    `).join('')}
                  </ul>
                `}
              </div>
            </div>

            <!-- Add Person Button -->
            <div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--border-soft);">
              <button class="btn btn-soft btn-sm" style="width:100%; justify-content:center; font-size:12px;" onclick="App.openSeatPersonModal('${this.escapeHtml(tableName)}')">
                + ใส่ชื่อคนนั่งโต๊ะนี้
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Guest Table Rows
    const rsvpFilter = this.filters.guestRsvp;
    const sideFilter = this.filters.guestSide;
    const q = this.filters.guestSearch.toLowerCase();

    const guests = window.weddingStore.state.guests.filter(g => {
      const matchRsvp = rsvpFilter === 'all' || g.rsvp === rsvpFilter;
      const matchSide = sideFilter === 'all' || g.side === sideFilter;
      const matchQ = !q ||
        g.name.toLowerCase().includes(q) ||
        (g.group || '').toLowerCase().includes(q) ||
        (g.tableNo || '').toLowerCase().includes(q) ||
        (g.dietary || '').toLowerCase().includes(q);
      return matchRsvp && matchSide && matchQ;
    });

    const tbody = document.getElementById('guest-table-body');
    if (guests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">ไม่พบรายชื่อแขกในตัวกรองนี้</td></tr>`;
      return;
    }

    tbody.innerHTML = guests.map(g => {
      let badge = 'badge-warning';
      if (g.rsvp === 'ยืนยันมาร่วมงาน') badge = 'badge-success';
      else if (g.rsvp === 'ไม่สะดวกมาร่วม') badge = 'badge-danger';

      return `
        <tr>
          <td>
            <div style="font-weight:500;">${this.escapeHtml(g.name)}</div>
            <div style="font-size:11.5px; color:var(--text-muted);">📞 ${this.escapeHtml(g.phone || '-')}</div>
          </td>
          <td><span class="badge badge-blush">${this.escapeHtml(g.side)}</span></td>
          <td>${this.escapeHtml(g.group)}</td>
          <td><span class="badge ${badge}">${this.escapeHtml(g.rsvp)}</span></td>
          <td style="font-weight:600;">${g.seats} ที่นั่ง</td>
          <td><span class="badge badge-champagne">${this.escapeHtml(g.tableNo || '-')}</span></td>
          <td>${this.escapeHtml(g.dietary || 'อาหารปกติ')}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn-icon" style="width:30px;height:30px;" onclick="App.openGuestModal('${g.id}')">✎</button>
              <button class="btn-icon" style="width:30px;height:30px;" onclick="App.deleteGuestConfirm('${g.id}', '${this.escapeHtml(g.name)}')">🗑</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async handleSeatingPlanUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const compressed = await this.compressImage(file, 1200, 0.75);
      window.weddingStore.updateWeddingInfo({ seatingPlanImage: compressed });
      this.toast('อัปเดตผังที่นั่งวันจริงเรียบร้อยแล้ว', '🪑');
    } catch (e) {
      alert('ไม่สามารถอัปโหลดไฟล์รูปภาพผังที่นั่งได้');
    }
  },

  /* --------------------------------------------------------------------------
     Table & Seating Management Handlers
     -------------------------------------------------------------------------- */
  openTableModal(tableId = '') {
    const t = window.weddingStore.state.tables.find(x => x.id === tableId);
    document.getElementById('tbl-id').value = t ? t.id : '';
    document.getElementById('tbl-name').value = t ? t.name : '';
    document.getElementById('tbl-capacity').value = t ? t.capacity : (Number(window.weddingStore.state.weddingInfo.seatsPerTable) || 10);
    document.getElementById('tbl-notes').value = t ? (t.notes || '') : '';
    document.getElementById('table-modal-title').textContent = t ? 'แก้ไขข้อมูลโต๊ะ' : '+ เพิ่มโต๊ะใหม่';
    this.openModal('modal-table');
  },

  saveTableForm(e) {
    e.preventDefault();
    const id = document.getElementById('tbl-id').value;
    const name = document.getElementById('tbl-name').value.trim();
    const capacity = Number(document.getElementById('tbl-capacity').value) || 10;
    const notes = document.getElementById('tbl-notes').value.trim();
    if (!name) return;

    window.weddingStore.saveTable({ id, name, capacity, notes });
    this.closeModal('modal-table');
    this.toast(`บันทึกโต๊ะ "${name}" เรียบร้อยแล้ว`, '🪑');
  },

  deleteTableConfirm(id, tableName) {
    if (confirm(`คุณต้องการลบ "${tableName}" ใช่หรือไม่?\n(แขกที่เคยนั่งในโต๊ะนี้จะไม่ถูกลบ แต่จะเปลี่ยนเป็นสถานะยังไม่ระบุโต๊ะ เพื่อให้สามารถย้ายไปโต๊ะอื่นได้)`)) {
      window.weddingStore.deleteTable(id);
      this.toast(`ลบ "${tableName}" เรียบร้อย`, '🗑');
    }
  },

  addQuickTable() {
    window.weddingStore.addQuickTable();
    this.toast('เพิ่มโต๊ะใหม่เรียบร้อยแล้ว', '⚡');
  },

  openSeatPersonModal(tableName) {
    document.getElementById('seat-target-table').value = tableName;
    document.getElementById('seat-person-modal-title').textContent = `ใส่ชื่อคนนั่ง: ${tableName}`;

    const summary = window.weddingStore.getSummary();
    const tData = summary.tableMap[tableName];
    const cap = tData ? tData.capacity : 10;
    const seated = tData ? tData.seats : 0;
    const remain = cap - seated;
    document.getElementById('seat-person-modal-subtitle').textContent = `ความจุ: ${seated} / ${cap} ที่นั่ง (${remain >= 0 ? `ว่าง ${remain} ที่` : `เกิน ${-remain} ที่`})`;

    document.getElementById('seat-new-name').value = '';
    document.getElementById('seat-new-seats').value = 1;
    document.getElementById('seat-new-side').value = 'เจ้าสาว';
    document.getElementById('seat-new-phone').value = '';
    document.getElementById('seat-new-dietary').value = '';

    const sel = document.getElementById('seat-existing-guest-select');
    if (sel) {
      const unassigned = window.weddingStore.state.guests.filter(g => (!g.tableNo || g.tableNo === '-' || g.tableNo === '' || g.tableNo === 'ไม่มี') && g.rsvp !== 'ไม่สะดวกมาร่วม');
      sel.innerHTML = `<option value="">-- เลือกแขกที่ยังไม่ระบุโต๊ะ (${unassigned.length} ท่าน) --</option>` +
        unassigned.map(g => `<option value="${g.id}">${this.escapeHtml(g.name)} (${g.seats} ที่ • ฝ่าย${this.escapeHtml(g.side)})</option>`).join('');
    }

    this.openModal('modal-seat-person');
  },

  saveSeatNewPersonForm(e) {
    e.preventDefault();
    const targetTable = document.getElementById('seat-target-table').value;
    const name = document.getElementById('seat-new-name').value.trim();
    const seats = Number(document.getElementById('seat-new-seats').value) || 1;
    const side = document.getElementById('seat-new-side').value;
    const phone = document.getElementById('seat-new-phone').value.trim();
    const dietary = document.getElementById('seat-new-dietary').value.trim() || 'อาหารปกติ';

    if (!name) return;

    window.weddingStore.saveGuest({
      name,
      seats,
      side,
      tableNo: targetTable,
      phone,
      dietary,
      group: 'จัดที่นั่งโดยตรง',
      rsvp: 'ยืนยันมาร่วมงาน',
      inviteSent: true
    });

    this.closeModal('modal-seat-person');
    this.toast(`จัดคุณ "${name}" (${seats} ที่) นั่งที่ ${targetTable} แล้ว`, '🪑');
  },

  assignExistingGuestToTable() {
    const sel = document.getElementById('seat-existing-guest-select');
    const guestId = sel ? sel.value : '';
    const targetTable = document.getElementById('seat-target-table').value;

    if (!guestId) {
      alert('กรุณาเลือกรายชื่อแขกที่ต้องการจัดเข้าโต๊ะนี้');
      return;
    }

    const guest = window.weddingStore.state.guests.find(x => x.id === guestId);
    window.weddingStore.assignGuestToTable(guestId, targetTable);
    this.closeModal('modal-seat-person');
    this.toast(`จัดคุณ "${guest ? guest.name : ''}" นั่งที่ ${targetTable} เรียบร้อย`, '🪑');
  },

  removeGuestFromTableConfirm(guestId, guestName, tableName) {
    if (confirm(`ต้องการถอดคุณ "${guestName}" ออกจาก ${tableName} ใช่หรือไม่?\n(รายชื่อแขกจะไม่ถูกลบออกจากระบบ แต่จะกลายเป็นสถานะยังไม่ระบุโต๊ะ)`)) {
      window.weddingStore.removeGuestFromTable(guestId);
      this.toast(`ถอดคุณ "${guestName}" ออกจาก ${tableName} แล้ว`, '🗑');
    }
  },

  populateGuestTableSelect(selected = '') {
    const sel = document.getElementById('gst-table');
    if (!sel) return;
    const tables = window.weddingStore.state.tables || [];
    sel.innerHTML = `
      <option value="">-- ยังไม่ระบุโต๊ะ --</option>
      ${tables.map(t => `<option value="${this.escapeHtml(t.name)}" ${t.name === selected ? 'selected' : ''}>🪑 ${this.escapeHtml(t.name)} (ความจุ ${t.capacity} ที่)</option>`).join('')}
    `;
    if (selected && !tables.some(t => t.name === selected)) {
      sel.innerHTML += `<option value="${this.escapeHtml(selected)}" selected>🪑 ${this.escapeHtml(selected)}</option>`;
    }
  },

  openGuestModal(id = '') {
    const g = window.weddingStore.state.guests.find(x => x.id === id);
    document.getElementById('gst-id').value = g ? g.id : '';
    document.getElementById('gst-name').value = g ? g.name : '';
    document.getElementById('gst-side').value = g ? g.side : 'เจ้าสาว';
    document.getElementById('gst-group').value = g ? g.group : 'ครอบครัวและญาติผู้ใหญ่';
    document.getElementById('gst-rsvp').value = g ? g.rsvp : 'ยืนยันมาร่วมงาน';
    document.getElementById('gst-seats').value = g ? g.seats : 2;
    this.populateGuestTableSelect(g ? g.tableNo : '');
    document.getElementById('gst-dietary').value = g ? g.dietary : 'อาหารปกติ';
    document.getElementById('gst-phone').value = g ? g.phone : '';
    document.getElementById('guest-modal-title').textContent = g ? 'แก้ไขข้อมูลแขกผู้มีเกียรติ' : 'เพิ่มรายชื่อแขก & ที่นั่ง';
    this.openModal('modal-guest');
  },

  saveGuestForm(e) {
    e.preventDefault();
    const rsvp = document.getElementById('gst-rsvp').value;
    const rawSeats = Number(document.getElementById('gst-seats').value) || 0;
    window.weddingStore.saveGuest({
      id: document.getElementById('gst-id').value,
      name: document.getElementById('gst-name').value.trim(),
      side: document.getElementById('gst-side').value,
      group: document.getElementById('gst-group').value.trim(),
      rsvp,
      seats: rsvp === 'ไม่สะดวกมาร่วม' ? 0 : rawSeats,
      tableNo: document.getElementById('gst-table').value.trim() || '-',
      dietary: document.getElementById('gst-dietary').value.trim() || 'อาหารปกติ',
      phone: document.getElementById('gst-phone').value.trim(),
      inviteSent: true
    });
    this.closeModal('modal-guest');
    this.toast('บันทึกรายชื่อแขกเรียบร้อยแล้ว');
  },

  exportGuestsCSV() {
    const rows = [
      ['ชื่อ-นามสกุล', 'ฝ่าย', 'กลุ่ม', 'สถานะตอบรับ (RSVP)', 'จำนวนที่นั่ง', 'หมายเลขโต๊ะ', 'ข้อจำกัดอาหาร', 'เบอร์โทรศัพท์']
    ];
    window.weddingStore.state.guests.forEach(g => {
      rows.push([g.name, g.side, g.group, g.rsvp, g.seats, g.tableNo, g.dietary, g.phone]);
    });
    const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding-guest-list-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    this.toast('ดาวน์โหลดไฟล์ CSV รายชื่อแขกเรียบร้อย', '📥');
  },

  /* ==========================================================================
     6. BUDGET TRACKER (Categorized with Multi-Slip Uploads)
     ========================================================================== */
  renderBudget(summary) {
    document.getElementById('bdg-cap').textContent = this.formatCurrency(summary.totalBudgetCap);
    document.getElementById('bdg-actual').textContent = this.formatCurrency(summary.totalActual);
    document.getElementById('bdg-paid').textContent = this.formatCurrency(summary.totalPaid);
    document.getElementById('bdg-deposit-sub').textContent = `เป็นเงินมัดจำ ${this.formatCurrency(summary.totalDepositPaid)}`;
    document.getElementById('bdg-unpaid').textContent = this.formatCurrency(summary.totalUnpaidBalance);

    const catFilter = this.filters.budgetCategory;
    const q = this.filters.budgetSearch.toLowerCase();

    const filtered = window.weddingStore.state.budget.filter(b => {
      const matchCat = catFilter === 'all' || b.category === catFilter;
      const matchQ = !q ||
        b.title.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.vendorName || '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    const container = document.getElementById('budget-categorized-container');
    if (filtered.length === 0) {
      container.innerHTML = `<div class="card" style="text-align:center; padding:40px;">ไม่พบรายการงบประมาณในหมวดหมู่นี้</div>`;
      return;
    }

    // Group items by Category
    const groups = {};
    filtered.forEach(b => {
      const cat = b.category || 'อื่นๆ';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(b);
    });

    container.innerHTML = Object.entries(groups).map(([catName, list]) => {
      const catActual = list.reduce((acc, x) => acc + (Number(x.actual) || 0), 0);
      const catPaid = list.reduce((acc, x) => acc + ((Number(x.depositPaid) || 0) + (Number(x.additionalPaid) || 0)), 0);
      const catUnpaid = Math.max(0, catActual - catPaid);

      return `
        <div style="margin-bottom:28px;">
          <div class="category-group-header">
            <div class="category-group-title">
              <span>💎</span>
              <span>${this.escapeHtml(catName)} (${list.length} รายการ)</span>
            </div>
            <div style="font-size:12.5px; display:flex; gap:16px;">
              <span>ยอดจริง: <strong>${this.formatCurrency(catActual)}</strong></span>
              <span style="color:var(--status-success-text);">จ่ายแล้ว: <strong>${this.formatCurrency(catPaid)}</strong></span>
              <span style="color:var(--status-danger-text);">ค้างจ่าย: <strong>${this.formatCurrency(catUnpaid)}</strong></span>
            </div>
          </div>

          <div class="card" style="padding:0; overflow:hidden;">
            <div class="table-responsive">
              <table class="luxury-table">
                <thead>
                  <tr>
                    <th>รายการค่าใช้จ่าย / ร้านค้า</th>
                    <th>งบประเมิน</th>
                    <th>ค่าใช้จ่ายจริง</th>
                    <th>มัดจำแล้ว</th>
                    <th>จ่ายเพิ่มแล้ว</th>
                    <th>ค้างจ่ายคงเหลือ</th>
                    <th>สลิปโอนเงิน</th>
                    <th>กำหนดชำระ</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  ${list.map(b => {
                    const est = Number(b.estimated) || 0;
                    const act = Number(b.actual) || 0;
                    const dep = Number(b.depositPaid) || 0;
                    const add = Number(b.additionalPaid) || 0;
                    const paid = dep + add;
                    const remain = Math.max(0, act - paid);
                    const slips = Array.isArray(b.slips) ? b.slips : [];

                    let badge = 'badge-warning';
                    if (b.status === 'ชำระครบแล้ว') badge = 'badge-success';
                    else if (b.status === 'รอชำระ') badge = 'badge-danger';

                    return `
                      <tr>
                        <td>
                          <div style="font-weight:600;">${this.escapeHtml(b.title)}</div>
                          <div style="font-size:11.5px; color:var(--text-muted);">${b.vendorName ? `🏢 ${this.escapeHtml(b.vendorName)}` : 'ค่าใช้จ่ายทั่วไป'}</div>
                        </td>
                        <td>${this.formatCurrency(est)}</td>
                        <td style="font-weight:700;">${this.formatCurrency(act)}</td>
                        <td style="color:var(--blush-600);">${this.formatCurrency(dep)}</td>
                        <td style="color:var(--status-success-text);">${this.formatCurrency(add)}</td>
                        <td style="font-weight:700; color:${remain > 0 ? 'var(--status-danger-text)' : 'var(--status-success-text)'};">
                          ${this.formatCurrency(remain)}
                        </td>
                        <td>
                          ${slips.length > 0 ? `
                            <div style="display:flex; gap:4px; align-items:center;">
                              ${slips.slice(0, 3).map(s => `
                                <img src="${this.escapeHtml(s)}" class="slip-thumb" style="width:36px;height:36px;" onclick="App.openLightbox('${this.escapeHtml(s)}')" title="คลิกดูสลิป" />
                              `).join('')}
                              ${slips.length > 3 ? `<span style="font-size:11px;color:var(--text-muted);">+${slips.length - 3}</span>` : ''}
                            </div>
                          ` : `<span style="color:var(--text-muted);font-size:11px;">ไม่มีสลิป</span>`}
                        </td>
                        <td>${this.formatDateThai(b.dueDate)}</td>
                        <td><span class="badge ${badge}">${this.escapeHtml(b.status)}</span></td>
                        <td>
                          <div style="display:flex; gap:6px;">
                            <button class="btn-icon" style="width:30px;height:30px;" onclick="App.openBudgetModal('${b.id}')">✎</button>
                            <button class="btn-icon" style="width:30px;height:30px;" onclick="App.deleteBudgetConfirm('${b.id}', '${this.escapeHtml(b.title)}')">🗑</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openBudgetModal(id = '') {
    const b = window.weddingStore.state.budget.find(x => x.id === id);
    document.getElementById('bdg-id').value = b ? b.id : '';
    document.getElementById('bdg-title').value = b ? b.title : '';
    document.getElementById('bdg-cat').value = b ? b.category : 'สถานที่ & แคเทอริ่ง';
    document.getElementById('bdg-vendor').value = b ? b.vendorName : '';
    document.getElementById('bdg-est').value = b ? b.estimated : '';
    document.getElementById('bdg-act').value = b ? b.actual : '';
    document.getElementById('bdg-dep').value = b ? b.depositPaid : 0;
    document.getElementById('bdg-add').value = b ? b.additionalPaid : 0;
    document.getElementById('bdg-due').value = b ? b.dueDate : new Date().toISOString().split('T')[0];
    document.getElementById('bdg-notes').value = b ? b.notes : '';

    this.tempUploads.budgetSlips = b && Array.isArray(b.slips) ? [...b.slips] : [];
    this.renderBudgetModalUploads();

    document.getElementById('budget-modal-title').textContent = b ? 'แก้ไขรายการค่าใช้จ่าย' : 'เพิ่มรายการงบประมาณ & สลิปโอนเงิน';
    this.openModal('modal-budget');
  },

  renderBudgetModalUploads() {
    const grid = document.getElementById('bdg-modal-slips-preview');
    if (!grid) return;
    grid.innerHTML = this.tempUploads.budgetSlips.map((src, i) => `
      <div style="position:relative;">
        <img src="${this.escapeHtml(src)}" class="slip-thumb" style="border-color:var(--sage-500);" onclick="App.openLightbox('${this.escapeHtml(src)}')" />
        <button type="button" style="position:absolute;top:-6px;right:-6px;background:#A94A56;color:#FFF;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;" onclick="App.removeTempUpload('budgetSlips', ${i})">✕</button>
      </div>
    `).join('');
  },

  async handleBudgetSlipsUpload(event) {
    const files = Array.from(event.target.files);
    for (const f of files) {
      try {
        const compressed = await this.compressImage(f, 800, 0.70);
        this.tempUploads.budgetSlips.push(compressed);
      } catch (err) {
        console.error(err);
      }
    }
    this.renderBudgetModalUploads();
    this.toast(`อัปโหลดสลิปโอนเงินสำเร็จ ${files.length} รูป`, '🧾');
  },

  saveBudgetForm(e) {
    e.preventDefault();
    window.weddingStore.saveBudgetItem({
      id: document.getElementById('bdg-id').value,
      title: document.getElementById('bdg-title').value.trim(),
      category: document.getElementById('bdg-cat').value,
      vendorName: document.getElementById('bdg-vendor').value.trim(),
      estimated: Number(document.getElementById('bdg-est').value) || 0,
      actual: Number(document.getElementById('bdg-act').value) || 0,
      depositPaid: Number(document.getElementById('bdg-dep').value) || 0,
      additionalPaid: Number(document.getElementById('bdg-add').value) || 0,
      dueDate: document.getElementById('bdg-due').value,
      notes: document.getElementById('bdg-notes').value.trim(),
      slips: this.tempUploads.budgetSlips
    });
    this.tempUploads.budgetSlips = [];
    this.closeModal('modal-budget');
    this.toast('บันทึกรายการงบประมาณและสลิปโอนเงินเรียบร้อย');
  },

  /* ==========================================================================
     7. RUN DOWN (Detailed Chronological Schedule with Status, Songs & Notes)
     ========================================================================== */
  renderRundown() {
    const sessionFilter = this.filters.rundownSession;
    const statusFilter = this.filters.rundownStatus;
    const q = this.filters.rundownSearch.toLowerCase();

    // Chronologically sorted items
    const items = [...window.weddingStore.state.runOfShow]
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
      .filter(item => {
        const matchSession = sessionFilter === 'all' || item.session === sessionFilter;
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchSearch = !q ||
          item.title.toLowerCase().includes(q) ||
          (item.leadPerson || '').toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q) ||
          (item.notes || '').toLowerCase().includes(q);
        return matchSession && matchStatus && matchSearch;
      });

    const container = document.getElementById('rundown-list-container');
    if (items.length === 0) {
      container.innerHTML = `<div class="card" style="text-align:center; padding:40px;">ไม่พบรายการในตารางรันคิวนี้</div>`;
      return;
    }

    container.innerHTML = items.map(item => {
      let badgeClass = 'badge-info';
      if (item.status === 'กำลังดำเนินการ') badgeClass = 'badge-warning';
      else if (item.status === 'เสร็จสิ้น') badgeClass = 'badge-success';

      return `
        <div class="ros-card ${item.status === 'เสร็จสิ้น' ? 'completed' : ''}">
          <!-- Time Badge -->
          <div class="ros-time-badge">
            <div class="ros-time-start">${this.escapeHtml(item.startTime)} น.</div>
            <div class="ros-time-end">ถึง ${this.escapeHtml(item.endTime || '-')} น.</div>
            <div style="margin-top:6px;">
              <span class="badge ${badgeClass}" style="font-size:10.5px;">${this.escapeHtml(item.status || 'เตรียมพร้อม')}</span>
            </div>
          </div>

          <!-- Body -->
          <div class="ros-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div>
                <h4 class="ros-title">${this.escapeHtml(item.title)}</h4>
                <div style="font-size:12.5px; color:var(--text-secondary); display:flex; flex-wrap:wrap; gap:12px; margin-top:2px;">
                  <span>📍 <strong>สถานที่:</strong> ${this.escapeHtml(item.location || '-')}</span>
                  <span>👤 <strong>ผู้รับผิดชอบ:</strong> ${this.escapeHtml(item.leadPerson || '-')}</span>
                  ${item.phone ? `<span>📞 <strong>เบอร์โทร:</strong> ${this.escapeHtml(item.phone)}</span>` : ''}
                </div>
              </div>

              <!-- Quick Status Selector & Actions -->
              <div style="display:flex; align-items:center; gap:8px;">
                <select class="form-select" style="padding:4px 8px; font-size:12px; border-radius:99px; width:auto;" onchange="window.weddingStore.updateRunOfShowStatus('${item.id}', this.value)">
                  <option value="เตรียมพร้อม" ${item.status === 'เตรียมพร้อม' ? 'selected' : ''}>เตรียมพร้อม</option>
                  <option value="กำลังดำเนินการ" ${item.status === 'กำลังดำเนินการ' ? 'selected' : ''}>กำลังดำเนินการ</option>
                  <option value="เสร็จสิ้น" ${item.status === 'เสร็จสิ้น' ? 'selected' : ''}>เสร็จสิ้น</option>
                </select>
                <button class="btn-icon" style="width:30px;height:30px;" onclick="App.openRundownModal('${item.id}')" title="แก้ไข">✎</button>
                <button class="btn-icon" style="width:30px;height:30px;" onclick="App.deleteRundownConfirm('${item.id}', '${this.escapeHtml(item.title)}')" title="ลบ">🗑</button>
              </div>
            </div>

            <!-- Detailed Notes (Music, Flower Girl, Scripts) -->
            ${item.notes ? `
              <div class="ros-script-box" style="margin-top:10px;">
                <strong>💡 โน้ตกำกับคิว / เพลง / ข้อควรระวัง:</strong><br />
                ${this.escapeHtml(item.notes)}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  openRundownModal(id = '') {
    const item = window.weddingStore.state.runOfShow.find(r => r.id === id);
    document.getElementById('ros-id').value = item ? item.id : '';
    document.getElementById('ros-session').value = item ? (item.session || 'morning') : 'morning';
    document.getElementById('ros-start').value = item ? item.startTime : '09:09';
    document.getElementById('ros-end').value = item ? item.endTime : '09:39';
    document.getElementById('ros-title-input').value = item ? item.title : '';
    document.getElementById('ros-status-input').value = item ? (item.status || 'เตรียมพร้อม') : 'เตรียมพร้อม';
    document.getElementById('ros-lead').value = item ? item.leadPerson : '';
    document.getElementById('ros-phone').value = item ? item.phone : '';
    document.getElementById('ros-location').value = item ? item.location : '';
    document.getElementById('ros-notes-input').value = item ? item.notes : '';

    document.getElementById('rundown-modal-title').textContent = item ? 'แก้ไขรายการในตารางรันคิว' : 'เพิ่มกิจกรรมในตารางรันคิววันงาน';
    this.openModal('modal-rundown');
  },

  saveRundownForm(e) {
    e.preventDefault();
    window.weddingStore.saveRunOfShowItem({
      id: document.getElementById('ros-id').value,
      session: document.getElementById('ros-session').value,
      startTime: document.getElementById('ros-start').value,
      endTime: document.getElementById('ros-end').value,
      title: document.getElementById('ros-title-input').value.trim(),
      status: document.getElementById('ros-status-input').value,
      leadPerson: document.getElementById('ros-lead').value.trim(),
      phone: document.getElementById('ros-phone').value.trim(),
      location: document.getElementById('ros-location').value.trim(),
      notes: document.getElementById('ros-notes-input').value.trim(),
      completed: document.getElementById('ros-status-input').value === 'เสร็จสิ้น'
    });
    this.closeModal('modal-rundown');
    this.toast('บันทึกกำหนดการรันคิวและจัดเรียงเวลาอัตโนมัติแล้ว', '⏳');
  },

  /* ==========================================================================
     BACKUP & EXPORT
     ========================================================================== */
  exportBackupJSON() {
    const dataStr = JSON.stringify(window.weddingStore.state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding-planner-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    this.toast('สำรองฐานข้อมูลทั้งหมดเป็นไฟล์ JSON เรียบร้อย', '💾');
  },

  importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        window.weddingStore.importJSON(e.target.result);
        this.toast('นำเข้าข้อมูลสำเร็จแล้ว!', '🎉');
      } catch (err) {
        alert('ไม่สามารถอ่านไฟล์ JSON ได้: ' + err.message);
      }
    };
    reader.readAsText(file);
  },

  resetDemoData() {
    if (confirm('ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลตัวอย่างเริ่มต้นหรือไม่?')) {
      window.weddingStore.resetToDemo();
      this.toast('รีเซ็ตข้อมูลตัวอย่างเริ่มต้นเรียบร้อยแล้ว', '🔄');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
