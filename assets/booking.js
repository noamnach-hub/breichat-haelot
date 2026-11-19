/* קביעת תור באתר (index.html#booking).
 * מביא מהשרת את סוגי הטיפול ואת השעות הפנויות, ושולח בקשה. אין כאן שום מפתח.
 * לבדיקה בלי שרת: לפתוח את האתר עם ?demo בסוף הכתובת, ואז הנתונים באים מ-assets/booking-sample.json. */
(function () {
  'use strict';
  var API = 'https://breichat-haelot-backend.onrender.com';
  var TZ = 'Asia/Jerusalem';
  var DEMO = /[?&]demo\b/.test(location.search);

  // הטקסטים של כרטיסי הטיפולים. המשך והמחיר מגיעים מההגדרות בשרת.
  var TREATMENT_TEXT = {
    solo: { tag: 'טיפול אישי', desc: 'טיפול אישי במים חמים. הגוף צף ונתמך, נע בתנועות איטיות ורכות, והצלילים ממלאים את החלל.' },
    couple: { tag: 'טיפול זוגי', desc: 'טיפול משותף שיוצר חיבור עמוק בין בני הזוג. הרפיה, מגע ותנועה יחד במים, עם צלילים מרפאים מול הנוף.' }
  };
  var ICON = {
    solo: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>',
    couple: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M19 15.2a5 5 0 0 1 3 4.6v1.2"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
  };
  var DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  var DAY_NAME = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
  var MONTH = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  var MONTH_SHORT = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

  var root = document.getElementById('booking');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // ── dates, always in Israel time ─────────────────────────────────
  function todayIL() { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function timeIL(iso) { return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso)); }
  function parts(day) { var p = day.split('-'); return { y: +p[0], m: +p[1], d: +p[2], wd: new Date(day + 'T12:00:00Z').getUTCDay() }; }
  function dayFull(day) { var p = parts(day); return DAY_NAME[p.wd] + ', ' + p.d + ' ב' + MONTH[p.m - 1]; }

  // ── data ────────────────────────────────────────────────────────
  var sample = null;
  function getSample() {
    if (!sample) sample = fetch('assets/booking-sample.json').then(function (r) { return r.json(); });
    return sample;
  }
  function getJSON(path) {
    return fetch(API + path).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || 'משהו השתבש');
        return d;
      });
    });
  }
  var data = {
    treatments: function () {
      return DEMO ? getSample().then(function (s) { return s.treatments; }) : getJSON('/api/public/treatments').then(function (d) { return d.treatments; });
    },
    slots: function (id) {
      return DEMO ? getSample().then(function (s) { return s.slots[id] || []; }) : getJSON('/api/public/slots?treatment=' + encodeURIComponent(id) + '&days=14').then(function (d) { return d.days; });
    },
    book: function (body) {
      if (DEMO) return new Promise(function (ok) { setTimeout(function () { ok({ ok: true }); }, 400); });
      return fetch(API + '/api/public/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) {
            if (!r.ok) { var e = new Error(d.error || 'משהו השתבש. אפשר לנסות שוב'); e.status = r.status; throw e; }
            return d;
          });
        });
    }
  };

  // ── state ───────────────────────────────────────────────────────
  var treatments = [];          // [{id, name, minutes, price, kind}]
  var slotsBy = {};             // treatmentId -> [{day, times:[iso]}]
  var state = { t: null, d: null, time: null };

  function kindOf(name) { return /זוג/.test(name) ? 'couple' : 'solo'; }
  function current() { return treatments.find(function (t) { return t.id === state.t; }) || null; }
  function daysNow() {
    if (state.t) return slotsBy[state.t] || [];
    // Before a treatment is picked, a day is open if any treatment has time on it.
    var lists = treatments.map(function (t) { return slotsBy[t.id] || []; }).filter(function (l) { return l.length; });
    if (!lists.length) return [];
    return lists[0].map(function (d, i) {
      var times = [];
      lists.forEach(function (l) { if (l[i]) times = times.concat(l[i].times); });
      return { day: d.day, times: times };
    });
  }
  function timesFor(day) { var d = daysNow().find(function (x) { return x.day === day; }); return d ? d.times : []; }

  // ── render ──────────────────────────────────────────────────────
  function renderTreatments() {
    $('bkTreatments').innerHTML = treatments.map(function (t) {
      var txt = TREATMENT_TEXT[t.kind];
      return '<button type="button" class="bk-treat" data-id="' + esc(t.id) + '" aria-pressed="' + (t.id === state.t) + '">' +
        '<span class="bk-treat-top"><span class="bk-treat-tag"><span class="bk-treat-ico">' + ICON[t.kind] + '</span>' + esc(txt.tag) + '</span>' +
        '<span class="bk-check">' + ICON.check + '</span></span>' +
        '<span class="bk-treat-title">' + esc(t.name) + '</span>' +
        '<span class="bk-treat-desc">' + esc(txt.desc) + '</span>' +
        '<span class="bk-chips">' + (t.minutes ? '<span class="bk-chip">' + t.minutes + ' דקות</span>' : '') +
        (t.price ? '<span class="bk-chip">' + Number(t.price).toLocaleString('he-IL') + ' ₪</span>' : '') + '</span>' +
        '</button>';
    }).join('') || '<p class="bk-hint">אין כרגע טיפולים לקביעה באתר.</p>';
  }

  function renderDays() {
    var days = daysNow();
    var today = todayIL();
    if (days.length) {
      var a = parts(days[0].day), b = parts(days[days.length - 1].day);
      $('bkMonths').textContent = (a.m === b.m ? MONTH[a.m - 1] : MONTH[a.m - 1] + '–' + MONTH[b.m - 1]) + ' ' + b.y;
    }
    $('bkDays').innerHTML = days.map(function (d) {
      var p = parts(d.day);
      var off = !d.times.length;
      return '<button type="button" class="bk-day" data-day="' + d.day + '" aria-pressed="' + (d.day === state.d) + '"' +
        (off ? ' disabled' : '') + ' aria-label="' + esc(dayFull(d.day) + (off ? ', אין שעות פנויות' : '')) + '">' +
        '<span class="dow">' + DOW[p.wd] + '</span><span class="num">' + p.d + '</span><span class="mon">' + (d.day === today ? 'היום' : MONTH_SHORT[p.m - 1]) + '</span></button>';
    }).join('');
  }

  function renderTimes() {
    var times = state.d ? timesFor(state.d) : [];
    $('bkNoDay').hidden = !!state.d;
    $('bkTimesWrap').hidden = !state.d;
    if (!state.d) return;
    $('bkDayFull').textContent = dayFull(state.d);
    $('bkSlotText').textContent = times.length === 1 ? 'שעה פנויה אחת' : times.length + ' שעות פנויות';
    $('bkTimes').innerHTML = times.map(function (iso) {
      return '<button type="button" class="bk-time" data-t="' + iso + '" aria-pressed="' + (iso === state.time) + '">' + timeIL(iso) + '</button>';
    }).join('');
  }

  function renderSummary() {
    var t = current();
    var ready = !!(t && state.d && state.time);
    [['1', !!t], ['2', !!state.d], ['3', !!state.time]].forEach(function (s) {
      var el = root.querySelector('.bk-num[data-step="' + s[0] + '"]');
      if (el) el.classList.toggle('is-done', s[1]);
    });
    $('bkPickT').textContent = t ? t.name : 'עוד לא נבחר';
    $('bkPickD').textContent = state.d ? dayFull(state.d) : 'עוד לא נבחר';
    $('bkPickH').textContent = state.time ? timeIL(state.time) : 'עוד לא נבחרה';
    $('bkSummary').hidden = !ready;
    $('bkSummary').textContent = ready ? t.name + ' · ' + dayFull(state.d) + ' · ' + timeIL(state.time) : '';
    $('bkSend').disabled = !ready;
  }

  function renderAll() { renderTreatments(); renderDays(); renderTimes(); renderSummary(); }

  // ── interactions ────────────────────────────────────────────────
  $('bkTreatments').addEventListener('click', function (e) {
    var b = e.target.closest('.bk-treat'); if (!b) return;
    state.t = b.dataset.id;
    var load = slotsBy[state.t] ? Promise.resolve() : data.slots(state.t).then(function (d) { slotsBy[state.t] = d; });
    load.then(function () {
      // Keep the chosen day and time only if they still fit this treatment.
      if (state.d && !timesFor(state.d).length) state.d = null;
      if (state.time && timesFor(state.d).indexOf(state.time) < 0) state.time = null;
      renderAll();
    }).catch(showLoadError);
  });

  $('bkDays').addEventListener('click', function (e) {
    var b = e.target.closest('.bk-day'); if (!b || b.disabled) return;
    state.d = b.dataset.day; state.time = null;
    renderDays(); renderTimes(); renderSummary();
  });

  $('bkTimes').addEventListener('click', function (e) {
    var b = e.target.closest('.bk-time'); if (!b) return;
    state.time = b.dataset.t;
    renderTimes(); renderSummary();
  });

  function showError(msg) { var el = $('bkError'); el.textContent = msg; el.hidden = !msg; }
  function showLoadError(e) { $('bkDays').innerHTML = '<p class="bk-hint">' + esc(e.message || 'אי אפשר לבדוק זמינות כרגע. אפשר לכתוב ליהל בוואטסאפ.') + '</p>'; }

  function field(name) { return $('bkFields').elements[name]; }
  function invalid(input, bad) { input.setAttribute('aria-invalid', bad ? 'true' : 'false'); return bad; }

  $('bkSend').addEventListener('click', function () {
    var t = current(); if (!t || !state.d || !state.time) return;
    var name = field('name').value.trim(), phone = field('phone').value.trim(), email = field('email').value.trim();
    var bad = [
      invalid(field('name'), name.length < 2) && 'צריך שם מלא',
      invalid(field('phone'), phone.replace(/\D/g, '').length < 9) && 'מספר הטלפון לא נראה תקין',
      invalid(field('email'), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && 'כתובת המייל לא נראית תקינה'
    ].filter(Boolean);
    if (bad.length) { showError(bad[0]); return; }
    showError('');
    var btn = $('bkSend'); btn.disabled = true; btn.textContent = 'שולחת…';
    data.book({
      treatmentId: t.id, start: state.time, name: name, phone: phone, email: email,
      note: field('note').value.trim(), website: field('website').value
    }).then(function () {
      var when = dayFull(state.d), hour = timeIL(state.time);
      $('bkDoneT').textContent = t.name; $('bkDoneD').textContent = when; $('bkDoneH').textContent = hour;
      $('bkDoneLine').textContent = t.name + ' · ' + when + ' · ' + hour;
      $('bkForm').hidden = true; $('bkDone').hidden = false;
      $('bkDone').focus({ preventScroll: true });
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function (e) {
      showError(e.message);
      if (e.status === 409) {
        // The time was taken meanwhile: refresh the free times.
        delete slotsBy[t.id]; state.time = null;
        data.slots(t.id).then(function (d) { slotsBy[t.id] = d; if (state.d && !timesFor(state.d).length) state.d = null; renderAll(); });
      }
    }).then(function () { btn.textContent = 'שליחת בקשה לתור'; renderSummary(); });
  });

  $('bkAgain').addEventListener('click', function () {
    state = { t: null, d: null, time: null };
    $('bkFields').reset(); showError('');
    $('bkDone').hidden = true; $('bkForm').hidden = false;
    renderAll();
  });

  // ── start ───────────────────────────────────────────────────────
  data.treatments().then(function (list) {
    treatments = list.map(function (t) { return { id: t.id, name: t.name, minutes: t.minutes, price: t.price, kind: kindOf(t.name) }; });
    renderTreatments();
    return Promise.all(treatments.map(function (t) { return data.slots(t.id).then(function (d) { slotsBy[t.id] = d; }); }));
  }).then(renderAll).catch(function (e) {
    $('bkTreatments').innerHTML = '<p class="bk-hint">' + esc(e.message) + '. אפשר לכתוב ליהל בוואטסאפ.</p>';
  });
})();
