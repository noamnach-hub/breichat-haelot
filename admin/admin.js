/* מרחב הניהול של בריכת האלות (g-pool.me/admin).
 * עיצוב: design-handoff/screens/admin. הכול כאן JavaScript רגיל, בלי ספריות.
 * הנתונים מגיעים מהשרת breichat-haelot-backend. עם ?demo בכתובת, הם מגיעים מ-sample.json
 * (בלי שרת ובלי לשנות שום דבר אמיתי). בדף הזה אין מפתחות: הקוד נבדק רק בשרת. */
'use strict';

const API = 'https://breichat-haelot-backend.onrender.com';
const TZ = 'Asia/Jerusalem';
const DEMO = /[?&]demo\b/.test(location.search);
const TOKEN_KEY = DEMO ? 'gpool_admin_demo' : 'gpool_admin_token';
const WIDE = window.matchMedia('(min-width:1024px)');

// ─── icons (from the design files) ───────────────────────────────
const P = {
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M19 15.2a5 5 0 0 1 3 4.6v1.2"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  next: '<path d="m15 18-6-6 6-6"/>',
  prev: '<path d="m9 18 6-6-6-6"/>',
  wave: '<path d="M2 8c.7.6 1.4 1 2.6 1C7 9 7 7 9.4 7c2.5 0 2.3 2 4.8 2 2.4 0 2.4-2 4.8-2 1.3 0 2 .5 2.6 1M2 14c.7.6 1.4 1 2.6 1 2.4 0 2.4-2 4.8-2 2.5 0 2.3 2 4.8 2 2.4 0 2.4-2 4.8-2 1.3 0 2 .5 2.6 1"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 7 9 6 9-6"/>',
  doc: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5M15.5 13h-7M15.5 17h-7"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3.5 2"/>',
  done2: '<path d="M17 6 6.5 16.5 2 12M22 9.5l-7 7-1.5-1.5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  alert: '<circle cx="12" cy="12" r="9.5"/><path d="M12 8v5M12 16.5v.01"/>',
  back: '<path d="M21 5H8.5L2 12l6.5 7H21a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="m16.5 9.5-5 5M11.5 9.5l5 5"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4-4"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  mobile: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  transfer: '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/>'
};
const ic = (name, extra = '') => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${P[name]}</svg>`;
const WAVE = (h = 30) => `<svg class="wave" viewBox="0 0 390 ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H390V10C330 ${h} 262 ${h} 196 16C128 2 62 2 0 18Z"/></svg>`;

// ─── small helpers ───────────────────────────────────────────────
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const DAY_NAME = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
const MONTH = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const ORD = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני', 'תשיעי', 'עשירי'];

function partsIL(d) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(d));
  const g = (t) => p.find((x) => x.type === t).value;
  return { day: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` };
}
const dayIL = (d = new Date()) => partsIL(d).day;
const timeIL = (d) => partsIL(d).time;
const addDays = (day, n) => new Date(Date.parse(day + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const wd = (day) => new Date(day + 'T12:00:00Z').getUTCDay();
const dmy = (day) => { const [y, m, d] = day.split('-'); return { y: +y, m: +m, d: +d }; };
const dm = (day) => { const x = dmy(day); return `${x.d}.${x.m}`; };
const longDay = (day) => `${DAY_NAME[wd(day)]}, ${dmy(day).d} ב${MONTH[dmy(day).m - 1]}`;
const sundayOf = (day) => addDays(day, -wd(day));
function offsetMin(d) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d);
  const g = (t) => +p.find((x) => x.type === t).value;
  return Math.round((Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - d.getTime()) / 6e4);
}
/** Israel wall time (day + HH:MM) → ISO instant. */
function ilToIso(day, hhmm) {
  const [y, m, d] = day.split('-').map(Number); const [hh, mm] = hhmm.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let t = wall - offsetMin(new Date(wall)) * 6e4;
  t = wall - offsetMin(new Date(t)) * 6e4;
  return new Date(t).toISOString();
}
const mins = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const hhmm = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
/** "היום, ה׳ 19.11" / "מחר, ו׳ 20.11" / "א׳ 22.11" */
function relDay(day) {
  const t = dayIL();
  const base = `${DOW[wd(day)]} ${dm(day)}`;
  if (day === t) return `היום, ${base}`;
  if (day === addDays(t, 1)) return `מחר, ${base}`;
  if (day === addDays(t, -1)) return `אתמול, ${base}`;
  return base;
}
function ago(iso) {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 6e4);
  if (min < 1) return 'עכשיו';
  if (min < 60) return `לפני ${min} דק׳`;
  const h = Math.round(min / 60);
  if (h === 1) return 'לפני שעה';
  if (h === 2) return 'לפני שעתיים';
  if (dayIL(iso) === dayIL()) return `לפני ${h} שעות`;
  if (dayIL(iso) === addDays(dayIL(), -1)) return `אתמול, ${timeIL(iso)}`;
  return dm(dayIL(iso));
}
const prettyPhone = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3)}` : (p || ''); };
const intl = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.startsWith('0') ? '972' + d.slice(1) : d; };
const waLink = (p, text) => `https://wa.me/${intl(p)}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const initials = (name) => { const w = String(name || '').trim().split(/\s+/).filter(Boolean); return w.length ? w[0][0] + (w[1] ? w[1][0] : '') : ''; };
const money = (n) => (n || n === 0) && n !== '' ? `${Number(n).toLocaleString('he-IL')} ₪` : '';
const first = (name) => String(name || '').trim().split(/\s+/)[0] || '';

// Appointment status → design key. A receipt turns "בוצע" into "קבלה הופקה".
function stKey(a) {
  if (a.receiptNo) return 'invoiced';
  return { 'בקשה חדשה': 'new', 'ממתין לתשלום': 'pay', 'מאושר': 'approved', 'בוצע': 'done', 'נדחה': 'rejected', 'בוטל': 'cancelled' }[a.status] || 'approved';
}
const ST = {
  new: { label: 'בקשה חדשה', icon: 'clock' },
  pay: { label: 'ממתין לתשלום', icon: 'clock' },
  approved: { label: 'מאושר', icon: 'check' },
  done: { label: 'בוצע · ממתין לקבלה', short: 'בוצע', icon: 'done2' },
  invoiced: { label: 'קבלה הופקה', icon: 'doc' },
  rejected: { label: 'נדחה' }, cancelled: { label: 'בוטל' }
};
const visible = (a) => !['rejected', 'cancelled'].includes(stKey(a));

// A treatment booked from the WhatsApp link: where its payment stands, and the screenshot.
function payBox(a) {
  if (!a.payStatus) return '';
  const lines = {
    'ממתין לתשלום': `השעה שמורה${a.payBy ? ` עד ${esc(relDay(dayIL(a.payBy)))} ב-<span class="ltr">${timeIL(a.payBy)}</span>` : ''}. פרטי התשלום נשלחו בוואטסאפ, ועוד לא הגיע צילום מסך.`,
    'אסמכתה התקבלה': `הגיע צילום מסך${a.proofAt ? ` ב-${esc(relDay(dayIL(a.proofAt)))}, <span class="ltr">${timeIL(a.proofAt)}</span>` : ''}, והתור אושר. לפני הקבלה כדאי לבדוק בביט או בפייבוקס שהכסף באמת נכנס.`,
    'שולם': 'שולם, והופקה קבלה.',
    'לא שולם': 'לא הגיע תשלום, והשעה שוחררה.',
  };
  const files = (a.proofs || []).map((p) => /^image\//.test(p.type || '')
    ? `<a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.url)}" alt="צילום המסך של התשלום" style="max-width:100%;max-height:260px;border-radius:14px;display:block;margin-top:10px"></a>`
    : `<a href="${esc(p.url)}" target="_blank" rel="noopener">${ic('down')}${esc(p.name || 'האסמכתה')}</a>`).join('');
  return `<div class="note-card"><div class="hd"><strong>תשלום · ${esc(a.payStatus)}</strong>${a.amount ? `<span>${money(a.amount)}</span>` : ''}</div>
    <p style="margin:6px 0 0">${lines[a.payStatus] || ''}</p>${files}</div>`;
}
const LEAD = { 'ליד חדש': 'new', 'בטיפול': 'working', 'לקוח': 'client', 'לא רלוונטי': 'irrelevant' };
const LEAD_ORDER = ['ליד חדש', 'בטיפול', 'לקוח', 'לא רלוונטי'];
const METHODS = [
  { id: 'מזומן', label: 'מזומן', icon: 'cash' }, { id: 'ביט', label: 'ביט', icon: 'mobile' },
  { id: 'העברה בנקאית', label: 'העברה', icon: 'transfer' }, { id: 'אשראי', label: 'אשראי', icon: 'card' }
];

// ─── server (or the demo data) ───────────────────────────────────
let token = '';
try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* private mode */ }

async function api(path, opts = {}) {
  if (DEMO) return demo(path, opts);
  const res = await fetch(API + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {})
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/api/admin/login') { lockOut(); throw new Error('צריך להיכנס מחדש'); }
  if (!res.ok) { const e = new Error(data.error || 'משהו השתבש'); e.status = res.status; e.data = data; throw e; }
  return data;
}

