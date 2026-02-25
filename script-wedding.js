// Premium wedding landing page script
// - Calendar + countdown
// - Optional banner slideshow via URL param
// - RSVP segmented UI (no backend)

(function () {
  'use strict';

  function markLoaded() {
    if (!document.body) return;
    document.body.classList.add('isLoaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markLoaded, { once: true });
  } else {
    markLoaded();
  }

  const qs = new URLSearchParams(location.search);

  function byId(id) {
    return document.getElementById(id);
  }

      function setText(el, value) {
        if (!el) return;
        el.textContent = value;
      }

      function normalizeAssetUrl(raw) {
        if (!raw) return '';
        const trimmed = String(raw).trim();
        if (!trimmed) return '';
        if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
        if (trimmed.startsWith('/')) return trimmed;

        const path = location.pathname || '/';
        const isSubpage = /\/nhatrai\/|\/nhagai\//i.test(path);
        if (isSubpage && !trimmed.startsWith('../')) return '../' + trimmed;
        return trimmed;
      }

      function readParam(...keys) {
        for (const k of keys) {
          if (qs.has(k)) return qs.get(k) || '';
        }
        return '';
      }

      function pad2(n) {
        return String(n).padStart(2, '0');
      }

      function parseWeddingDateFromText(raw) {
        if (!raw) return null;
        const s = String(raw).trim();
        if (!s) return null;

        // Prefer ISO-ish: YYYY.MM.DD or YYYY-MM-DD
        const m = s.match(/^(\d{4})[\.-](\d{1,2})[\.-](\d{1,2})$/);
        if (m) {
          const year = Number(m[1]);
          const month = Number(m[2]) - 1;
          const day = Number(m[3]);
          // Default time: 00:00 local
          return new Date(year, month, day, 0, 0, 0);
        }

        // Try Date.parse fallback
        const t = Date.parse(s);
        if (!Number.isNaN(t)) return new Date(t);
        return null;
      }

      function formatMonthYear(date) {
        return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      }

      function formatWeekday(date) {
        return date.toLocaleDateString(undefined, { weekday: 'long' });
      }

      function sameYmd(a, b) {
        if (!a || !b) return false;
        return (
          a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate()
        );
      }

      function addMonths(year, monthIndex, delta) {
        const d = new Date(year, monthIndex + delta, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
      }

      function mondayIndex(jsDayIndex) {
        // JS: 0=Sun..6=Sat -> Monday-first: 0=Mon..6=Sun
        return (jsDayIndex + 6) % 7;
      }

      function titleCaseVi(s) {
        const str = String(s || '').trim();
        if (!str) return '';
        return str
          .split(/\s+/)
          .map((w) => w ? (w[0].toUpperCase() + w.slice(1)) : w)
          .join(' ');
      }

      function tryCreateLunarFormatter() {
        try {
          // Vietnamese locale + Chinese lunar calendar (often yields Vietnamese can-chi year labels)
          return new Intl.DateTimeFormat('vi-VN-u-ca-chinese', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        } catch (_) {
          return null;
        }
      }

      const lunarFormatter = tryCreateLunarFormatter();

      function getLunarParts(date) {
        if (!lunarFormatter) return null;
        try {
          const parts = lunarFormatter.formatToParts(date);
          const out = { day: '', month: '', year: '' };
          for (const p of parts) {
            if (p.type === 'day') out.day = p.value;
            if (p.type === 'month') out.month = p.value;
            if (p.type === 'year') out.year = p.value;
          }
          if (!out.day || !out.month) return null;
          return out;
        } catch (_) {
          return null;
        }
      }

      function formatWhenLine(date) {
        const hh = pad2(date.getHours());
        const mm = pad2(date.getMinutes());
        const dd = pad2(date.getDate());
        const mo = pad2(date.getMonth() + 1);
        const yyyy = date.getFullYear();
        const dow = titleCaseVi(date.toLocaleDateString('vi-VN', { weekday: 'long' }));
        return `${hh}:${mm} ${dow}, Ngày ${dd}/${mo}/${yyyy}`;
      }

      function formatLunarLine(date) {
        const p = getLunarParts(date);
        if (!p) return '';
        const yearSuffix = p.year ? ` ${p.year}` : '';
        return `(Tức ngày ${p.day}/${p.month}${yearSuffix})`;
      }

      const els = {
        brideName: byId('brideName'),
        groomName: byId('groomName'),
        weddingDateText: byId('weddingDateText'),

        countdownTargetText: byId('countdownTargetText'),

        calTitle: byId('calTitle'),
        calPrev: byId('calPrev'),
        calNext: byId('calNext'),
        calGrid: byId('calGrid'),
        calWhenText: byId('calWhenText'),
        calLunarText: byId('calLunarText'),

        calDay: byId('calDay'),
        calMonth: byId('calMonth'),
        calWeekday: byId('calWeekday'),

        cdDays: byId('cdDays'),
        cdHours: byId('cdHours'),
        cdMinutes: byId('cdMinutes'),
        cdSeconds: byId('cdSeconds'),

        heroBannerImg: byId('heroBannerImg'),

        rsvpForm: byId('rsvpForm'),
        rsvpName: byId('rsvpName'),
        rsvpYes: byId('rsvpYes'),
        rsvpNo: byId('rsvpNo'),
        rsvpAttend: byId('rsvpAttend'),
        rsvpHint: byId('rsvpHint'),
      };

      function initNames() {
        const bride = readParam('bride', 'codau', 'bridename');
        const groom = readParam('groom', 'chure', 'groomname');
        if (bride) setText(els.brideName, bride);
        if (groom) setText(els.groomName, groom);
      }

      function initCalendarAndCountdown() {
        const rawDateParam = readParam('date', 'weddingdate', 'ngaycuoi');
        const rawFromDom = (els.countdownTargetText ? els.countdownTargetText.textContent : '') || (els.weddingDateText ? els.weddingDateText.textContent : '');
        const rawText = String(rawDateParam || rawFromDom || '').trim();

        const date =
          parseInviteDateTimeFromText(rawText) ||
          parseWeddingDateFromText(rawText);
        if (!date) return;

        if (els.calDay) setText(els.calDay, String(date.getDate()));
        if (els.calMonth) setText(els.calMonth, formatMonthYear(date));
        if (els.calWeekday) setText(els.calWeekday, formatWeekday(date));

        if (els.calWhenText) setText(els.calWhenText, formatWhenLine(date));
        if (els.calLunarText) {
          const lunarLine = formatLunarLine(date);
          if (lunarLine) setText(els.calLunarText, lunarLine);
        }

        // Calendar month grid (Monday-first)
        let viewYear = date.getFullYear();
        let viewMonth = date.getMonth();

        function renderMonth(year, monthIndex) {
          if (els.calTitle) setText(els.calTitle, `THÁNG ${monthIndex + 1} - ${year}`);
          if (!els.calGrid) return;

          els.calGrid.innerHTML = '';
          const first = new Date(year, monthIndex, 1);
          const startOffset = mondayIndex(first.getDay());
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

          for (let i = 0; i < startOffset; i++) {
            const empty = document.createElement('div');
            empty.className = 'calCell isEmpty';
            empty.setAttribute('aria-hidden', 'true');
            els.calGrid.appendChild(empty);
          }

          for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(year, monthIndex, day);
            const isWedding = sameYmd(cellDate, date);
            const cell = document.createElement('div');
            cell.className = 'calCell' + (isWedding ? ' isWedding' : '');
            cell.setAttribute('role', 'gridcell');

            const solar = document.createElement('div');
            solar.className = 'calSolar';
            solar.textContent = String(day);

            const lunar = document.createElement('div');
            lunar.className = 'calLunarDay';
            const lp = getLunarParts(cellDate);
            const lunarDay = lp && lp.day ? String(parseInt(lp.day, 10) || '') : '';
            lunar.textContent = lunarDay;

            cell.appendChild(solar);
            cell.appendChild(lunar);

            if (isWedding) {
              cell.setAttribute('aria-label', `Ngày cưới: ${formatWhenLine(date)}`);
              cell.insertAdjacentHTML(
                'beforeend',
                '<svg class="calHeart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.2-4.6-9.5-8.6C.7 9.2 2.4 6.5 5.4 6.1c1.7-.2 3.2.6 4.1 1.8.9-1.2 2.4-2 4.1-1.8 3 .4 4.7 3.1 2.9 6.3C19.2 16.4 12 21 12 21z"/></svg>'
              );
            }

            els.calGrid.appendChild(cell);
          }
        }

        function bindNav() {
          if (els.calPrev && !els.calPrev.__bound) {
            els.calPrev.__bound = true;
            els.calPrev.addEventListener('click', () => {
              const next = addMonths(viewYear, viewMonth, -1);
              viewYear = next.year;
              viewMonth = next.month;
              renderMonth(viewYear, viewMonth);
            });
          }
          if (els.calNext && !els.calNext.__bound) {
            els.calNext.__bound = true;
            els.calNext.addEventListener('click', () => {
              const next = addMonths(viewYear, viewMonth, 1);
              viewYear = next.year;
              viewMonth = next.month;
              renderMonth(viewYear, viewMonth);
            });
          }
        }

        renderMonth(viewYear, viewMonth);
        bindNav();

        function tick() {
          const now = new Date();
          const diffMs = Math.max(0, date.getTime() - now.getTime());
          const totalSeconds = Math.floor(diffMs / 1000);
          const days = Math.floor(totalSeconds / 86400);
          const hours = Math.floor((totalSeconds % 86400) / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          if (els.cdDays) setText(els.cdDays, pad2(days));
          if (els.cdHours) setText(els.cdHours, pad2(hours));
          if (els.cdMinutes) setText(els.cdMinutes, pad2(minutes));
          if (els.cdSeconds) setText(els.cdSeconds, pad2(seconds));
        }

        tick();
        setInterval(tick, 1000);
      }

      function initHeroBannerSlideshow() {
        if (!els.heroBannerImg) return;

        const rawList = readParam('banner', 'anhbanner', 'herobanner');
        if (!rawList) return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const urls = rawList
          .split(/[\n,|]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map(normalizeAssetUrl);

        const unique = [];
        const seen = new Set();
        for (const u of urls) {
          if (!u) continue;
          if (seen.has(u)) continue;
          seen.add(u);
          unique.push(u);
        }

        if (unique.length === 0) return;
        if (unique.length === 1 || prefersReduced) {
          els.heroBannerImg.src = unique[0];
          return;
        }

        // Lightweight slideshow, no fancy fade (CSS is minimal); just swap.
        let idx = 0;
        let alive = true;
        const timer = setInterval(() => {
          if (!alive) return;
          idx = (idx + 1) % unique.length;
          els.heroBannerImg.src = unique[idx];
        }, 3500);

        window.addEventListener('beforeunload', () => {
          alive = false;
          clearInterval(timer);
        });
      }

      function initRSVP() {
        if (!els.rsvpForm || !els.rsvpAttend || !els.rsvpYes || !els.rsvpNo) return;

        function setAttend(value) {
          els.rsvpAttend.value = value;
          els.rsvpYes.classList.toggle('isActive', value === 'yes');
          els.rsvpNo.classList.toggle('isActive', value === 'no');
          if (els.rsvpHint) setText(els.rsvpHint, '');
        }

        els.rsvpYes.addEventListener('click', () => setAttend('yes'));
        els.rsvpNo.addEventListener('click', () => setAttend('no'));

        const prefillName = readParam('guest', 'khach', 'ten');
        if (prefillName && els.rsvpName) els.rsvpName.value = prefillName;

        els.rsvpForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = (els.rsvpName && els.rsvpName.value || '').trim();
          const attend = (els.rsvpAttend.value || '').trim();

          if (!name) {
            if (els.rsvpHint) setText(els.rsvpHint, 'Please enter your name.');
            return;
          }
          if (!attend) {
            if (els.rsvpHint) setText(els.rsvpHint, 'Please select Yes or No.');
            return;
          }

          const message = attend === 'yes'
            ? `Thank you, ${name}. See you at the wedding!`
            : `Thank you, ${name}. We will miss you.`;
          if (els.rsvpHint) setText(els.rsvpHint, message);
        });
      }

      function initMenu() {
        const toggle = byId('menuToggle');
        const panel = byId('menuPanel');
        const backdrop = byId('menuBackdrop');
        if (!toggle || !panel || !backdrop) return;

        function isOpen() {
          return !panel.hidden;
        }

        function open() {
          panel.hidden = false;
          backdrop.hidden = false;
          toggle.setAttribute('aria-expanded', 'true');
        }

        function close() {
          panel.hidden = true;
          backdrop.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', () => {
          if (isOpen()) close();
          else open();
        });

        backdrop.addEventListener('click', close);

        panel.addEventListener('click', (e) => {
          const link = e.target && e.target.closest ? e.target.closest('a') : null;
          if (link) close();
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') close();
        });

        document.addEventListener('click', (e) => {
          if (!isOpen()) return;
          const t = e.target;
          if (panel.contains(t) || toggle.contains(t)) return;
          close();
        }, true);
      }

      function initSaveDateWordmark() {
        const blocks = document.querySelectorAll('.saveScript');
        if (!blocks || blocks.length === 0) return;

        blocks.forEach((block) => {
          const img = block.querySelector && block.querySelector('.saveScriptImg');
          if (!img) return;

          const src = img.getAttribute('src') || '';
          if (!src) return;

          const probe = new Image();
          probe.onload = () => {
            block.classList.add('hasImg');
          };
          probe.onerror = () => {
            // keep SVG fallback
          };
          probe.src = src;
        });
      }

      function parseInviteDateTimeFromText(raw) {
        if (!raw) return null;
        const s = String(raw).trim();
        if (!s) return null;

        // Expected: HH:MM • DD/MM/YYYY (also allow - or . separators)
        const m = s.match(/^(\d{1,2}):(\d{2})\s*[•\-|]\s*(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
        if (!m) return null;
        const hour = Number(m[1]);
        const minute = Number(m[2]);
        const day = Number(m[3]);
        const month = Number(m[4]) - 1;
        const year = Number(m[5]);
        const d = new Date(year, month, day, hour, minute, 0);
        if (Number.isNaN(d.getTime())) return null;
        return d;
      }

      function initInviteDateParts() {
        const whenTextEl = byId('mainWhenText');
        const timeEl = byId('mainWhenTime');
        const dowEl = byId('mainWhenDow');
        const dayEl = byId('mainWhenDay');
        const monthYearEl = byId('mainWhenMonthYear');
        if (!whenTextEl || (!timeEl && !dowEl && !dayEl && !monthYearEl)) return;

        const raw = (whenTextEl.textContent || '').trim();
        const d = parseInviteDateTimeFromText(raw);
        if (!d) return;

        const h = pad2(d.getHours());
        const mm = pad2(d.getMinutes());
        if (timeEl) setText(timeEl, `${h} GIỜ ${mm}`);

        if (dowEl) {
          const dow = d.toLocaleDateString('vi-VN', { weekday: 'long' });
          setText(dowEl, String(dow).toUpperCase());
        }
        if (dayEl) setText(dayEl, String(d.getDate()));
        if (monthYearEl) setText(monthYearEl, `${d.getMonth() + 1} - ${d.getFullYear()}`);
      }

      function initMusic() {
        const btn = byId('musicToggle');
        const audio = byId('bgm');
        if (!btn || !audio) return;

        const storageKey = 'wedding_bgm_enabled';
        let isEnabled = false;

        try {
          isEnabled = localStorage.getItem(storageKey) === '1';
        } catch (e) {
          isEnabled = false;
        }

        function setDisabled(label) {
          btn.hidden = false;
          btn.disabled = true;
          btn.classList.remove('isPlaying');
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', label);
          btn.title = label;
        }

        let src = (audio.getAttribute('src') || '').trim();
        if (!src) {
          const side = (document.body && document.body.getAttribute('data-side')) || '';
          src = side === 'root' ? 'images/Until%20You.mp3' : '../images/Until%20You.mp3';
          audio.setAttribute('src', src);
        }

        audio.loop = true;
        audio.preload = 'none';
        audio.volume = 0.75;
        audio.playsInline = true;

        function syncUI() {
          const isPlaying = !audio.paused && !audio.ended;
          btn.classList.toggle('isPlaying', isPlaying);
          btn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
          btn.setAttribute('aria-label', isPlaying ? 'Tắt nhạc' : 'Phát nhạc');
          btn.title = isPlaying ? 'Tắt nhạc' : 'Phát nhạc';
        }

        function setMissingState() {
          setDisabled('Chưa Có Nhạc');
        }

        async function start() {
          try {
            await audio.play();
            isEnabled = true;
            try { localStorage.setItem(storageKey, '1'); } catch (e) {}
          } catch (e) {
            isEnabled = false;
            try { localStorage.setItem(storageKey, '0'); } catch (e) {}
          }
          syncUI();
        }

        function stop() {
          audio.pause();
          isEnabled = false;
          try { localStorage.setItem(storageKey, '0'); } catch (e) {}
          syncUI();
        }

        btn.hidden = false;
        btn.disabled = false;
        syncUI();

        btn.addEventListener('click', () => {
          if (!audio.paused && !audio.ended) stop();
          else start();
        });

        audio.addEventListener('play', syncUI);
        audio.addEventListener('pause', syncUI);
        audio.addEventListener('ended', syncUI);
        audio.addEventListener('error', () => {
          setMissingState();
        });

        if (isEnabled) start();
      }

      function init() {
        initNames();
        initCalendarAndCountdown();
        initHeroBannerSlideshow();
        initInviteDateParts();
        initMusic();
        initRSVP();
        initMenu();
        initSaveDateWordmark();
      }

      init();
    })();
