/* קביעת תור: מביא טיפולים ושעות פנויות מהשרת ושולח בקשה. אין כאן מפתחות. */
'use strict';
const API = 'https://breichat-haelot-backend.onrender.com';
const TZ = 'Asia/Jerusalem';
const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const DAYS_LONG = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const timeIL = (iso) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const wd = (day) => new Date(day + 'T12:00:00Z').getUTCDay();
const dm = (day) => { const [, m, d] = day.split('-'); return `${+d}.${+m}`; };

let treatment = null; let days = []; let day = null; let start = null;

async function get(path) {
  const r = await fetch(API + path);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'משהו השתבש');
  return d;
}

async function loadTreatments() {
  try {
    const { treatments } = await get('/api/public/treatments');
    $('#treatments').innerHTML = treatments.map((t) => `
      <button type="button" class="choice" data-id="${t.id}" data-name="${esc(t.name)}" aria-pressed="false">
        <span><b>${esc(t.name)}</b><small>${t.minutes} דקות</small></span>
        ${t.price ? `<small>${Number(t.price).toLocaleString('he-IL')} ₪</small>` : ''}
      </button>`).join('') || '<p class="note">אין כרגע טיפולים לקביעה באתר.</p>';
  } catch (e) {
    $('#treatments').innerHTML = `<p class="err">${esc(e.message)}</p>`;
  }
}

$('#treatments').addEventListener('click', (e) => {
  const b = e.target.closest('.choice'); if (!b) return;
  document.querySelectorAll('.choice').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  treatment = { id: b.dataset.id, name: b.dataset.name };
  loadSlots();
});

async function loadSlots() {
  $('#stepDay').hidden = false; $('#stepTime').hidden = true; $('#stepForm').hidden = true;
  $('#days').innerHTML = ''; $('#daysNote').textContent = 'בודקים שעות פנויות…';
  start = null;
  try {
    days = (await get(`/api/public/slots?treatment=${encodeURIComponent(treatment.id)}`)).days;
    const anyFree = days.some((d) => d.times.length);
    $('#days').innerHTML = days.map((d) => `
      <button type="button" role="option" data-day="${d.day}" ${d.times.length ? '' : 'disabled'} aria-selected="false">
        <small>${DAYS[wd(d.day)]}</small><b>${dm(d.day).split('.')[0]}</b><small>${dm(d.day)}</small>
      </button>`).join('');
    $('#daysNote').textContent = anyFree ? '' : 'אין כרגע שעות פנויות בימים הקרובים. אפשר לכתוב ליהל בוואטסאפ.';
    const first = days.find((d) => d.times.length);
    if (first) pickDay(first.day);
    $('#stepDay').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    $('#daysNote').textContent = e.message;
  }
}

$('#days').addEventListener('click', (e) => { const b = e.target.closest('button[data-day]'); if (b && !b.disabled) pickDay(b.dataset.day); });

function pickDay(d) {
  day = d; start = null;
  document.querySelectorAll('#days button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.day === d)));
  const times = days.find((x) => x.day === d)?.times || [];
  $('#times').innerHTML = times.map((t) => `<button type="button" data-t="${t}" aria-pressed="false">${timeIL(t)}</button>`).join('');
  $('#stepTime').hidden = false; $('#stepForm').hidden = true;
}

$('#times').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-t]'); if (!b) return;
  start = b.dataset.t;
  document.querySelectorAll('#times button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $('#summary').textContent = `${treatment.name} · יום ${DAYS_LONG[wd(day)]} ${dm(day)} · ${timeIL(start)}`;
  $('#stepForm').hidden = false;
  $('#stepForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = Object.fromEntries(f.entries());
  if (String(body.name).trim().length < 2) return showErr('צריך שם');
  if (String(body.phone).replace(/\D/g, '').length < 9) return showErr('מספר הטלפון לא נראה תקין');
  showErr('');
  const btn = $('#send'); btn.disabled = true; btn.textContent = 'שולחים…';
  try {
    const r = await fetch(API + '/api/public/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, treatmentId: treatment.id, start }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      showErr(d.error || 'משהו השתבש. נסו שוב');
      if (r.status === 409) loadSlots();
      return;
    }
    ['#stepTreat', '#stepDay', '#stepTime', '#stepForm'].forEach((s) => { $(s).hidden = true; });
    $('#doneText').textContent = `${treatment.name}, יום ${DAYS_LONG[wd(day)]} ${dm(day)} בשעה ${timeIL(start)}.`;
    $('#done').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    showErr('אין חיבור כרגע. נסו שוב בעוד רגע');
  } finally { btn.disabled = false; btn.textContent = 'שליחת הבקשה'; }
});

function showErr(m) { $('#formErr').textContent = m; }

loadTreatments();
