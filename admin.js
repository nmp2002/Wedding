(function () {
  'use strict';

  function safeSetStatus(msg) {
    try {
      if (window.__setAdminStatus) return window.__setAdminStatus(msg);
      const el = document.getElementById('adminStatus');
      if (el) el.textContent = String(msg || '');
    } catch (_) {
      // ignore
    }
  }

  if (document && document.body) {
    document.body.classList.add('isLoaded');
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) document.body.classList.add('isLoaded');
    }, { once: true });
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(el, value) {
    if (!el) return;
    el.textContent = value;
  }

  const els = {
    status: byId('adminStatus'),

    loginForm: byId('adminLoginForm'),
    email: byId('adminEmail'),
    pass: byId('adminPass'),
    loginBtn: byId('adminLoginBtn'),
    logoutBtn: byId('adminLogoutBtn'),
    authHint: byId('adminAuthHint'),

    panel: byId('adminPanel'),

    btnLoadGuests: byId('btnLoadGuests'),
    btnLoadRsvps: byId('btnLoadRsvps'),
    btnExportGuests: byId('btnExportGuests'),
    btnExportRsvps: byId('btnExportRsvps'),

    guestCreateForm: byId('guestCreateForm'),
    guestCreateName: byId('guestCreateName'),
    guestCreatePhone: byId('guestCreatePhone'),
    guestCreateSide: byId('guestCreateSide'),
    guestCreateBtn: byId('guestCreateBtn'),
    guestCreateHint: byId('guestCreateHint'),
    guestLinkRow: byId('guestLinkRow'),
    guestLinkOut: byId('guestLinkOut'),
    btnCopyGuestLink: byId('btnCopyGuestLink'),

    tableTitle: byId('tableTitle'),
    tableMeta: byId('tableMeta'),
    thead: byId('adminThead'),
    tbody: byId('adminTbody'),
  };

  let lastGuests = [];
  let lastRsvps = [];

  function canUseDb() {
    return !!(window.WeddingDB && typeof window.WeddingDB.listGuests === 'function' && window.WeddingDB.isReady && window.WeddingDB.isReady());
  }

  function ensureFirebaseInited() {
    try {
      if (window.WeddingDB && typeof window.WeddingDB.init === 'function') {
        window.WeddingDB.init();
      }
    } catch (_) {
      // ignore
    }
  }

  function getAuth() {
    ensureFirebaseInited();
    if (!window.firebase || typeof window.firebase.auth !== 'function') return null;
    return window.firebase.auth();
  }

  function setLoggedIn(isLoggedIn) {
    if (els.panel) els.panel.hidden = !isLoggedIn;
    if (els.logoutBtn) els.logoutBtn.hidden = !isLoggedIn;
    if (els.loginBtn) els.loginBtn.hidden = isLoggedIn;
    if (els.email) els.email.disabled = isLoggedIn;
    if (els.pass) els.pass.disabled = isLoggedIn;
  }

  function renderTable(title, rows) {
    setText(els.tableTitle, title);
    setText(els.tableMeta, `Tổng: ${rows.length}`);

    if (!els.thead || !els.tbody) return;

    els.thead.innerHTML = '';
    els.tbody.innerHTML = '';

    if (!rows.length) {
      els.tbody.insertAdjacentHTML('beforeend', '<tr><td class="adminTd" colspan="99">(Không có dữ liệu)</td></tr>');
      return;
    }

    const cols = Object.keys(rows[0]);

    const trh = document.createElement('tr');
    cols.forEach((c) => {
      const th = document.createElement('th');
      th.className = 'adminTh';
      th.textContent = c;
      trh.appendChild(th);
    });
    els.thead.appendChild(trh);

    rows.forEach((r) => {
      const tr = document.createElement('tr');
      cols.forEach((c) => {
        const td = document.createElement('td');
        td.className = 'adminTd';
        const v = (r && c in r) ? r[c] : '';
        td.textContent = (v === null || v === undefined) ? '' : String(v);
        tr.appendChild(td);
      });
      els.tbody.appendChild(tr);
    });
  }

  function exportExcel(filename, rows) {
    if (!window.XLSX) {
      setText(els.authHint, 'Thiếu thư viện xuất Excel (XLSX).');
      return;
    }

    const data = (window.WeddingDB && window.WeddingDB.normalizeForExport)
      ? window.WeddingDB.normalizeForExport(rows)
      : rows;

    const ws = window.XLSX.utils.json_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'data');
    window.XLSX.writeFile(wb, filename);
  }

  function buildGuestLink(token, guestName, side) {
    const path = side === 'nhatrai'
      ? 'nhatrai/index.html'
      : side === 'nhagai'
        ? 'nhagai/index.html'
        : 'index.html';

    const u = new URL(path, location.href);
    u.searchParams.set('guest', guestName || '');
    u.searchParams.set('t', token);
    if (side) u.searchParams.set('side', side);
    return u.toString();
  }

  async function loadGuests() {
    if (!canUseDb()) {
      setText(els.authHint, 'Chưa cấu hình Firebase (firebase-config.js).');
      return;
    }

    try {
      setText(els.authHint, 'Đang tải danh sách khách…');
      const guests = await window.WeddingDB.listGuests();

      const raw = guests.map((g) => ({
        token: g.token || '',
        name: g.name || '',
        phone: g.phone || '',
        side: g.side || '',
        note: g.note || '',
        createdAt: g.createdAt || '',
        updatedAt: g.updatedAt || '',
      }));

      lastGuests = window.WeddingDB.normalizeForExport ? window.WeddingDB.normalizeForExport(raw) : raw;

      setText(els.authHint, '');
      renderTable('Khách mời (guests)', lastGuests);
    } catch (err) {
      const msg = err && err.message ? String(err.message) : 'Tải danh sách khách thất bại.';
      setText(els.authHint, msg);
    }
  }

  async function loadRsvps() {
    if (!canUseDb()) {
      setText(els.authHint, 'Chưa cấu hình Firebase (firebase-config.js).');
      return;
    }

    try {
      setText(els.authHint, 'Đang tải danh sách RSVP…');
      const rsvps = await window.WeddingDB.listRsvps();

      const raw = rsvps.map((r) => ({
        token: r.token || '',
        name: r.name || '',
        phone: r.phone || '',
        side: r.side || '',
        attend: r.attend || '',
        page: r.page || '',
        submittedAt: r.submittedAt || '',
        updatedAt: r.updatedAt || '',
      }));

      lastRsvps = window.WeddingDB.normalizeForExport ? window.WeddingDB.normalizeForExport(raw) : raw;

      setText(els.authHint, '');
      renderTable('RSVP (rsvps)', lastRsvps);
    } catch (err) {
      const msg = err && err.message ? String(err.message) : 'Tải danh sách RSVP thất bại.';
      setText(els.authHint, msg);
    }
  }

  function initAuth() {
    // Init DB first so firebase.initializeApp runs before firebase.auth()
    ensureFirebaseInited();

    if (!canUseDb()) {
      setText(els.status, 'Chưa cấu hình Firebase. Hãy điền firebase-config.js');
      setLoggedIn(false);
      return;
    }

    const auth = getAuth();
    if (!auth) {
      setText(els.status, 'Thiếu Firebase SDK.');
      setLoggedIn(false);
      return;
    }

    setText(els.status, 'Sẵn sàng. Vui lòng đăng nhập admin.');

    auth.onAuthStateChanged((user) => {
      if (user) {
        setLoggedIn(true);
        setText(els.status, `Đã đăng nhập: ${user.email || 'admin'}`);
        setText(els.authHint, '');
      } else {
        setLoggedIn(false);
        setText(els.status, 'Chưa đăng nhập.');
      }
    });

    if (els.loginForm) {
      els.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = String(els.email && els.email.value || '').trim();
        const pass = String(els.pass && els.pass.value || '').trim();
        if (!email || !pass) {
          setText(els.authHint, 'Vui lòng nhập email và mật khẩu.');
          return;
        }

        try {
          setText(els.authHint, 'Đang đăng nhập…');
          await auth.signInWithEmailAndPassword(email, pass);
        } catch (err) {
          const msg = err && err.message ? String(err.message) : 'Đăng nhập thất bại.';
          setText(els.authHint, msg);
        }
      });
    }

    if (els.logoutBtn) {
      els.logoutBtn.addEventListener('click', async () => {
        try {
          await auth.signOut();
        } catch (_) {
          // ignore
        }
      });
    }
  }

  function initActions() {
    if (els.btnLoadGuests) els.btnLoadGuests.addEventListener('click', () => loadGuests());
    if (els.btnLoadRsvps) els.btnLoadRsvps.addEventListener('click', () => loadRsvps());

    if (els.btnExportGuests) {
      els.btnExportGuests.addEventListener('click', () => exportExcel('guests.xlsx', lastGuests));
    }

    if (els.btnExportRsvps) {
      els.btnExportRsvps.addEventListener('click', () => exportExcel('rsvps.xlsx', lastRsvps));
    }

    if (els.guestCreateForm) {
      els.guestCreateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!canUseDb()) {
          setText(els.guestCreateHint, 'Chưa cấu hình Firebase.');
          return;
        }

        const name = String(els.guestCreateName && els.guestCreateName.value || '').trim();
        const phone = String(els.guestCreatePhone && els.guestCreatePhone.value || '').trim();
        const side = String(els.guestCreateSide && els.guestCreateSide.value || '').trim();

        if (!name) {
          setText(els.guestCreateHint, 'Vui lòng nhập tên khách.');
          return;
        }

        const btn = els.guestCreateBtn;
        if (btn) btn.disabled = true;

        try {
          setText(els.guestCreateHint, 'Đang tạo link…');

          const token = window.WeddingDB.randomToken(10);
          await window.WeddingDB.upsertGuest({ token, name, phone, side });

          const link = buildGuestLink(token, name, side);

          if (els.guestLinkOut) els.guestLinkOut.value = link;
          if (els.guestLinkRow) els.guestLinkRow.hidden = false;
          setText(els.guestCreateHint, 'Đã tạo link.');

          // Refresh guest list if currently showing it
          if (String(els.tableTitle && els.tableTitle.textContent || '').includes('guests')) {
            loadGuests();
          }
        } catch (err) {
          const msg = err && err.message ? String(err.message) : 'Tạo link thất bại.';
          setText(els.guestCreateHint, msg);
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }

    if (els.btnCopyGuestLink) {
      els.btnCopyGuestLink.addEventListener('click', async () => {
        const v = String(els.guestLinkOut && els.guestLinkOut.value || '').trim();
        if (!v) return;
        try {
          if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(v);
            setText(els.guestCreateHint, 'Đã copy link.');
          } else {
            els.guestLinkOut.select();
            document.execCommand('copy');
            setText(els.guestCreateHint, 'Đã copy link.');
          }
        } catch (_) {
          setText(els.guestCreateHint, 'Copy thất bại.');
        }
      });
    }
  }

  function init() {
    try {
      initAuth();
      initActions();
    } catch (err) {
      const msg = err && err.message ? String(err.message) : 'Có lỗi khi khởi tạo admin.';
      safeSetStatus('Lỗi: ' + msg);
      setLoggedIn(false);
    }
  }

  init();
})();