let flashTimer;
function flash(msg, bad = false) {
  let el = $('.flash-toast');
  if (!el) { el = document.createElement('div'); el.className = 'flash-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.toggle('bad', bad); el.hidden = false;
  clearTimeout(flashTimer); flashTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

// Caches that several screens share.
let setupCache = null;
async function setup(fresh) { if (!setupCache || fresh) setupCache = await api('/api/admin/setup'); return setupCache; }
let clientsCache = null;
async function clients(fresh) { if (!clientsCache || fresh) clientsCache = (await api('/api/admin/clients')).clients; return clientsCache; }

// ─── login ───────────────────────────────────────────────────────
let pin = ''; let lockTimer;
function lockOut() {
  token = ''; try { localStorage.removeItem(TOKEN_KEY); } catch {}
  closeSheet(); showLogin();
}
function showLogin(state = {}) {
  clearInterval(lockTimer);
  const locked = state.lockedUntil && state.lockedUntil > Date.now();
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  $('#root').innerHTML = `
    <div class="login">
      <div class="band"><span class="brand">בריכת האלות</span><span class="eyebrow">מרחב הניהול</span></div>
      ${WAVE(32)}
      <div class="login-body">
        ${locked ? `
          <div class="login-head"><span class="lock-ico">${ic('lock')}</span>
            <h1 style="font-size:2rem">הכניסה נעולה ל-15 דקות</h1>
            <p>היו כמה ניסיונות עם קוד שגוי. אפשר לנסות שוב בעוד <strong class="ltr" id="lockLeft" style="color:var(--sun-deep)"></strong></p></div>`
        : state.ok ? `
          <div class="login-head"><span class="lock-ico ok">${ic('check')}</span><h1 style="font-size:2.125rem">ברוכה הבאה, יהל</h1></div>`
        : `<div class="login-head"><h1>שלום, יהל</h1><p>הקלידי את הקוד בן 4 הספרות</p></div>`}
        <div class="dots ${state.err ? 'err' : ''}" id="dots" role="img" aria-label="הוזנו 0 מתוך 4 ספרות" style="opacity:${locked ? '.35' : '1'}"><i></i><i></i><i></i><i></i></div>
        <div class="login-msg" role="status" aria-live="polite">${state.err && !locked ? `<span class="errpill">${ic('alert', 'style="width:18px;height:18px"')}${esc(state.err)}</span>` : ''}</div>
        <div class="pad ${locked || state.ok ? 'off' : ''}" id="pad">
          ${keys.map((k) => k === '' ? '<span></span>' : k === 'del'
            ? `<button type="button" class="del" data-k="del" aria-label="מחיקת ספרה">${ic('back')}</button>`
            : `<button type="button" data-k="${k}">${k}</button>`).join('')}
        </div>
        <a class="home-link" href="/">חזרה לאתר</a>
      </div>
    </div>`;
  pin = ''; drawDots();
  $('#pad').addEventListener('click', (e) => { const k = e.target.closest('[data-k]')?.dataset.k; if (k) press(k); });
  if (locked) {
    const tick = () => {
      const left = Math.max(0, state.lockedUntil - Date.now());
      const el = $('#lockLeft'); if (el) el.textContent = `${Math.floor(left / 6e4)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
      if (!left) showLogin();
    };
    tick(); lockTimer = setInterval(tick, 1000);
  }
}
function drawDots() {
  const d = $('#dots'); if (!d) return;
  $$('i', d).forEach((x, i) => x.classList.toggle('on', i < pin.length));
  d.setAttribute('aria-label', `הוזנו ${pin.length} מתוך 4 ספרות`);
}
function press(k) {
  if ($('#pad')?.classList.contains('off')) return;
  if (k === 'del') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
  drawDots();
  if (pin.length === 4) tryPin(pin);
}
document.addEventListener('keydown', (e) => {
  if (!$('#pad') || $('.sheet-wrap')) return;
  if (/^\d$/.test(e.key)) press(e.key);
  else if (e.key === 'Backspace') press('del');
});
async function tryPin(code) {
  $('#pad').classList.add('off');
  try {
    const r = await api('/api/admin/login', { method: 'POST', body: { pin: code } });
    token = r.token; try { localStorage.setItem(TOKEN_KEY, token); } catch {}
    showLogin({ ok: true });
    setTimeout(() => { location.hash = '#/'; route(); }, 700);
  } catch (e) {
    if (e.data?.lockedUntil) return showLogin({ lockedUntil: e.data.lockedUntil });
    const left = e.data?.attemptsLeft;
    const msg = e.status === 401 ? `הקוד לא נכון.${left ? (left === 1 ? ' נשאר ניסיון אחד.' : ` נשארו ${left} ניסיונות.`) : ''}` : e.message;
    showLogin({ err: msg });
    $('#dots').classList.add('shake');
  }
}

// ─── app frame ───────────────────────────────────────────────────
let pendingCount = 0;
function frame(current, html, { head = '', band = '' } = {}) {
  const nav = [['#/', 'cal', 'יומן', 'home'], ['#/leads', 'people', 'לידים ולקוחות', 'leads'], ['#/settings', 'sliders', 'הגדרות', 'settings']];
  $('#root').innerHTML = `
    <div class="app">
      <aside class="side">
        <div class="brand"><b>בריכת האלות</b><span>מרחב הניהול</span></div>
        <nav aria-label="ניווט ניהול">${nav.map(([href, icon, label, key]) => `
          <a href="${href}" ${current === key ? 'aria-current="page"' : ''}>${ic(icon)}<span style="flex:1 1 auto">${label}</span>${key === 'home' && pendingCount ? `<span class="count">${pendingCount}</span>` : ''}</a>`).join('')}
        </nav>
        <button type="button" class="lockout" data-act="logout">${ic('lock', 'style="width:18px;height:18px"')}נעילה ויציאה</button>
      </aside>
      <div class="main">
        ${band}
        ${head ? `<div class="page-head">${head}</div>` : ''}
        ${html}
        <nav class="tabs" aria-label="ניווט ניהול">${nav.map(([href, icon, label, key]) => `
          <a href="${href}" ${current === key ? 'aria-current="page"' : ''}><span class="ico">${ic(icon)}</span>${label}</a>`).join('')}
        </nav>
      </div>
    </div>`;
}
const bandHtml = (title, sub, extra = '') => `<div class="band">${extra}<h1>${title}</h1>${sub ? `<span class="sub">${sub}</span>` : ''}</div>${WAVE()}`;
const loadingHtml = '<p class="loading">טוענת…<br><small>בפעם הראשונה אחרי הפסקה זה יכול לקחת עד דקה</small></p>';
const errHtml = (e) => `<div class="content"><div class="errbox">${esc(e.message)}</div><button class="btn out" data-act="reload">לנסות שוב</button></div>`;

document.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'logout') lockOut();
  if (act === 'reload') route();
});

// ─── routing ─────────────────────────────────────────────────────
const view = { mode: 'day', day: dayIL(), sel: null };
function route() {
  if (!token) return showLogin();
  const h = location.hash.replace(/^#\/?/, '');
  const [page, id] = h.split('/');
  if (page === 't' && id) return pageTreatment(id);
  if (page === 'leads') return pageLeads();
  if (page === 'c' && id) return pageClient(id);
  if (page === 'settings') return pageSettings();
  return pageHome();
}
window.addEventListener('hashchange', () => { closeSheet(true); route(); });
WIDE.addEventListener('change', () => route());

// ─── home: requests + calendar ───────────────────────────────────
let toastState = null; // { appt, kind }
async function pageHome() {
  if (WIDE.matches && view.mode === 'day' && !view.userPicked) view.mode = 'week';
  const from = view.mode === 'week' ? sundayOf(view.day) : view.day;
  const to = addDays(from, view.mode === 'week' ? 7 : 1);
  frame('home', loadingHtml);
  let d, s;
  try { [d, s] = await Promise.all([api(`/api/admin/calendar?from=${from}&to=${to}`), setup()]); }
  catch (e) { return frame('home', errHtml(e)); }
  const appts = d.appointments.filter(visible);
  const pending = d.pending.filter((a) => stKey(a) === 'new');
  pendingCount = pending.length;
  const today = dayIL();
  const todayCount = appts.filter((a) => dayIL(a.start) === today && stKey(a) !== 'new').length;
  const pendText = pendingCount === 0 ? 'אין בקשות ממתינות' : pendingCount === 1 ? 'בקשה אחת ממתינה' : `${pendingCount} בקשות ממתינות`;
  const dayTitle = view.day === today ? `היום · ${DAY_NAME[wd(today)]}` : longDay(view.day);
  const weekRange = `${dmy(from).d}–${dmy(addDays(from, 6)).d} ב${MONTH[dmy(addDays(from, 6)).m - 1]}`;

  const band = `<div class="band home-band"><div style="display:flex;flex-direction:column;gap:4px">
      <span class="date">${longDay(today)}</span><h1>שלום, יהל</h1>
      <span class="sub">${view.mode === 'day' && view.day === today ? `היום ${todayCount} טיפולים · ` : ''}${pendText}</span></div>
      <button type="button" class="plus" data-new aria-label="תור חדש">${ic('plus')}</button></div>${WAVE()}`;
  const head = `<div class="ttl"><h1>יומן</h1><span>${view.mode === 'week' ? `${weekRange} ${dmy(from).y}` : longDay(view.day)}</span></div>
    <div class="ctrl">
      <button type="button" class="round" data-nav="-1" aria-label="${view.mode === 'week' ? 'השבוע הקודם' : 'היום הקודם'}">${ic('prev')}</button>
      <button type="button" class="btn plain" style="min-height:44px;font-weight:700;color:var(--lagoon)" data-nav="0">היום</button>
      <button type="button" class="round" data-nav="1" aria-label="${view.mode === 'week' ? 'השבוע הבא' : 'היום הבא'}">${ic('next')}</button>
      ${segHtml()}
      <button type="button" class="btn" style="min-height:46px" data-new>${ic('plus', 'style="width:18px;height:18px;stroke-width:2.4"')}תור חדש</button>
    </div>`;

  const reqHtml = `
    <section class="sec" aria-labelledby="req-title">
      <div class="sec-head"><h2 id="req-title">בקשות חדשות</h2>${pendingCount ? `<span class="count">${pendingCount}</span>` : ''}</div>
      ${toastHtml()}
      ${pending.map(reqCard).join('') || `<div class="empty">${ic('check')}אין בקשות שמחכות לך. הכול מטופל.</div>`}
    </section>`;
  const legend = `<div class="legend"><span><i class="lg-new"></i>בקשה חדשה</span><span><i class="lg-approved"></i>מאושר</span><span><i class="lg-done"></i>בוצע</span><span><i class="lg-invoiced"></i>קבלה הופקה</span></div>`;
  const calBody = view.mode === 'day' ? agendaHtml(view.day, appts, d.busy, s.hours) : (WIDE.matches ? gridHtml(from, appts, d.busy, s.hours) : weekHtml(from, appts, s.hours));
  const calErr = d.calendarError ? `<div class="errbox" style="font-size:.875rem">היומן של גוגל לא נקרא כרגע: ${esc(d.calendarError)}</div>` : '';

  if (WIDE.matches) {
    const sel = appts.find((a) => a.id === view.sel) || appts.find((a) => dayIL(a.start) === today && stKey(a) === 'approved') || appts[0];
    view.sel = sel?.id || null;
    frame('home', `<div class="content">${legend}${calErr}
      <div class="dk"><div class="dk-left">${reqHtml}${sel ? selHtml(sel) : ''}</div>
      <div class="dk-right"><div class="grid-card">${calBody}</div>${view.mode === 'week' ? weekSumHtml(appts) : ''}</div></div></div>`, { head });
  } else {
    frame('home', `<main class="content">${reqHtml}
      <section class="sec" aria-labelledby="cal-title">
        <div class="sec-head split"><h2 id="cal-title">יומן</h2>${segHtml()}</div>
        <div class="range">
          <button type="button" class="round" data-nav="-1" aria-label="${view.mode === 'week' ? 'השבוע הקודם' : 'היום הקודם'}">${ic('prev')}</button>
          <div class="mid"><b>${view.mode === 'week' ? weekRange : dayTitle}</b><span>${view.mode === 'week' ? (from === sundayOf(today) ? 'השבוע' : String(dmy(from).y)) : `${dmy(view.day).d} ב${MONTH[dmy(view.day).m - 1]} ${dmy(view.day).y}`}</span></div>
          <button type="button" class="round" data-nav="1" aria-label="${view.mode === 'week' ? 'השבוע הבא' : 'היום הבא'}">${ic('next')}</button>
        </div>
        ${legend}${calErr}${calBody}
        ${view.mode === 'week' ? weekSumHtml(appts) : ''}
      </section></main>`, { band });
  }
  bindHome(pending, appts);
}
const segHtml = () => `<div class="seg" role="group" aria-label="תצוגת יומן">
  <button type="button" data-mode="day" aria-pressed="${view.mode === 'day'}">יום</button>
  <button type="button" data-mode="week" aria-pressed="${view.mode === 'week'}">שבוע</button></div>`;

function whenLine(a) { return `${relDay(dayIL(a.start))} · ${timeIL(a.start)}`; }
function reqCard(a) {
  return `<article class="req">
    <div class="req-top"><div><h3>${esc(a.clientName || 'ללא שם')}</h3><span class="pill st-new">בקשה חדשה</span></div><span class="ago">${esc(ago(a.createdTime))}</span></div>
    <div class="req-lines">
      <span>${ic('wave')}${esc(a.treatmentName)}</span>
      <span>${ic('cal')}<strong>${esc(whenLine(a))}</strong></span>
      ${a.clientPhone ? `<a href="tel:+${intl(a.clientPhone)}">${ic('phone')}<span class="ltr">${esc(prettyPhone(a.clientPhone))}</span></a>` : ''}
    </div>
    ${a.clientNote ? `<p class="quote">״${esc(a.clientNote)}״</p>` : ''}
    <div class="req-actions">
      <button type="button" class="btn" data-approve="${a.id}">${ic('check')}אישור</button>
      <button type="button" class="btn plain" data-reject="${a.id}">${ic('x', 'style="stroke-width:2"')}דחייה</button>
    </div></article>`;
}
function toastHtml() {
  if (!toastState) return '';
  const { appt: a, kind } = toastState;
  const text = kind === 'ok' ? `אישרת את הבקשה של ${a.clientName}. התור נכנס ליומן.` : `הבקשה של ${a.clientName} נדחתה.`;
  const msg = `היי ${first(a.clientName)}, כאן יהל מבריכת האלות. אישרתי את התור שלך ל${a.treatmentName}, ${relDay(dayIL(a.start))} בשעה ${timeIL(a.start)}. מחכה לך!`;
  return `<div class="toast" role="status"><span>${esc(text)}</span><div class="row">
    ${kind === 'ok' && a.clientPhone ? `<a href="${waLink(a.clientPhone, msg)}" target="_blank" rel="noopener">${ic('wa')}שליחת אישור בוואטסאפ</a>` : ''}
    <button type="button" data-undo>ביטול</button></div></div>`;
}
function freeWindows(day, list, busy, hours) {
  const h = hours.find((x) => +x.dayNum === wd(day));
  if (!h || !h.active || !h.open || !h.close) return [];
  const taken = [...list.map((a) => [mins(timeIL(a.start)), mins(timeIL(a.end))]),
    ...busy.filter((b) => !b.allDay).map((b) => [mins(timeIL(b.start)), mins(timeIL(b.end))])].sort((x, y) => x[0] - y[0]);
  if (busy.some((b) => b.allDay)) return [];
  const out = []; let cur = mins(h.open); const end = mins(h.close);
  // Today, a window that already passed is not free any more.
  if (day === dayIL()) cur = Math.max(cur, Math.ceil(mins(timeIL(new Date())) / 15) * 15);
  for (const [s, e] of taken) { if (s - cur >= 60) out.push([cur, s]); cur = Math.max(cur, e); }
  if (end - cur >= 60) out.push([cur, end]);
  return out;
}
function agendaHtml(day, appts, busy, hours) {
  const list = appts.filter((a) => dayIL(a.start) === day);
  const dayBusy = busy.filter((b) => dayIL(b.start) === day || (b.allDay && b.start <= ilToIso(day, '12:00') && b.end > ilToIso(day, '12:00')));
  const now = Date.now();
  const items = [
    ...list.map((a) => ({ t: mins(timeIL(a.start)), html: agItem(a, now) })),
    ...dayBusy.map((b) => ({ t: b.allDay ? -1 : mins(timeIL(b.start)), html: `<div class="ag"><span class="tm"><b>${b.allDay ? 'כל היום' : timeIL(b.start)}</b>${b.allDay ? '' : `<span>${timeIL(b.end)}</span>`}</span><span class="card c-busy"><span class="nm">תפוס ביומן גוגל</span>${b.title ? `<span class="tr">${esc(b.title)}</span>` : ''}</span></div>` })),
    ...freeWindows(day, list, dayBusy, hours).map(([s, e]) => ({ t: s, html: `<div class="ag"><span class="tm small">${hhmm(s)}</span><button type="button" class="free" data-new-at="${day} ${hhmm(s)}"><span>חלון פנוי · <span class="ltr">${hhmm(s)}–${hhmm(e)}</span></span><b>${ic('plus')}תור</b></button></div>` }))
  ].sort((x, y) => x.t - y.t);
  const h = hours.find((x) => +x.dayNum === wd(day));
  if (!items.length) return `<div class="empty">${h && h.active ? 'אין טיפולים ביום הזה.' : 'סגור ביום הזה.'}</div>`;
  return `<div class="agenda">${items.map((i) => i.html).join('')}</div>`;
}
function agItem(a, now) {
  const k = stKey(a); const isNow = now >= new Date(a.start).getTime() && now < new Date(a.end).getTime();
  return `<a class="ag" href="#/t/${a.id}">
    <span class="tm"><b>${timeIL(a.start)}</b><span>${timeIL(a.end)}</span></span>
    <span class="card c-${k}">
      <span class="nm"><span>${esc(a.clientName || 'ללא שם')}</span>${isNow ? '<span class="now">עכשיו</span>' : ''}</span>
      <span class="tr">${esc(a.treatmentName)}</span>
      <span class="lab">${ic(ST[k].icon)}${ST[k].label}${a.receiptNo ? ` · ${esc(a.receiptNo)}` : ''}</span>
    </span></a>`;
}
function weekHtml(from, appts, hours) {
  const today = dayIL();
  return `<div class="week">${[0, 1, 2, 3, 4, 5, 6].map((i) => {
    const day = addDays(from, i);
    const h = hours.find((x) => +x.dayNum === wd(day));
    const list = appts.filter((a) => dayIL(a.start) === day).sort((x, y) => x.start.localeCompare(y.start));
    const closed = (!h || !h.active) && !list.length;
    return `<div class="wcol"><div class="whead ${day === today ? 'today' : ''}"><span>${DOW[wd(day)]}</span><b>${dmy(day).d}</b></div>
      <div class="wbody ${closed ? 'closed' : ''}">${list.map((a) => { const k = stKey(a); return `<a class="c-${k}" href="#/t/${a.id}" aria-label="${esc(`${DOW[wd(day)]} ${dm(day)} · ${timeIL(a.start)} · ${ST[k].label}`)}">${timeIL(a.start)}</a>`; }).join('')}</div></div>`;
  }).join('')}</div>`;
}
function gridHtml(from, appts, busy, hours) {
  const START = 8, END = 20, PX = 56; const H = (END - START) * PX;
  const top = (iso) => Math.round((mins(timeIL(iso)) - START * 60) / 60 * PX);
  const today = dayIL();
  const heads = [0, 1, 2, 3, 4, 5, 6].map((i) => { const day = addDays(from, i); return `<span class="whead ${day === today ? 'today' : ''}"><span>${DOW[wd(day)]}</span><b>${dmy(day).d}</b></span>`; }).join('');
  const axis = Array.from({ length: END - START }, (_, i) => `<span style="top:${i * PX + 2}px">${String(START + i).padStart(2, '0')}:00</span>`).join('');
  const cols = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const day = addDays(from, i);
    const h = hours.find((x) => +x.dayNum === wd(day));
    const list = appts.filter((a) => dayIL(a.start) === day);
    const blocks = busy.filter((b) => !b.allDay && dayIL(b.start) === day).map((b) => `<span class="blk c-busy" style="top:${Math.max(0, top(b.start))}px;height:${Math.max(28, top(b.end) - top(b.start))}px"><span class="t">${timeIL(b.start)}</span>תפוס ביומן</span>`).join('');
    const items = list.map((a) => {
      const k = stKey(a); const y = Math.max(0, top(a.start)); const hgt = Math.max(36, top(a.end) - top(a.start) - 4);
      return `<button type="button" class="blk c-${k}" data-sel="${a.id}" aria-pressed="${a.id === view.sel}" style="top:${y}px;height:${hgt}px"><span class="t">${timeIL(a.start)}</span><b>${esc(a.clientName || 'ללא שם')}</b><span>${/זוג/.test(a.treatmentName) ? 'זוגי' : 'אישי'}</span></button>`;
    }).join('');
    const nowY = day === today ? top(new Date().toISOString()) : -1;
    return `<div class="col ${(!h || !h.active) && !list.length ? 'closed' : ''}" style="height:${H}px">${blocks}${items}${nowY > 0 && nowY < H ? `<span class="nowline" style="top:${nowY}px"></span>` : ''}</div>`;
  }).join('');
  return `<div class="grid-scroll"><div class="tgrid"><div class="heads"><span></span>${heads}</div><div class="cols"><div class="axis" style="height:${H}px">${axis}</div>${cols}</div></div></div>`;
}
function weekSumHtml(appts) {
  const done = appts.filter((a) => stKey(a) !== 'new');
  const inv = appts.filter((a) => stKey(a) === 'invoiced').length;
  const wait = appts.filter((a) => stKey(a) === 'done');
  return `<div class="week-sum" style="margin-top:14px"><b>השבוע במים</b><span>${done.length} טיפולים · ${inv} קבלות הופקו</span>
    ${wait.length ? `<a href="#/t/${wait[0].id}">${wait.length === 1 ? 'טיפול אחד מחכה לקבלה' : `${wait.length} טיפולים מחכים לקבלה`}${ic('next', 'style="width:16px;height:16px"')}</a>` : ''}</div>`;
}
function selHtml(a) {
  const k = stKey(a);
  const cta = { new: 'פתיחת הבקשה', approved: 'סיום טיפול והפקת קבלה', done: 'הפקת קבלה', invoiced: 'פתיחת הקבלה (PDF)' }[k];
  return `<section class="sel" aria-labelledby="dk-sel"><div class="hd"><div><small>נבחר ביומן</small><h2 id="dk-sel">${esc(a.clientName || 'ללא שם')}</h2></div><span class="pill st-${k}">${k === 'done' ? 'בוצע' : ST[k].label}</span></div>
    <span>${esc(a.treatmentName)}</span><span class="muted">${esc(relDay(dayIL(a.start)))} · ${timeIL(a.start)}</span>
    ${a.clientPhone ? `<div class="duo"><a class="btn out" style="min-height:44px" href="tel:+${intl(a.clientPhone)}">חיוג</a><a class="btn out" style="min-height:44px" href="${waLink(a.clientPhone)}" target="_blank" rel="noopener">וואטסאפ</a></div>` : ''}
    ${k === 'invoiced' && a.receiptUrl ? `<a class="btn" href="${esc(a.receiptUrl)}" target="_blank" rel="noopener">${ic('down')}${cta}</a>`
      : `<a class="btn" style="min-height:54px;box-shadow:0 10px 24px rgba(10,124,119,.25)" href="#/t/${a.id}${k === 'approved' || k === 'done' ? '/receipt' : ''}">${ic('doc')}${cta}</a>`}
  </section>`;
}
function bindHome(pending, appts) {
  const root = $('#root');
  $$('[data-mode]', root).forEach((b) => b.onclick = () => { view.mode = b.dataset.mode; view.userPicked = true; pageHome(); });
  $$('[data-nav]', root).forEach((b) => b.onclick = () => {
    const n = +b.dataset.nav;
    view.day = n === 0 ? dayIL() : addDays(view.day, n * (view.mode === 'week' ? 7 : 1));
    pageHome();
  });
  $$('[data-new]', root).forEach((b) => b.onclick = () => newApptSheet({ day: view.day }));
  $$('[data-new-at]', root).forEach((b) => b.onclick = () => { const [day, time] = b.dataset.newAt.split(' '); newApptSheet({ day, time }); });
  $$('[data-sel]', root).forEach((b) => b.onclick = () => { view.sel = b.dataset.sel; pageHome(); });
  const act = async (id, kind) => {
    const a = pending.find((x) => x.id === id); if (!a) return;
    try {
      await api(`/api/admin/appointments/${id}`, { method: 'PATCH', body: { status: kind === 'ok' ? 'מאושר' : 'נדחה' } });
      toastState = { appt: a, kind }; pageHome();
    } catch (e) { flash(e.message, true); }
  };
  $$('[data-approve]', root).forEach((b) => b.onclick = () => act(b.dataset.approve, 'ok'));
  $$('[data-reject]', root).forEach((b) => b.onclick = () => act(b.dataset.reject, 'no'));
  const undo = $('[data-undo]', root);
  if (undo) undo.onclick = async () => {
    try { await api(`/api/admin/appointments/${toastState.appt.id}`, { method: 'PATCH', body: { status: 'בקשה חדשה' } }); toastState = null; pageHome(); }
    catch (e) { flash(e.message, true); }
  };
}

// ─── treatment card ──────────────────────────────────────────────
async function pageTreatment(id) {
  const wantReceipt = location.hash.endsWith('/receipt');
  frame('home', loadingHtml);
  let a, c = null, s;
  try {
    a = (await api(`/api/admin/appointments/${id}`)).appointment;
    [c, s] = await Promise.all([a.clientId ? api(`/api/admin/clients/${a.clientId}`) : null, setup()]);
  } catch (e) { return frame('home', errHtml(e)); }
  const k = stKey(a);
  const hist = c ? c.appointments.filter(visible).sort((x, y) => String(x.start).localeCompare(String(y.start))) : [];
  const nth = hist.findIndex((x) => x.id === a.id) + 1;
  const receipts = hist.filter((x) => x.receiptNo).length;
  const leadLabel = c ? c.client.status : '';
  const pill = `<span class="pill st-${k}">${ic(ST[k].icon, 'style="width:14px;height:14px"')}${k === 'done' ? 'בוצע' : ST[k].label}</span>`;
  const day = dayIL(a.start);
  frame('home', `
    <div class="topbar"><a class="back" href="#/">${ic('prev')}יומן</a>${pill}</div>
    <div class="content tight narrow" style="flex:1 1 auto">
      <div class="who"><span class="avatar">${esc(initials(a.clientName))}</span><div style="display:flex;flex-direction:column"><h1>${esc(a.clientName || 'ללא שם')}</h1><span>${esc(leadLabel)}${nth ? ` · טיפול ${nth <= 10 ? ORD[nth - 1] : 'מס׳ ' + nth}` : ''}</span></div></div>
      ${a.clientPhone ? `<div class="duo"><a class="btn out" href="tel:+${intl(a.clientPhone)}">${ic('phone')}חיוג</a><a class="btn out" href="${waLink(a.clientPhone)}" target="_blank" rel="noopener">${ic('wa')}וואטסאפ</a></div>` : ''}
      <div class="list-card">
        <div>${ic('wave')}<strong style="color:var(--lagoon)">${esc(a.treatmentName)}</strong></div>
        <div>${ic('cal')}<span>${esc(relDay(day))} · <span class="ltr">${timeIL(a.start)}–${timeIL(a.end)}</span></span></div>
        ${a.clientPhone ? `<div>${ic('phone')}<span class="ltr">${esc(prettyPhone(a.clientPhone))}</span></div>` : ''}
        ${a.clientEmail ? `<div>${ic('mail')}<span class="ltr">${esc(a.clientEmail)}</span></div>` : ''}
      </div>
      ${a.clientNote ? `<p class="quote">מה כתבה בטופס: ״${esc(a.clientNote)}״</p>` : ''}
      <div class="note-card"><div class="hd"><label for="tr-notes">הערות</label><span id="saveState">נשמר אוטומטית</span></div>
        <textarea id="tr-notes" class="input" rows="3">${esc(a.notes)}</textarea></div>
      ${c ? `<a class="to-client" href="#/c/${c.client.id}"><span><strong>כרטיס הלקוחה</strong> · ${hist.length} טיפולים, ${receipts} קבלות</span>${ic('next')}</a>` : ''}
      ${payBox(a)}
      <div class="t-actions">
        ${k === 'new' ? `<div class="req-actions"><button type="button" class="btn" data-st="מאושר">${ic('check')}אישור</button><button type="button" class="btn plain" data-st="נדחה">${ic('x')}דחייה</button></div>` : ''}
        ${k === 'pay' ? `<div class="req-actions"><button type="button" class="btn" data-st="מאושר">${ic('check')}אישור בלי לחכות</button><button type="button" class="btn plain" data-st="בוטל">${ic('x')}ביטול התור</button></div>` : ''}
        ${k === 'approved' || k === 'done' ? `<button type="button" class="btn big" data-receipt>${ic('doc')}סיום טיפול והפקת קבלה</button>` : ''}
        ${k === 'approved' ? `<button type="button" class="linkbtn" data-st="בוצע">סימון כבוצע, קבלה אחר כך</button>` : ''}
        ${k === 'invoiced' ? `<a class="btn dark" style="min-height:58px" href="${esc(a.receiptUrl || '#')}" target="_blank" rel="noopener">${ic('down')}קבלה מס׳ ${esc(a.receiptNo)} · PDF</a>` : ''}
        ${a.receiptError && k !== 'invoiced' ? `<p class="errbox" style="font-size:.875rem">בניסיון הקודם להפיק קבלה: ${esc(a.receiptError)}</p>` : ''}
      </div>
    </div>`);
  // Notes save themselves a moment after typing stops.
  let t; const note = $('#tr-notes');
  note.addEventListener('input', () => {
    $('#saveState').textContent = 'שומרת…'; clearTimeout(t);
    t = setTimeout(async () => {
      try { await api(`/api/admin/appointments/${a.id}`, { method: 'PATCH', body: { notes: note.value } }); $('#saveState').textContent = 'נשמר אוטומטית'; }
      catch (e) { $('#saveState').textContent = 'לא נשמר'; flash(e.message, true); }
    }, 700);
  });
  $$('[data-st]').forEach((b) => b.onclick = async () => {
    try { await api(`/api/admin/appointments/${a.id}`, { method: 'PATCH', body: { status: b.dataset.st } }); flash('עודכן'); pageTreatment(a.id); }
    catch (e) { flash(e.message, true); }
  });
  const open = () => receiptSheet(a, c?.client, s);
  $('[data-receipt]')?.addEventListener('click', open);
  if (wantReceipt && (k === 'approved' || k === 'done')) open();
}

function receiptSheet(a, client, s) {
  const sendDefault = !/^(לא|no)$/i.test((s.settings.find((x) => x.key === 'שליחת קבלה ללקוח במייל') || {}).value || 'כן');
  const email = a.clientEmail || client?.email || '';
  let method = METHODS.find((m) => m.id === a.payMethod)?.id || null;
  let sendMail = sendDefault && !!email;
  const draw = () => {
    openSheet(`
      <div class="hd"><div><h2 id="sh-t">סיום טיפול</h2><p>${esc(a.clientName)} · ${esc(a.treatmentName)} · ${esc(relDay(dayIL(a.start)).split(',')[0])} ${timeIL(a.start)}</p></div>
        <button type="button" class="round" data-close aria-label="סגירה">${ic('x')}</button></div>
      <div class="field"><label for="inv-amount">סכום</label>
        <div class="money"><span>₪</span><input id="inv-amount" type="text" inputmode="decimal" value="${esc(a.amount ?? '')}" placeholder="0"></div>
        <span class="hint">${a.amount ? 'המחיר שהוגדר לטיפול הזה. אפשר לשנות.' : 'עוד לא הוגדר מחיר לטיפול הזה, אפשר להגדיר בהגדרות.'}</span></div>
      <fieldset style="margin:0;padding:0;border:0;display:flex;flex-direction:column;gap:8px"><legend class="lbl" style="padding:0;margin-bottom:8px">אמצעי תשלום</legend>
        <div class="methods">${METHODS.map((m) => `<button type="button" data-m="${m.id}" aria-pressed="${m.id === method}">${ic(m.icon)}${m.label}</button>`).join('')}</div></fieldset>
      <label class="check"><input type="checkbox" id="sendMail" ${sendMail ? 'checked' : ''} ${email ? '' : 'disabled'}><span>${email ? `שליחת הקבלה ללקוחה במייל <span class="ltr muted">(${esc(email)})</span>` : 'אין מייל בכרטיס, אז הקבלה לא תישלח במייל'}</span></label>
      <p class="errbox" id="rErr" hidden></p>
      <button type="button" class="btn" style="min-height:60px;font-size:1.125rem" id="issue" ${method ? '' : 'disabled'}>הפקת קבלה</button>`, 'sh-t');
    $$('[data-m]').forEach((b) => b.onclick = () => { method = b.dataset.m; a.amount = $('#inv-amount').value; draw(); });
    $('#sendMail').onchange = (e) => { sendMail = e.target.checked; };
    $('#issue').onclick = issue;
  };
  const issue = async () => {
    const amount = Number(String($('#inv-amount').value).replace(/[^\d.]/g, ''));
    if (!(amount > 0)) { $('#rErr').textContent = 'צריך סכום'; $('#rErr').hidden = false; return; }
    const btn = $('#issue'); btn.disabled = true; btn.textContent = 'מפיקה במורנינג…';
    try {
      const r = await api(`/api/admin/appointments/${a.id}/receipt`, { method: 'POST', body: { amount, method, sendEmail: sendMail } });
      const m = METHODS.find((x) => x.id === method);
      openSheet(`
        <div class="done-head"><span class="done-ico">${ic('check')}</span><h2 id="sh-t" style="font-size:2.125rem">הקבלה הופקה</h2>
          <div class="done-box"><span class="hint" style="font-size:.875rem">מספר קבלה</span><span class="no">${esc(r.number)}</span>
            <span>${money(amount)} · ${m.label} · ${dm(dayIL())}.${dmy(dayIL()).y}</span>
            ${r.emailed ? `<span class="hint" style="font-size:.875rem">נשלחה למייל של ${esc(first(a.clientName))}</span>` : ''}</div>
          ${r.url ? `<a class="btn block" style="min-height:58px" href="${esc(r.url)}" target="_blank" rel="noopener">${ic('down')}פתיחת הקבלה (PDF)</a>` : ''}
          <div class="duo" style="width:100%">
            ${a.clientPhone ? `<a class="btn out" href="${waLink(a.clientPhone, `היי ${first(a.clientName)}, תודה שבאת! הקבלה שלך: ${r.url || ''}`)}" target="_blank" rel="noopener">שליחה בוואטסאפ</a>` : ''}
            <a class="btn plain" href="#/">חזרה ליומן</a></div>
          <button type="button" class="linkbtn" style="color:var(--muted)" data-close>סגירה</button></div>`, 'sh-t', () => pageTreatment(a.id));
    } catch (e) {
      $('#rErr').textContent = e.message; $('#rErr').hidden = false;
      btn.disabled = false; btn.textContent = 'הפקת קבלה';
    }
  };
  draw();
}

// ─── sheets ──────────────────────────────────────────────────────
let onSheetClose = null;
function openSheet(html, labelId, onClose) {
  closeSheet(true);
  const w = document.createElement('div');
  w.className = 'sheet-wrap';
  w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" ${labelId ? `aria-labelledby="${labelId}"` : ''}><span class="grip" aria-hidden="true"></span>${html}</div>`;
  w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('[data-close]')) closeSheet(); });
  document.body.appendChild(w);
  onSheetClose = onClose || null;
  (w.querySelector('input:not([disabled]),button:not([data-close])') || w.querySelector('button'))?.focus({ preventScroll: true });
}
function closeSheet(silent) {
  const w = $('.sheet-wrap'); if (!w) return;
  w.remove();
  const cb = onSheetClose; onSheetClose = null;
  if (!silent && cb) cb();
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

async function newApptSheet({ day, time, client } = {}) {
  let s; try { s = await setup(); } catch (e) { return flash(e.message, true); }
  const list = s.treatments.filter((t) => t.minutes);
  openSheet(`
    <div class="hd"><div><h2 id="sh-t">תור חדש</h2>${client ? `<p>${esc(client.name || prettyPhone(client.phone))}</p>` : ''}</div><button type="button" class="round" data-close aria-label="סגירה">${ic('x')}</button></div>
    ${client ? '' : `<div class="field"><label for="na-phone">טלפון</label><input id="na-phone" type="tel" inputmode="tel" dir="ltr" placeholder="050-0000000"></div>
      <div class="field"><label for="na-name">שם</label><input id="na-name" type="text" placeholder="אם זה ליד חדש"></div>`}
    <div class="field"><label for="na-t">טיפול</label><select id="na-t">${list.map((t) => `<option value="${t.id}">${esc(t.name)} · ${t.minutes} דק׳</option>`).join('')}</select></div>
    <div class="duo"><div class="field"><label for="na-d">תאריך</label><input id="na-d" type="date" value="${day || dayIL()}"></div>
      <div class="field"><label for="na-h">שעה</label><input id="na-h" type="time" step="900" value="${time || '10:00'}"></div></div>
    <p class="hint" style="margin:0">אם הטלפון כבר קיים, התור יתווסף לאותו איש קשר. התור נשמר כמאושר.</p>
    <p class="errbox" id="naErr" hidden></p>
    <button type="button" class="btn" style="min-height:58px" id="naSave">שמירה ביומן</button>`, 'sh-t');
  $('#naSave').onclick = async () => {
    const body = { treatmentId: $('#na-t').value, start: ilToIso($('#na-d').value, $('#na-h').value), status: 'מאושר' };
    if (client) body.clientId = client.id; else { body.phone = $('#na-phone').value; body.name = $('#na-name').value; }
    try { const r = await api('/api/admin/appointments', { method: 'POST', body }); clientsCache = null; closeSheet(true); location.hash = `#/t/${r.appointment.id}`; flash('התור נשמר ביומן'); }
    catch (e) { $('#naErr').textContent = e.message; $('#naErr').hidden = false; }
  };
}

// ─── leads & clients ─────────────────────────────────────────────
const leadsState = { filter: 'all', q: '', flash: '' };
async function pageLeads() {
  const band = (all) => bandHtml('לידים ולקוחות', `${all.length} אנשי קשר · ${all.filter((p) => p.status === 'ליד חדש').length} לידים חדשים`);
  frame('leads', loadingHtml, { band: bandHtml('לידים ולקוחות', '') });
  let all; try { all = await clients(); } catch (e) { return frame('leads', errHtml(e)); }
  frame('leads', `<main class="content tight narrow">
    <div class="quick"><label class="lbl" for="ld-phone">ליד חדש לפי טלפון</label>
      <div class="row"><input id="ld-phone" class="input" type="tel" inputmode="tel" dir="ltr" placeholder="050-0000000"><button type="button" class="btn" id="ldAdd">${ic('plus', 'style="width:18px;height:18px;stroke-width:2.4"')}הוספה</button></div>
      <span class="flash" role="status" id="ldFlash" ${leadsState.flash ? '' : 'hidden'}>${ic('check', 'style="width:16px;height:16px;stroke-width:2.6"')}<span>${esc(leadsState.flash)}</span></span></div>
    <div class="search"><label for="ld-search" class="sr">חיפוש</label>${ic('search')}<input id="ld-search" type="search" placeholder="חיפוש לפי שם או טלפון" value="${esc(leadsState.q)}"></div>
    <div class="filters" role="group" aria-label="סינון לפי סטטוס" id="ldFilters"></div>
    <div class="people" id="ldList"></div></main>`,
  { band: band(all), head: `<div class="ttl"><h1>לידים ולקוחות</h1><span>${all.length} אנשי קשר</span></div>` });
  const draw = () => {
    const digits = (x) => String(x || '').replace(/\D/g, '');
    const q = leadsState.q.trim();
    const searched = all.filter((p) => !q || String(p.name).includes(q) || (digits(q) && digits(p.phone).includes(digits(q))));
    const F = [['all', 'הכול'], ...LEAD_ORDER.map((s) => [s, s])];
    $('#ldFilters').innerHTML = F.map(([id, label]) => `<button type="button" data-f="${esc(id)}" aria-pressed="${id === leadsState.filter}">${label}<span>${searched.filter((p) => id === 'all' || p.status === id).length}</span></button>`).join('');
    const rows = searched.filter((p) => leadsState.filter === 'all' || p.status === leadsState.filter);
    $('#ldList').innerHTML = rows.map((p) => {
      const k = LEAD[p.status] || 'new';
      const n = (p.apptIds || []).length;
      const meta = n ? `${n === 1 ? 'טיפול אחד' : `${n} טיפולים`}${p.source ? ` · ${p.source}` : ''}` : `${p.source || 'נוסף ידנית'} · ${ago(p.createdTime)}`;
      return `<a class="person" href="#/c/${p.id}"><span class="av av-${k}">${p.name ? esc(initials(p.name)) : ic('phone')}</span>
        <span class="body"><span class="top"><span class="nm">${esc(p.name || 'ליד ללא שם')}</span><span class="pill lp-${k}">${esc(p.status || 'ליד חדש')}</span></span>
        <span class="ph">${esc(prettyPhone(p.phone))}</span><span class="meta">${esc(meta)}</span></span></a>`;
    }).join('') || '<div class="none">לא נמצאו אנשי קשר. אפשר להוסיף ליד חדש לפי טלפון.</div>';
  };
  draw();
  $('#ld-search').oninput = (e) => { leadsState.q = e.target.value; draw(); };
  $('#ldFilters').onclick = (e) => { const f = e.target.closest('[data-f]')?.dataset.f; if (f) { leadsState.filter = f; draw(); } };
  const add = async () => {
    const phone = $('#ld-phone').value.trim();
    if (phone.replace(/\D/g, '').length < 9) return flash('מספר הטלפון לא נראה תקין', true);
    try {
      await api('/api/admin/clients', { method: 'POST', body: { phone } });
      leadsState.flash = `נוסף ליד חדש: ${prettyPhone(phone)}`; leadsState.filter = 'all';
      clientsCache = null; pageLeads();
    } catch (e) {
      if (e.status === 409 && e.data?.client) { flash('הטלפון הזה כבר קיים'); location.hash = `#/c/${e.data.client.id}`; } else flash(e.message, true);
    }
  };
  $('#ldAdd').onclick = add;
  $('#ld-phone').onkeydown = (e) => { if (e.key === 'Enter') add(); };
  leadsState.flash = '';
}

async function pageClient(id) {
  frame('leads', loadingHtml);
  let d; try { d = await api(`/api/admin/clients/${id}`); } catch (e) { return frame('leads', errHtml(e)); }
  const c = d.client;
  const hist = d.appointments.filter(visible).sort((x, y) => String(y.start).localeCompare(String(x.start)));
  const receipts = hist.filter((a) => a.receiptNo).length;
  const now = new Date().toISOString();
  const next = hist.filter((a) => a.start >= now && ['approved', 'new'].includes(stKey(a))).sort((x, y) => x.start.localeCompare(y.start))[0];
  const since = c.createdTime ? `${MONTH[dmy(dayIL(c.createdTime)).m - 1]} ${dmy(dayIL(c.createdTime)).y}` : '';
  const k = LEAD[c.status] || 'new';
  frame('leads', `
    <div class="topbar"><a class="back" href="#/leads">${ic('prev')}לידים ולקוחות</a><button type="button" class="linkbtn" data-edit>עריכת פרטים</button></div>
    <main class="content tight narrow" style="gap:22px">
      <div class="c-head"><span class="avatar">${c.name ? esc(initials(c.name)) : ic('phone')}</span><h1>${esc(c.name || 'ליד ללא שם')}</h1>
        <span class="ltr">${esc(prettyPhone(c.phone))}</span>
        <span class="muted" style="font-size:.875rem">${esc(c.status || '')}${since ? ` מ${since}` : ''}${c.source ? ` · הגיעה דרך ${c.source}` : ''}</span></div>
      <div class="tiles">
        <a href="tel:+${intl(c.phone)}" ${c.phone ? '' : 'aria-disabled="true"'}>${ic('phone')}חיוג</a>
        <a href="${waLink(c.phone)}" target="_blank" rel="noopener" ${c.phone ? '' : 'aria-disabled="true"'}>${ic('wa')}וואטסאפ</a>
        <a href="mailto:${esc(c.email)}" ${c.email ? '' : 'aria-disabled="true"'}>${ic('mail')}מייל</a></div>
      <div role="group" aria-labelledby="cl-status" style="display:flex;flex-direction:column;gap:10px"><span id="cl-status" class="lbl">סטטוס</span>
        <div class="statuses">${LEAD_ORDER.map((s) => `<button type="button" class="s-${LEAD[s]}" data-status="${s}" aria-pressed="${s === c.status}">${s}</button>`).join('')}</div></div>
      <div class="stats"><div><b>${hist.length}</b><span>טיפולים</span></div><div><b>${receipts}</b><span>קבלות</span></div>
        <div><b class="small">${next ? esc(relDay(dayIL(next.start)).split(',')[0]) : '—'}</b><span>הטיפול הבא</span></div></div>
      <button type="button" class="btn" style="min-height:56px;font-size:1.06rem" data-book>${ic('plus', 'style="stroke-width:2.2"')}קביעת טיפול חדש</button>
      <section class="sec" aria-labelledby="cl-hist" style="gap:12px"><h2 id="cl-hist" style="font-size:1.625rem">טיפולים וקבלות</h2>
        <div class="history">${hist.map((a) => { const sk = stKey(a); return `<div>
          <div class="top"><b>${a.start ? `${dayIL(a.start) === dayIL() ? 'היום, ' : ''}${dm(dayIL(a.start))}.${dmy(dayIL(a.start)).y}` : ''}</b><span class="pill st-${sk}">${sk === 'done' ? 'בוצע' : ST[sk].label}</span></div>
          <span class="sub">${esc(a.treatmentName)} · <span class="ltr">${a.start ? timeIL(a.start) : ''}</span></span>
          ${a.receiptNo ? `<a href="${esc(a.receiptUrl || '#')}" target="_blank" rel="noopener">${ic('down')}קבלה ${esc(a.receiptNo)} · PDF</a>` : `<a href="#/t/${a.id}">לכרטיס הטיפול${ic('next')}</a>`}
        </div>`; }).join('') || '<div class="none">עוד אין טיפולים</div>'}</div></section>
      <div class="note-card"><div class="hd"><label for="cl-notes">הערות על הלקוחה</label><span id="cSave">נשמר אוטומטית</span></div>
        <textarea id="cl-notes" class="input" rows="3">${esc(c.notes)}</textarea></div>
    </main>`, { head: `<div class="ttl"><h1>${esc(c.name || 'ליד ללא שם')}</h1><span class="pill lp-${k}">${esc(c.status)}</span></div>` });
  $$('[data-status]').forEach((b) => b.onclick = async () => {
    try { await api(`/api/admin/clients/${c.id}`, { method: 'PATCH', body: { status: b.dataset.status } }); clientsCache = null; flash('הסטטוס עודכן'); pageClient(c.id); }
    catch (e) { flash(e.message, true); }
  });
  $('[data-book]').onclick = () => newApptSheet({ client: c });
  $('[data-edit]').onclick = () => editClientSheet(c);
  let t; const note = $('#cl-notes');
  note.addEventListener('input', () => {
    $('#cSave').textContent = 'שומרת…'; clearTimeout(t);
    t = setTimeout(async () => {
      try { await api(`/api/admin/clients/${c.id}`, { method: 'PATCH', body: { notes: note.value } }); $('#cSave').textContent = 'נשמר אוטומטית'; }
      catch (e) { $('#cSave').textContent = 'לא נשמר'; flash(e.message, true); }
    }, 700);
  });
}
function editClientSheet(c) {
  openSheet(`
    <div class="hd"><h2 id="sh-t">עריכת פרטים</h2><button type="button" class="round" data-close aria-label="סגירה">${ic('x')}</button></div>
    <div class="field"><label for="ec-name">שם מלא</label><input id="ec-name" type="text" value="${esc(c.name)}"></div>
    <div class="field"><label for="ec-phone">טלפון</label><input id="ec-phone" type="tel" dir="ltr" value="${esc(prettyPhone(c.phone))}"></div>
    <div class="field"><label for="ec-mail">מייל</label><input id="ec-mail" type="email" dir="ltr" value="${esc(c.email)}"></div>
    <p class="errbox" id="ecErr" hidden></p>
    <button type="button" class="btn" style="min-height:56px" id="ecSave">שמירה</button>`, 'sh-t');
  $('#ecSave').onclick = async () => {
    try {
      await api(`/api/admin/clients/${c.id}`, { method: 'PATCH', body: { name: $('#ec-name').value, phone: $('#ec-phone').value, email: $('#ec-mail').value } });
      clientsCache = null; closeSheet(true); flash('נשמר'); pageClient(c.id);
    } catch (e) { $('#ecErr').textContent = e.message; $('#ecErr').hidden = false; }
  };
}

// ─── settings ────────────────────────────────────────────────────
async function pageSettings() {
  const band = bandHtml('הגדרות', 'זמינות, חסימות וסוגי טיפולים');
  frame('settings', loadingHtml, { band });
  let s, blocks, conn = null;
  try { [s, blocks] = await Promise.all([setup(true), api('/api/admin/blocks').then((r) => r.blocks)]); }
  catch (e) { return frame('settings', errHtml(e), { band }); }
  api('/api/admin/status').then((r) => { conn = r; drawConn(); }).catch(() => {});
  const hours = s.hours.map((h) => ({ ...h }));
  const types = s.treatments.map((t) => ({ ...t }));
  const fmt = (iso) => { const [y, m, d] = iso.split('-'); return `${+d}.${+m}.${y}`; };
  const blockLabel = (b) => b.from === b.to ? `${DAY_NAME[wd(b.from)]}, ${dmy(b.from).d} ב${MONTH[dmy(b.from).m - 1]} ${dmy(b.from).y}` : `${fmt(b.from)}–${fmt(b.to)}`;
  const blockSub = (b) => { const n = Math.round((Date.parse(b.to) - Date.parse(b.from)) / 864e5) + 1; return [b.reason, n > 1 ? `${n} ימים` : 'כל היום'].filter(Boolean).join(' · '); };
  frame('settings', `<main class="content tight narrow" style="gap:22px">
    <section class="panel" aria-labelledby="st-hours" style="gap:4px"><h2 id="st-hours">שעות פעילות</h2><p style="margin-bottom:6px">השעות שבהן אפשר לבקש תור באתר.</p>
      <div class="hours" id="hours"></div></section>
    <section class="panel" aria-labelledby="st-block"><div><h2 id="st-block">חסימת תאריכים</h2><p>ימים שבהם לא יוצגו שעות פנויות באתר.</p></div>
      <div id="blocks" style="display:flex;flex-direction:column;gap:12px"></div>
      <div class="newblock"><b style="color:var(--lagoon)">חסימה חדשה</b>
        <div class="grid2"><div class="field"><label for="bl-from">מתאריך</label><input id="bl-from" type="date"></div><div class="field"><label for="bl-to">עד תאריך</label><input id="bl-to" type="date"></div></div>
        <div class="field"><label for="bl-why">סיבה (לא חובה, רק את רואה)</label><input id="bl-why" type="text" placeholder="למשל: חופשה, סדנה"></div>
        <button type="button" class="btn out" style="min-height:48px" id="blAdd">${ic('plus', 'style="width:18px;height:18px;stroke-width:2.2"')}חסימת התאריכים</button></div></section>
    <section class="panel" aria-labelledby="st-types"><div><h2 id="st-types">סוגי טיפולים</h2><p>המשך קובע אילו שעות יוצגו, והמחיר נכנס לקבלה.</p></div>
      ${types.map((t, i) => `<div class="type"><div class="top"><b>${esc(t.name)}</b><span>${t.onSite ? (/זוג/.test(t.name) ? 'טיפול זוגי' : 'טיפול אישי') : 'לא בטופס באתר'}</span></div>
        <div class="grid2"><div class="field"><label for="ty-d${i}" style="font-size:.8125rem;font-weight:400;color:var(--muted)">משך</label><div class="unit"><input id="ty-d${i}" data-ty="${i}" data-k="minutes" type="text" inputmode="numeric" value="${esc(t.minutes ?? '')}" placeholder="—"><span>דקות</span></div></div>
          <div class="field"><label for="ty-p${i}" style="font-size:.8125rem;font-weight:400;color:var(--muted)">מחיר</label><div class="unit"><span>₪</span><input id="ty-p${i}" data-ty="${i}" data-k="price" type="text" inputmode="decimal" value="${esc(t.price ?? '')}" placeholder="—"></div></div></div></div>`).join('')}
    </section>
    <button type="button" class="btn save" id="saveAll">שמירת השינויים</button>
    <div class="conn" id="conn"></div>
    <button type="button" class="linkbtn" data-act="logout" style="align-self:center;color:var(--muted)">נעילה ויציאה מהמכשיר הזה</button>
  </main>`, { band, head: `<div class="ttl"><h1>הגדרות</h1><span>זמינות, חסימות וסוגי טיפולים</span></div>` });

  const dirty = () => { const b = $('#saveAll'); b.classList.remove('saved'); b.textContent = 'שמירת השינויים'; };
  const drawHours = () => {
    $('#hours').innerHTML = hours.map((h, i) => `<div class="hrow ${h.active ? '' : 'off'}"><span class="dn">${esc(h.day)}</span>
      <button type="button" class="switch" role="switch" aria-checked="${!!h.active}" aria-label="פתוח ביום ${esc(h.day)}" data-h="${i}"></button>
      ${h.active ? `<span class="times"><input dir="ltr" inputmode="numeric" aria-label="יום ${esc(h.day)}, משעה" data-hf="${i}" data-k="open" value="${esc(h.open)}"><span aria-hidden="true" class="muted">–</span><input dir="ltr" inputmode="numeric" aria-label="יום ${esc(h.day)}, עד שעה" data-hf="${i}" data-k="close" value="${esc(h.close)}"></span>` : '<span class="closed">סגור</span>'}</div>`).join('');
    $$('[data-h]').forEach((b) => b.onclick = () => { const h = hours[+b.dataset.h]; h.active = !h.active; if (h.active) { h.open = h.open || '09:00'; h.close = h.close || '19:30'; } dirty(); drawHours(); });
    $$('[data-hf]').forEach((inp) => inp.oninput = () => { hours[+inp.dataset.hf][inp.dataset.k] = inp.value.trim(); dirty(); });
  };
  const drawBlocks = () => {
    $('#blocks').innerHTML = blocks.map((b) => `<div class="block"><span class="bi">${ic('ban')}</span><span class="tx"><b>${esc(blockLabel(b))}</b><span>${esc(blockSub(b))}</span></span>
      <button type="button" data-rm="${b.id}" aria-label="הסרת החסימה: ${esc(blockLabel(b))}">${ic('x', 'style="width:18px;height:18px;stroke-width:2"')}</button></div>`).join('') || '<p class="hint" style="margin:0">אין תאריכים חסומים.</p>';
    $$('[data-rm]').forEach((b) => b.onclick = async () => {
      try { await api(`/api/admin/blocks/${b.dataset.rm}`, { method: 'DELETE' }); blocks = blocks.filter((x) => x.id !== b.dataset.rm); drawBlocks(); flash('החסימה הוסרה'); }
      catch (e) { flash(e.message, true); }
    });
  };
  function drawConn() {
    if (!conn) return;
    const line = (name, x) => `<span>${name}: <span class="${x.ok ? 'ok' : 'bad'}">${x.ok ? '✓' : '✕'} ${esc(x.message)}</span></span>`;
    $('#conn').innerHTML = line('Airtable', conn.airtable) + line('מורנינג', conn.morning) + line('יומן גוגל', conn.calendar);
  }
  drawHours(); drawBlocks(); drawConn();
  $$('[data-ty]').forEach((inp) => inp.oninput = () => { types[+inp.dataset.ty][inp.dataset.k] = inp.value.trim(); dirty(); });
  $('#blAdd').onclick = async () => {
    const from = $('#bl-from').value; const to = $('#bl-to').value || from; const reason = $('#bl-why').value.trim();
    if (!from) return flash('צריך תאריך התחלה', true);
    if (to < from) return flash('תאריך הסיום לפני תאריך ההתחלה', true);
    try { const r = await api('/api/admin/blocks', { method: 'POST', body: { from, to, reason } }); blocks = [...blocks, r.block].sort((x, y) => x.from.localeCompare(y.from)); drawBlocks(); $('#bl-from').value = $('#bl-to').value = $('#bl-why').value = ''; flash('התאריכים נחסמו'); }
    catch (e) { flash(e.message, true); }
  };
  $('#saveAll').onclick = async () => {
    const bad = hours.find((h) => h.active && !(/^([01]\d|2[0-3]):[0-5]\d$/.test(h.open) && /^([01]\d|2[0-3]):[0-5]\d$/.test(h.close) && h.open < h.close));
    if (bad) return flash(`השעות של יום ${bad.day} לא תקינות. כותבים למשל 09:00`, true);
    const btn = $('#saveAll'); btn.disabled = true;
    try {
      const orig = setupCache;
      for (const h of hours) {
        const o = orig.hours.find((x) => x.id === h.id);
        if (o.active !== h.active || o.open !== h.open || o.close !== h.close) await api(`/api/admin/hours/${h.id}`, { method: 'PATCH', body: { active: h.active, ...(h.active ? { open: h.open, close: h.close } : {}) } });
      }
      for (const t of types) {
        const o = orig.treatments.find((x) => x.id === t.id);
        const body = {};
        if (String(o.minutes ?? '') !== String(t.minutes ?? '')) body.minutes = Number(t.minutes);
        if (String(o.price ?? '') !== String(t.price ?? '')) body.price = t.price === '' ? null : Number(t.price);
        if (Object.keys(body).length) await api(`/api/admin/treatments/${t.id}`, { method: 'PATCH', body });
      }
      await setup(true);
      btn.classList.add('saved'); btn.innerHTML = `${ic('check', 'style="stroke-width:2.6"')}השינויים נשמרו`;
    } catch (e) { flash(e.message, true); }
    btn.disabled = false;
  };
}

// ─── demo data (only with ?demo) ─────────────────────────────────
let db = null;
const demoFails = { n: 0, until: 0 };
async function demo(path, opts) {
  if (!db) db = await fetch('sample.json').then((r) => r.json());
  await new Promise((r) => setTimeout(r, 120));
  const m = (opts.method || 'GET').toUpperCase();
  const [p, qs] = path.split('?'); const q = new URLSearchParams(qs || ''); const b = opts.body || {};
  const fail = (status, error, data = {}) => { const e = new Error(error); e.status = status; e.data = { error, ...data }; throw e; };
  const tr = (id) => db.treatments.find((t) => t.id === id);
  const cl = (id) => db.clients.find((c) => c.id === id);
  const view = (a) => { const c = cl(a.clientId) || {}; const t = tr(a.treatmentId) || {}; return { notes: '', clientNote: '', source: 'ידני', createdTime: a.start, receiptUrl: a.receiptNo ? '#' : '', ...a, clientName: c.name || '', clientPhone: c.phone || '', clientEmail: c.email || '', treatmentName: t.name || '', amount: a.amount ?? t.price ?? null }; };
  const cview = (c) => ({ ...c, apptIds: db.appointments.filter((a) => a.clientId === c.id).map((a) => a.id) });
  let mm;
  if (p === '/api/admin/login') {
    if (Date.now() < demoFails.until) fail(429, 'נעול', { lockedUntil: demoFails.until });
    if (b.pin === '2468') { demoFails.n = 0; return { token: 'demo' }; }
    demoFails.n++; if (demoFails.n >= 3) { demoFails.n = 0; demoFails.until = Date.now() + 15 * 6e4; fail(429, 'נעול', { lockedUntil: demoFails.until }); }
    fail(401, 'הקוד לא נכון', { attemptsLeft: 3 - demoFails.n });
  }
  if (p === '/api/admin/calendar') {
    const from = ilToIso(q.get('from'), '00:00'); const to = ilToIso(q.get('to'), '00:00');
    return { appointments: db.appointments.filter((a) => a.end > from && a.start < to).map(view), busy: [], calendarError: '',
      pending: db.appointments.filter((a) => a.status === 'בקשה חדשה' && a.start > new Date().toISOString()).map(view) };
  }
  if (p === '/api/admin/setup') return { treatments: db.treatments, hours: db.hours, settings: db.settings };
  if (p === '/api/admin/status') return { airtable: { ok: true, message: 'דוגמה' }, morning: { ok: true, message: 'דוגמה' }, calendar: { ok: true, message: 'דוגמה' } };
  if (p === '/api/admin/blocks') {
    if (m === 'POST') { const blk = { id: 'b' + Date.now(), from: b.from, to: b.to, reason: b.reason || '' }; db.blocks.push(blk); return { block: blk }; }
    return { blocks: db.blocks };
  }
  if ((mm = p.match(/^\/api\/admin\/blocks\/(.+)$/)) && m === 'DELETE') { db.blocks = db.blocks.filter((x) => x.id !== mm[1]); return { ok: true }; }
  if (p === '/api/admin/clients' && m === 'GET') return { clients: db.clients.map(cview) };
  if (p === '/api/admin/clients' && m === 'POST') {
    const d = String(b.phone).replace(/\D/g, '');
    const dup = db.clients.find((c) => c.phone === d); if (dup) fail(409, 'כבר יש איש קשר עם הטלפון הזה', { client: cview(dup) });
    const c = { id: 'c' + Date.now(), name: b.name || '', phone: d, email: '', status: 'ליד חדש', source: 'טלפון', notes: '', createdTime: new Date().toISOString() };
    db.clients.unshift(c); return { client: cview(c) };
  }
  if ((mm = p.match(/^\/api\/admin\/clients\/(.+)$/))) {
    const c = cl(mm[1]); if (!c) fail(404, 'לא נמצא');
    if (m === 'PATCH') Object.assign(c, b, b.phone ? { phone: String(b.phone).replace(/\D/g, '') } : {});
    return { client: cview(c), appointments: db.appointments.filter((a) => a.clientId === c.id).map(view) };
  }
  if (p === '/api/admin/appointments' && m === 'POST') {
    let c = b.clientId ? cl(b.clientId) : db.clients.find((x) => x.phone === String(b.phone).replace(/\D/g, ''));
    if (!c) { c = { id: 'c' + Date.now(), name: b.name || '', phone: String(b.phone).replace(/\D/g, ''), email: '', status: 'ליד חדש', source: 'טלפון', notes: '', createdTime: new Date().toISOString() }; db.clients.unshift(c); }
    const t = tr(b.treatmentId); const a = { id: 'a' + Date.now(), clientId: c.id, treatmentId: t.id, start: b.start, end: new Date(Date.parse(b.start) + t.minutes * 6e4).toISOString(), status: b.status || 'מאושר' };
    db.appointments.push(a); return { appointment: view(a) };
  }
  if ((mm = p.match(/^\/api\/admin\/appointments\/([^/]+)\/receipt$/))) {
    const a = db.appointments.find((x) => x.id === mm[1]);
    Object.assign(a, { receiptNo: String(1043 + Math.floor(Math.random() * 50)), amount: b.amount, payMethod: b.method, status: 'בוצע' });
    return { number: a.receiptNo, url: '', emailed: !!b.sendEmail };
  }
  if ((mm = p.match(/^\/api\/admin\/appointments\/(.+)$/))) {
    const a = db.appointments.find((x) => x.id === mm[1]); if (!a) fail(404, 'לא נמצא');
    if (m === 'PATCH') Object.assign(a, b);
    return { appointment: view(a) };
  }
  if ((mm = p.match(/^\/api\/admin\/(hours|treatments)\/(.+)$/))) {
    const list = mm[1] === 'hours' ? db.hours : db.treatments; Object.assign(list.find((x) => x.id === mm[2]), b); return { ok: true };
  }
  fail(404, 'לא קיים בדוגמה: ' + path);
}

// ─── start ───────────────────────────────────────────────────────
if (!DEMO) fetch(API + '/health').catch(() => {}); // wake the server early
route();
