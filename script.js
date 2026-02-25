/* Legacy file disabled (replaced by script-wedding.js)
(() => {
  const els = {
    // Guest/invite note
    inputTo: document.getElementById('inputTo'),
    inputFrom: document.getElementById('inputFrom'),
    inputMsg: document.getElementById('inputMsg'),
    btnPreset: document.getElementById('btnPreset'),
    btnReset: document.getElementById('btnReset'),
    toName: document.getElementById('toName'),
    fromName: document.getElementById('fromName'),
    msgText: document.getElementById('msgText'),

    // Couple
    inputGroomName: document.getElementById('inputGroomName'),
    inputBrideName: document.getElementById('inputBrideName'),
    inputGroomParents: document.getElementById('inputGroomParents'),
    inputBrideParents: document.getElementById('inputBrideParents'),
    inputGroomAddress: document.getElementById('inputGroomAddress'),
    inputBrideAddress: document.getElementById('inputBrideAddress'),
    groomName: document.getElementById('groomName'),
    brideName: document.getElementById('brideName'),
    groomParents: document.getElementById('groomParents'),
    brideParents: document.getElementById('brideParents'),
    groomAddress: document.getElementById('groomAddress'),
    brideAddress: document.getElementById('brideAddress'),

    // Avatars
    inputGroomPhoto: document.getElementById('inputGroomPhoto'),
    inputBridePhoto: document.getElementById('inputBridePhoto'),
    groomPhoto: document.getElementById('groomPhoto'),
    bridePhoto: document.getElementById('bridePhoto'),
    groomPhotoHint: document.getElementById('groomPhotoHint'),
    bridePhotoHint: document.getElementById('bridePhotoHint'),

    // Ceremony details
    inputDate: document.getElementById('inputDate'),
    inputTime: document.getElementById('inputTime'),
    inputVenue: document.getElementById('inputVenue'),
    inputAddress: document.getElementById('inputAddress'),
    inputMap: document.getElementById('inputMap'),
    badgeDate: document.getElementById('badgeDate'),
    eventType: document.getElementById('eventType'),
    eventDate: document.getElementById('eventDate'),
    eventTime: document.getElementById('eventTime'),
    eventVenue: document.getElementById('eventVenue'),
    eventAddress: document.getElementById('eventAddress'),
    mapLink: document.getElementById('mapLink'),

    // Effects
    snow: document.getElementById('snow'),
  };

  const presets = [
    'Chúng tôi xin trân trọng mời bạn tham dự lễ cưới của chúng tôi. Sự hiện diện của bạn sẽ làm cho ngày trọng đại này thêm phần ý nghĩa. Chúng tôi mong được đón tiếp bạn và chia sẻ những khoảnh khắc đặc biệt.',
    'Hôn nhân là sự kết hợp tuyệt vời. Chúng tôi mong bạn có thể chia sẻ niềm vui này cùng chúng tôi trong ngày cưới. Hân hạnh chào đón bạn!',
    'Với tình yêu và trái tim rộng mở, chúng tôi mời bạn đến dự lễ cưới của chúng tôi. Chúng tôi không thể tưởng tượng thế nào nếu thiếu bạn trong buổi lễ trọng đại này. Cảm ơn bạn rất nhiều!',
  ];

  function setTextSafe(targetEl, value, fallback) {
    if (!targetEl) return;
    const v = (value ?? '').trim();
    targetEl.textContent = v.length ? v : fallback;
  }

  function readParam(params, ...keys) {
    for (const key of keys) {
      const v = params.get(key);
      if (v != null && String(v).trim().length) return String(v);
    }
    return '';
  }

  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);

    const to = readParam(params, 'khachmoi', 'to');
    const couple = readParam(params, 'couple', 'capdoi', 'from');
    const msg = readParam(params, 'loimoi', 'message', 'msg');

    const date = readParam(params, 'ngay', 'date');
    const time = readParam(params, 'gio', 'time');
    const venue = readParam(params, 'diadiem', 'venue');
    const address = readParam(params, 'diachi', 'address');
    const map = readParam(params, 'map', 'maps', 'maplink');

    const groomName = readParam(params, 'chure', 'groom', 'tenchure');
    const brideName = readParam(params, 'codau', 'bride', 'tencodau');
    const groomParents = readParam(params, 'bochure', 'parentsgroom', 'groomparents', 'parents_chure');
    const brideParents = readParam(params, 'bocodau', 'parentsbride', 'brideparents', 'parents_codau');
    const groomAddress = readParam(params, 'diachinhatrai', 'groomaddress', 'addr_groom');
    const brideAddress = readParam(params, 'diachinhagai', 'brideaddress', 'addr_bride');

    if (els.inputTo && to) els.inputTo.value = to;
    if (els.inputFrom && couple) els.inputFrom.value = couple;
    if (els.inputMsg && msg) els.inputMsg.value = msg;

    if (els.inputDate && date) els.inputDate.value = date;
    if (els.inputTime && time) els.inputTime.value = time;
    if (els.inputVenue && venue) els.inputVenue.value = venue;
    if (els.inputAddress && address) els.inputAddress.value = address;
    if (els.inputMap && map) els.inputMap.value = map;

    if (els.inputGroomName && groomName) els.inputGroomName.value = groomName;
    if (els.inputBrideName && brideName) els.inputBrideName.value = brideName;
    if (els.inputGroomParents && groomParents) els.inputGroomParents.value = groomParents;
    if (els.inputBrideParents && brideParents) els.inputBrideParents.value = brideParents;
    if (els.inputGroomAddress && groomAddress) els.inputGroomAddress.value = groomAddress;
    if (els.inputBrideAddress && brideAddress) els.inputBrideAddress.value = brideAddress;
  }

  function resolveDefaults() {
    const side = (document.body && document.body.dataset && document.body.dataset.side) || '';
    const isNhaTrai = side === 'nhatrai';
    const isNhaGai = side === 'nhagai';

    const defaultTo = 'bạn';
    const defaultFrom = 'Cô dâu & Chú rể';
    const defaultMsg =
      'Chúng tôi xin trân trọng mời bạn tham dự lễ cưới của chúng tôi. Sự hiện diện của bạn sẽ làm cho ngày trọng đại này thêm phần ý nghĩa.';

    const defaultType = isNhaTrai ? 'Lễ Thành Hôn' : isNhaGai ? 'Lễ Vu Quy' : 'Lễ Cưới';

    const currentDate =
      (els.inputDate && els.inputDate.value.trim()) ||
      (els.eventDate && els.eventDate.textContent.trim()) ||
      (els.badgeDate && els.badgeDate.textContent.trim()) ||
      '22/02/2026';

    const currentTime =
      (els.inputTime && els.inputTime.value.trim()) ||
      (els.eventTime && els.eventTime.textContent.trim()) ||
      (isNhaTrai ? '18:00' : isNhaGai ? '10:00' : '');

    const currentVenue = (els.inputVenue && els.inputVenue.value.trim()) || (els.eventVenue && els.eventVenue.textContent.trim()) || '';
    const currentAddress =
      (els.inputAddress && els.inputAddress.value.trim()) || (els.eventAddress && els.eventAddress.textContent.trim()) || '';

    const currentMap = (els.inputMap && els.inputMap.value.trim()) || (els.mapLink && els.mapLink.getAttribute('href')) || '';

    return {
      defaultTo,
      defaultFrom,
      defaultMsg,
      defaultType,
      currentDate,
      currentTime,
      currentVenue,
      currentAddress,
      currentMap,
    };
  }

  function bindText() {
    const defaults = resolveDefaults();

    if (els.inputMsg && els.msgText && !els.inputMsg.value.trim()) {
      els.inputMsg.value = els.msgText.textContent.trim() || defaults.defaultMsg;
    }
    if (els.inputDate && !els.inputDate.value.trim()) els.inputDate.value = defaults.currentDate;
    if (els.inputTime && !els.inputTime.value.trim()) els.inputTime.value = defaults.currentTime;

    const update = () => {
      if (els.toName && els.inputTo) setTextSafe(els.toName, els.inputTo.value, defaults.defaultTo);
      if (els.fromName && els.inputFrom) setTextSafe(els.fromName, els.inputFrom.value, defaults.defaultFrom);

      if (els.eventType) setTextSafe(els.eventType, defaults.defaultType, defaults.defaultType);
      if (els.eventDate && els.inputDate) setTextSafe(els.eventDate, els.inputDate.value, defaults.currentDate);
      if (els.eventTime && els.inputTime) setTextSafe(els.eventTime, els.inputTime.value, defaults.currentTime);
      if (els.eventVenue && els.inputVenue) setTextSafe(els.eventVenue, els.inputVenue.value, '');
      if (els.eventAddress && els.inputAddress) setTextSafe(els.eventAddress, els.inputAddress.value, '');
      if (els.badgeDate && els.inputDate) setTextSafe(els.badgeDate, els.inputDate.value, defaults.currentDate);

      if (els.msgText && els.inputMsg) {
        const msg = (els.inputMsg.value ?? '').trim();
        els.msgText.textContent = msg.length ? msg : defaults.defaultMsg;
      }

      if (els.mapLink && els.inputMap) {
        const mapUrl = (els.inputMap.value ?? '').trim();
        if (mapUrl.length) {
          els.mapLink.href = mapUrl;
          els.mapLink.style.display = 'inline-flex';
        } else {
          els.mapLink.removeAttribute('href');
          els.mapLink.style.display = 'none';
        }
      }
    };

    if (els.inputTo) els.inputTo.addEventListener('input', update);
    if (els.inputFrom) els.inputFrom.addEventListener('input', update);
    if (els.inputMsg) els.inputMsg.addEventListener('input', update);
    if (els.inputDate) els.inputDate.addEventListener('input', update);
    if (els.inputTime) els.inputTime.addEventListener('input', update);
    if (els.inputVenue) els.inputVenue.addEventListener('input', update);
    if (els.inputAddress) els.inputAddress.addEventListener('input', update);
    if (els.inputMap) els.inputMap.addEventListener('input', update);

    if (els.btnPreset && els.inputMsg) {
      els.btnPreset.addEventListener('click', () => {
        const pick = presets[Math.floor(Math.random() * presets.length)];
        els.inputMsg.value = pick;
        els.inputMsg.dispatchEvent(new Event('input'));
      });
    }

    if (els.btnReset) {
      els.btnReset.addEventListener('click', () => {
        if (els.inputTo) {
          els.inputTo.value = '';
          els.inputTo.dispatchEvent(new Event('input'));
        }
        if (els.inputFrom) {
          els.inputFrom.value = '';
          els.inputFrom.dispatchEvent(new Event('input'));
        }
        if (els.inputMsg) {
          els.inputMsg.value = presets[0];
          els.inputMsg.dispatchEvent(new Event('input'));
        }

        if (els.inputDate) {
          els.inputDate.value = defaults.currentDate;
          els.inputDate.dispatchEvent(new Event('input'));
        }
        if (els.inputTime) {
          els.inputTime.value = defaults.currentTime;
          els.inputTime.dispatchEvent(new Event('input'));
        }
        if (els.inputVenue) {
          els.inputVenue.value = '';
          els.inputVenue.dispatchEvent(new Event('input'));
        }
        if (els.inputAddress) {
          els.inputAddress.value = '';
          els.inputAddress.dispatchEvent(new Event('input'));
        }
        if (els.inputMap) {
          els.inputMap.value = '';
          els.inputMap.dispatchEvent(new Event('input'));
        }

        if (els.inputGroomName) {
          els.inputGroomName.value = '';
          els.inputGroomName.dispatchEvent(new Event('input'));
        }
        if (els.inputBrideName) {
          els.inputBrideName.value = '';
          els.inputBrideName.dispatchEvent(new Event('input'));
        }
        if (els.inputGroomParents) {
          els.inputGroomParents.value = '';
          els.inputGroomParents.dispatchEvent(new Event('input'));
        }
        if (els.inputBrideParents) {
          els.inputBrideParents.value = '';
          els.inputBrideParents.dispatchEvent(new Event('input'));
        }
        if (els.inputGroomAddress) {
          els.inputGroomAddress.value = '';
          els.inputGroomAddress.dispatchEvent(new Event('input'));
        }
        if (els.inputBrideAddress) {
          els.inputBrideAddress.value = '';
          els.inputBrideAddress.dispatchEvent(new Event('input'));
        }

        if (els.groomPhoto) els.groomPhoto.removeAttribute('src');
        if (els.bridePhoto) els.bridePhoto.removeAttribute('src');
        if (els.groomPhotoHint) els.groomPhotoHint.style.display = 'flex';
        if (els.bridePhotoHint) els.bridePhotoHint.style.display = 'flex';
        if (els.inputGroomPhoto) els.inputGroomPhoto.value = '';
        if (els.inputBridePhoto) els.inputBridePhoto.value = '';
      });
    }

    update();
  }

  function bindCouple() {
    const any =
      els.inputGroomName ||
      els.inputBrideName ||
      els.inputGroomParents ||
      els.inputBrideParents ||
      els.inputGroomAddress ||
      els.inputBrideAddress;
    if (!any) return;

    const defaults = {
      groomName: (els.groomName && els.groomName.textContent) || 'Chú rể',
      brideName: (els.brideName && els.brideName.textContent) || 'Cô dâu',
      groomParents: (els.groomParents && els.groomParents.textContent) || '',
      brideParents: (els.brideParents && els.brideParents.textContent) || '',
      groomAddress: (els.groomAddress && els.groomAddress.textContent) || '',
      brideAddress: (els.brideAddress && els.brideAddress.textContent) || '',
    };

    if (els.inputGroomName && !els.inputGroomName.value.trim()) els.inputGroomName.value = defaults.groomName;
    if (els.inputBrideName && !els.inputBrideName.value.trim()) els.inputBrideName.value = defaults.brideName;
    if (els.inputGroomParents && !els.inputGroomParents.value.trim()) els.inputGroomParents.value = defaults.groomParents;
    if (els.inputBrideParents && !els.inputBrideParents.value.trim()) els.inputBrideParents.value = defaults.brideParents;
    if (els.inputGroomAddress && !els.inputGroomAddress.value.trim()) els.inputGroomAddress.value = defaults.groomAddress;
    if (els.inputBrideAddress && !els.inputBrideAddress.value.trim()) els.inputBrideAddress.value = defaults.brideAddress;

    const update = () => {
      if (els.groomName && els.inputGroomName) setTextSafe(els.groomName, els.inputGroomName.value, defaults.groomName);
      if (els.brideName && els.inputBrideName) setTextSafe(els.brideName, els.inputBrideName.value, defaults.brideName);
      if (els.groomParents && els.inputGroomParents) setTextSafe(els.groomParents, els.inputGroomParents.value, defaults.groomParents);
      if (els.brideParents && els.inputBrideParents) setTextSafe(els.brideParents, els.inputBrideParents.value, defaults.brideParents);
      if (els.groomAddress && els.inputGroomAddress) setTextSafe(els.groomAddress, els.inputGroomAddress.value, defaults.groomAddress);
      if (els.brideAddress && els.inputBrideAddress) setTextSafe(els.brideAddress, els.inputBrideAddress.value, defaults.brideAddress);
    };

    if (els.inputGroomName) els.inputGroomName.addEventListener('input', update);
    if (els.inputBrideName) els.inputBrideName.addEventListener('input', update);
    if (els.inputGroomParents) els.inputGroomParents.addEventListener('input', update);
    if (els.inputBrideParents) els.inputBrideParents.addEventListener('input', update);
    if (els.inputGroomAddress) els.inputGroomAddress.addEventListener('input', update);
    if (els.inputBrideAddress) els.inputBrideAddress.addEventListener('input', update);

    update();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  function bindAvatarPhotos() {
    const setup = (inputEl, imgEl, hintEl) => {
      if (!inputEl || !imgEl) return;
      inputEl.addEventListener('change', async () => {
        const file = Array.from(inputEl.files || []).find((f) => f.type.startsWith('image/'));
        if (!file) {
          imgEl.removeAttribute('src');
          if (hintEl) hintEl.style.display = 'flex';
          return;
        }
        const url = await readFileAsDataUrl(file);
        imgEl.src = url;
        if (hintEl) hintEl.style.display = 'none';
      });
    };

    setup(els.inputGroomPhoto, els.groomPhoto, els.groomPhotoHint);
    setup(els.inputBridePhoto, els.bridePhoto, els.bridePhotoHint);
  }

  function initSnow() {
    const canvas = els.snow;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = {
      w: 0,
      h: 0,
      dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
      flakes: [],
      last: performance.now(),
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      state.w = Math.floor(rect.width);
      state.h = Math.floor(rect.height);
      canvas.width = Math.floor(state.w * state.dpr);
      canvas.height = Math.floor(state.h * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

      const targetCount = Math.min(140, Math.max(70, Math.floor(state.w / 8)));
      state.flakes = Array.from({ length: targetCount }, () => makeFlake(true));
    }

    function makeFlake(randomY) {
      const size = 0.8 + Math.random() * 2.6;
      return {
        x: Math.random() * state.w,
        y: randomY ? Math.random() * state.h : -10 - Math.random() * 40,
        r: size,
        v: 14 + Math.random() * 28,
        drift: -10 + Math.random() * 20,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.55,
      };
    }

    function step(now) {
      const dt = Math.min(0.033, (now - state.last) / 1000);
      state.last = now;

      ctx.clearRect(0, 0, state.w, state.h);
      ctx.fillStyle = 'rgba(255,255,255,1)';

      for (const f of state.flakes) {
        f.phase += dt * 1.6;
        f.x += (f.drift + Math.sin(f.phase) * 12) * dt;
        f.y += f.v * dt;

        if (f.y > state.h + 20) Object.assign(f, makeFlake(false));
        if (f.x < -30) f.x = state.w + 30;
        if (f.x > state.w + 30) f.x = -30;

        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(step);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    resize();
    requestAnimationFrame(step);
  }

  applyUrlParams();
  bindText();
  bindCouple();
  bindAvatarPhotos();
  initSnow();
})();
*/
