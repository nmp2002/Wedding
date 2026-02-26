(function () {
  'use strict';

  const CFG = (window && window.__FIREBASE_CONFIG__) ? window.__FIREBASE_CONFIG__ : null;

  function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
  }

  function isConfigReady(cfg) {
    return !!(
      cfg &&
      isNonEmptyString(cfg.apiKey) &&
      isNonEmptyString(cfg.projectId) &&
      isNonEmptyString(cfg.appId)
    );
  }

  let inited = false;
  let db = null;

  function init() {
    if (inited) return !!db;
    inited = true;

    if (!isConfigReady(CFG)) return false;
    if (!window.firebase || typeof window.firebase.initializeApp !== 'function') return false;

    try {
      if (window.firebase.apps && window.firebase.apps.length) {
        window.firebase.app();
      } else {
        window.firebase.initializeApp(CFG);
      }

      if (typeof window.firebase.firestore !== 'function') return false;
      db = window.firebase.firestore();
      return !!db;
    } catch (_) {
      db = null;
      return false;
    }
  }

  function getDb() {
    if (!init()) throw new Error('Firebase not configured');
    return db;
  }

  function serverTimestamp() {
    return window.firebase.firestore.FieldValue.serverTimestamp();
  }

  function toPlainDate(v) {
    if (!v) return '';
    if (v && typeof v.toDate === 'function') {
      try { return v.toDate().toISOString(); } catch (_) { return ''; }
    }
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'string') return v;
    return '';
  }

  function randomToken(len) {
    const length = Number(len || 10);
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') {
      // Fallback (we still want a usable token even in older browsers)
      let out = '';
      for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
      return out;
    }

    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    let out = '';
    for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
  }

  async function upsertGuest(input) {
    const token = String(input && input.token || '').trim();
    if (!token) throw new Error('Missing token');

    const payload = {
      name: String(input && input.name || '').trim(),
      phone: String(input && input.phone || '').trim(),
      side: String(input && input.side || '').trim(),
      note: String(input && input.note || '').trim(),
      updatedAt: serverTimestamp(),
    };

    if (input && input.createdAt) payload.createdAt = input.createdAt;
    else payload.createdAt = serverTimestamp();

    await getDb().collection('guests').doc(token).set(payload, { merge: true });
    return token;
  }

  async function saveRsvp(input) {
    const token = String(input && input.token || '').trim();
    if (!token) throw new Error('Missing token');

    const payload = {
      token,
      name: String(input && input.name || '').trim(),
      phone: String(input && input.phone || '').trim(),
      side: String(input && input.side || '').trim(),
      attend: String(input && input.attend || '').trim(),
      page: String(input && input.page || '').trim(),
      ua: String(input && input.ua || '').trim(),
      updatedAt: serverTimestamp(),
      submittedAt: serverTimestamp(),
    };

    await getDb().collection('rsvps').doc(token).set(payload, { merge: true });
    return token;
  }

  async function listGuests() {
    const col = getDb().collection('guests');
    try {
      const snap = await col.orderBy('createdAt', 'desc').get();
      return snap.docs.map((d) => ({ token: d.id, ...d.data() }));
    } catch (_) {
      const snap = await col.get();
      return snap.docs.map((d) => ({ token: d.id, ...d.data() }));
    }
  }

  async function listRsvps() {
    const col = getDb().collection('rsvps');
    try {
      const snap = await col.orderBy('submittedAt', 'desc').get();
      return snap.docs.map((d) => ({ token: d.id, ...d.data() }));
    } catch (_) {
      const snap = await col.get();
      return snap.docs.map((d) => ({ token: d.id, ...d.data() }));
    }
  }

  function normalizeForExport(rows) {
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r) => {
      const o = { ...r };
      if ('createdAt' in o) o.createdAt = toPlainDate(o.createdAt);
      if ('updatedAt' in o) o.updatedAt = toPlainDate(o.updatedAt);
      if ('submittedAt' in o) o.submittedAt = toPlainDate(o.submittedAt);
      return o;
    });
  }

  window.WeddingDB = {
    init,
    isReady: () => init(),
    randomToken,
    upsertGuest,
    saveRsvp,
    listGuests,
    listRsvps,
    normalizeForExport,
  };
})();
