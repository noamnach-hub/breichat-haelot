/* מסך הניהול של בריכת האלות.
 * כל הנתונים מגיעים מהשרת (breichat-haelot-backend ב-Render), שמדבר עם Airtable ועם מורנינג.
 * בדף הזה אין שום מפתח או קוד: הקוד בן 4 הספרות נבדק רק בשרת. */
'use strict';

const API = 'https://breichat-haelot-backend.onrender.com';
const TZ = 'Asia/Jerusalem';
const TOKEN_KEY = 'gpool_admin_token';
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const PAY = ['מזומן', 'ביט', 'פייבוקס', 'העברה בנקאית', 'אשראי'];
const CLIENT_STATUS = ['ליד חדש', 'בטיפול', 'לקוח', 'לא רלוונטי'];

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ─── time (always Israel time, whatever the device says) ──────────
function partsIL(d) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t).value;
  return { day: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` };
}
const dayIL = (d = new Date()) => partsIL(new Date(d)).day;
const timeIL = (d) => partsIL(new Date(d)).time;
const addDays = (day, n) => new Date(Date.parse(day + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const weekday = (day) => new Date(day + 'T12:00:00Z').getUTCDay();
const dm = (day) => { const [, m, d] = day.split('-'); return `${+d}.${+m}`; };
const dayLabel = (day) => `יום ${DAYS[weekday(day)]} ${dm(day)}`;
function offsetMin(d) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d);
  const g = (t) => +p.find((x) => x.type === t).value;
  return Math.round((Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - d.getTime()) / 6e4);
}
/** Israel wall time (YYYY-MM-DD + HH:MM) → ISO instant. */
function ilToIso(day, hhmm) {
  const [y, m, d] = day.split('-').map(Number); const [hh, mm] = hhmm.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let t = wall - offsetMin(new Date(wall)) * 6e4;
  t = wall - offsetMin(new Date(t)) * 6e4;
  return new Date(t).toISOString();
}
const sundayOf = (day) => addDays(day, -weekday(day));
const waLink = (phone) => { const d = String(phone || '').replace(/\D/g, ''); return d ? `https://wa.me/${d.startsWith('0') ? '972' + d.slice(1) : d}` : ''; };
const money = (n) => (n || n === 0) ? `${Number(n).toLocaleString('he-IL')} ₪` : '';

// ─── server ────────────────────────────────────────────────────────
let token = '';
try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* private mode */ }

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/api/admin/login') { logout(); throw new Error('צריך להיכנס מחדש'); }
  if (!res.ok) { const e = new Error(data.error || 'משהו השתבש'); e.status = res.status; e.data = data; throw e; }
  return data;
}

function toast(msg, bad = false) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 3200);
}

// ─── code screen ───────────────────────────────────────────────────
let pin = '';
function showLock(msg = '') {
  $('#app').hidden = true; $('#lock').hidden = false; $('#lockMsg').textContent = msg; pin = ''; drawDots();
}
function drawDots() { [...$('#dots').children].forEach((d, i) => d.classList.toggle('on', i < pin.length)); }
function logout() { token = ''; try { localStorage.removeItem(TOKEN_KEY); } catch {} closeSheet(); showLock(); }

$('#pad').addEventListener('click', (e) => {
  const k = e.target.closest('button')?.dataset.k; if (!k) return;
  if (k === 'del') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
  drawDots();
  if (pin.length === 4) tryPin();
});
document.addEventListener('keydown', (e) => {
  if ($('#lock').hidden) return;
  if (/^\d$/.test(e.key) && pin.length < 4) { pin += e.key; drawDots(); if (pin.length === 4) tryPin(); }
  if (e.key === 'Backspace') { pin = pin.slice(0, -1); drawDots(); }
});

async function tryPin() {
  const pad = $('#pad'); pad.setAttribute('aria-disabled', 'true');
  $('#lockMsg').textContent = 'בודקת…';
  try {
    const r = await api('/api/admin/login', { method: 'POST', body: { pin } });
    token = r.token; try { localStorage.setItem(TOKEN_KEY, token); } catch {}
    $('#lock').hidden = true; $('#app').hidden = false; go('calendar');
  } catch (e) {
    let msg = e.message;
    if (e.data?.attemptsLeft) msg += ` (נשארו ${e.data.attemptsLeft} ניסיונות)`;
    if (e.data?.lockedUntil) msg = `יותר מדי ניסיונות. אפשר לנסות שוב בשעה ${timeIL(e.data.lockedUntil)}`;
    $('#lockMsg').textContent = msg;
    $('#dots').classList.add('shake'); setTimeout(() => $('#dots').classList.remove('shake'), 400);
    pin = ''; drawDots();
  } finally { pad.removeAttribute('aria-disabled'); }
}

// ─── navigation ────────────────────────────────────────────────────
let current = 'calendar';
const TITLES = { calendar: 'יומן', clients: 'לידים ולקוחות', settings: 'הגדרות' };
$('.tabs').addEventListener('click', (e) => { const v = e.target.closest('button')?.dataset.view; if (v) go(v); });
$('#refreshBtn').addEventListener('click', () => go(current));
function go(view) {
  current = view;
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  $('#viewTitle').textContent = TITLES[view];
  ({ calendar: renderCalendar, clients: renderClients, settings: renderSettings })[view]();
}
const loading = () => { $('#view').innerHTML = '<p class="loading">טוענת…<br><small>בפעם הראשונה אחרי הפסקה זה יכול לקחת עד דקה</small></p>'; };
const failed = (e) => { $('#view').innerHTML = `<p class="err">${esc(e.message)}</p><button class="btn ghost" onclick="go(current)">לנסות שוב</button>`; };

// ─── calendar ──────────────────────────────────────────────────────
let weekStart = sundayOf(dayIL());
let treatmentsCache = null;
async function treatments() {
  if (!treatmentsCache) treatmentsCache = (await api('/api/admin/setup')).treatments;
  return treatmentsCache;
}

const statusChip = (s) => {
  const cls = { 'בקשה חדשה': 's-new', 'מאושר': 's-ok', 'בוצע': 's-done', 'נדחה': 's-off', 'בוטל': 's-off' }[s] || '';
  return `<span class="chip ${cls}">${esc(s)}</span>`;
};

async function renderCalendar() {
  loading();
  try {
    const to = addDays(weekStart, 7);
    const d = await api(`/api/admin/calendar?from=${weekStart}&to=${to}`);
    const today = dayIL();
    let html = '';
    if (d.pending.length) {
      html += `<div class="section-title"><h2>בקשות שמחכות לאישור (${d.pending.length})</h2></div>`;
      html += d.pending.map((a) => `
        <div class="card pending">
          <div class="row" style="justify-content:space-between">
            <div><div class="item-title">${esc(a.clientName || a.title)}</div>
            <div class="item-sub">${esc(a.treatmentName)} · ${dayLabel(dayIL(a.start))} · ${timeIL(a.start)}–${timeIL(a.end)}</div>
            ${a.clientNote ? `<div class="item-sub">"${esc(a.clientNote)}"</div>` : ''}</div>
          </div>
          <div class="actions">
            <button class="btn small" data-approve="${a.id}">אישור</button>
            <button class="btn small danger" data-decline="${a.id}">דחייה</button>
            ${a.clientPhone ? `<a class="btn small soft" href="${waLink(a.clientPhone)}" target="_blank" rel="noopener">וואטסאפ</a><a class="btn small soft" href="tel:${esc(a.clientPhone)}">חיוג</a>` : ''}
            <button class="btn small ghost" data-open="${a.id}">פרטים</button>
          </div>
        </div>`).join('');
    }
    html += `
      <div class="weeknav">
        <button class="btn small ghost" id="prevW">› שבוע קודם</button>
        <strong>${dm(weekStart)}–${dm(addDays(weekStart, 6))}</strong>
        <button class="btn small ghost" id="nextW">שבוע הבא ‹</button>
      </div>
      <div class="actions" style="margin-top:0">
        <button class="btn small soft" id="thisW">השבוע</button>
        <button class="btn small" id="newAppt">+ טיפול חדש</button>
      </div>`;
    if (d.calendarError) html += `<p class="err">היומן של גוגל לא נקרא כרגע: ${esc(d.calendarError)}</p>`;
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const appts = d.appointments.filter((a) => a.start && dayIL(a.start) === day).map((a) => ({ kind: 'a', t: a.start, a }));
      const busy = d.busy.filter((b) => dayIL(b.start) === day || (b.allDay && b.start <= ilToIso(day, '12:00') && b.end > ilToIso(day, '12:00'))).map((b) => ({ kind: 'b', t: b.start, b }));
      const items = [...appts, ...busy].sort((x, y) => x.t.localeCompare(y.t));
      html += `<div class="day ${day === today ? 'today' : ''}"><h3>${dayLabel(day)}</h3>`;
      if (!items.length) html += '<div class="empty">אין כלום ביומן</div>';
      for (const it of items) {
        if (it.kind === 'b') {
          const b = it.b;
          html += `<div class="slot busy"><div class="time">${b.allDay ? 'כל היום' : `${timeIL(b.start)}–${timeIL(b.end)}`}</div><div><div class="item-sub">תפוס ביומן גוגל</div>${b.title ? `<div>${esc(b.title)}</div>` : ''}</div></div>`;
        } else {
          const a = it.a;
          html += `<div class="slot click st-${esc(a.status).replace(/ /g, '-')}" data-open="${a.id}">
            <div class="time">${timeIL(a.start)}–${timeIL(a.end)}</div>
            <div style="flex:1"><div class="item-title">${esc(a.clientName || a.title)}</div><div class="item-sub">${esc(a.treatmentName)}</div></div>
            <div>${a.receiptNo ? '<span class="chip s-receipt">קבלה הופקה</span>' : statusChip(a.status)}</div></div>`;
        }
      }
      html += '</div>';
    }
    $('#view').innerHTML = html;
    $('#prevW').onclick = () => { weekStart = addDays(weekStart, -7); renderCalendar(); };
    $('#nextW').onclick = () => { weekStart = addDays(weekStart, 7); renderCalendar(); };
    $('#thisW').onclick = () => { weekStart = sundayOf(dayIL()); renderCalendar(); };
    $('#newAppt').onclick = () => newAppointment();
  } catch (e) { failed(e); }
}

$('#view').addEventListener('click', async (e) => {
  const t = e.target.closest('[data-approve],[data-decline],[data-open],[data-client]');
  if (!t) return;
  if (t.dataset.open) return openAppointment(t.dataset.open);
  if (t.dataset.client) return openClient(t.dataset.client);
  const id = t.dataset.approve || t.dataset.decline;
  const status = t.dataset.approve ? 'מאושר' : 'נדחה';
  if (status === 'נדחה' && !(await confirmBox('לדחות את הבקשה?', 'השעה תשתחרר באתר. כדאי לכתוב ללקוח שהבקשה לא אושרה.'))) return;
  t.disabled = true;
  try { await api(`/api/admin/appointments/${id}`, { method: 'PATCH', body: { status } }); toast(status === 'מאושר' ? 'הבקשה אושרה' : 'הבקשה נדחתה'); renderCalendar(); }
  catch (err) { toast(err.message, true); t.disabled = false; }
});

// ─── sheet helpers ─────────────────────────────────────────────────
function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').hidden = false; }
function closeSheet() { $('#sheet').hidden = true; $('#sheetBody').innerHTML = ''; }
$('#sheetClose').onclick = closeSheet;
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

function confirmBox(title, body, ok = 'כן', danger = true) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'sheet';
    wrap.innerHTML = `<div class="sheet-card"><h2>${esc(title)}</h2><p>${esc(body)}</p><div class="actions">
      <button class="btn ${danger ? 'danger' : ''}" data-r="1">${esc(ok)}</button><button class="btn ghost" data-r="0">ביטול</button></div></div>`;
    wrap.addEventListener('click', (e) => {
      const r = e.target.closest('[data-r]')?.dataset.r; if (r === undefined && e.target !== wrap) return;
      wrap.remove(); resolve(r === '1');
    });
    document.body.appendChild(wrap);
    wrap.querySelector('[data-r="0"]').focus();
  });
}

// ─── appointment card ──────────────────────────────────────────────
async function openAppointment(id) {
  openSheet('<p class="loading">טוענת…</p>');
  let a;
  try { a = (await api(`/api/admin/appointments/${id}`)).appointment; } catch (e) { openSheet(`<p class="err">${esc(e.message)}</p>`); return; }
  const day = a.start ? dayIL(a.start) : dayIL();
  const statusBtns = ['מאושר', 'בוצע', 'נדחה', 'בוטל'].filter((s) => s !== a.status)
    .map((s) => `<button class="btn small ${s === 'נדחה' || s === 'בוטל' ? 'danger' : 'ghost'}" data-st="${s}">${s === 'מאושר' ? 'אישור' : s}</button>`).join('');
  openSheet(`
    <h2>${esc(a.clientName || a.title)}</h2>
    <div class="row" style="margin:6px 0">${statusChip(a.status)}</div>
    <dl class="kv">
      <dt>מתי</dt><dd>${dayLabel(day)}, ${timeIL(a.start)}–${timeIL(a.end)}</dd>
      <dt>טיפול</dt><dd>${esc(a.treatmentName)}</dd>
      <dt>טלפון</dt><dd>${a.clientPhone ? `<a href="tel:${esc(a.clientPhone)}">${esc(a.clientPhone)}</a>` : '—'}</dd>
      <dt>מייל</dt><dd>${esc(a.clientEmail) || '—'}</dd>
      ${a.clientNote ? `<dt>מה כתבו בטופס</dt><dd>${esc(a.clientNote)}</dd>` : ''}
      <dt>מקור</dt><dd>${esc(a.source)}</dd>
    </dl>
    <div class="actions">
      ${a.clientPhone ? `<a class="btn small soft" href="${waLink(a.clientPhone)}" target="_blank" rel="noopener">וואטסאפ</a>` : ''}
      ${a.gcalLink ? `<a class="btn small soft" href="${esc(a.gcalLink)}" target="_blank" rel="noopener">הוספה ליומן גוגל</a>` : ''}
      ${a.clientId ? `<button class="btn small ghost" id="toClient">כרטיס הלקוח</button>` : ''}
    </div>
    <div class="actions">${statusBtns}</div>
    <div class="row" style="margin-top:8px">
      <label class="field"><span>תאריך</span><input type="date" id="aDay" value="${day}"></label>
      <label class="field"><span>שעה</span><input type="time" id="aTime" step="900" value="${a.start ? timeIL(a.start) : ''}"></label>
    </div>
    <label class="field"><span>הערות פנימיות</span><textarea id="aNotes">${esc(a.notes)}</textarea></label>
    <div class="actions"><button class="btn small ghost" id="aSave">שמירת שינויים</button></div>
    <div class="receipt-box" id="rBox"></div>`);
  $('#sheetBody').querySelectorAll('[data-st]').forEach((b) => b.onclick = async () => {
    const st = b.dataset.st;
    if ((st === 'נדחה' || st === 'בוטל') && !(await confirmBox(`לסמן "${st}"?`, 'השעה תשתחרר באתר.'))) return;
    try { await api(`/api/admin/appointments/${a.id}`, { method: 'PATCH', body: { status: st } }); toast('עודכן'); openAppointment(a.id); refreshBehind(); }
    catch (e) { toast(e.message, true); }
  });
  if (a.clientId) $('#toClient').onclick = () => openClient(a.clientId);
  $('#aSave').onclick = async () => {
    const body = { notes: $('#aNotes').value };
    const nd = $('#aDay').value, nt = $('#aTime').value;
    if (nd && nt && (nd !== day || nt !== timeIL(a.start))) body.start = ilToIso(nd, nt);
    try { await api(`/api/admin/appointments/${a.id}`, { method: 'PATCH', body }); toast('נשמר'); openAppointment(a.id); refreshBehind(); }
    catch (e) { toast(e.message, true); }
  };
  drawReceipt(a);
}

function drawReceipt(a) {
  const box = $('#rBox');
  if (a.receiptNo) {
    box.innerHTML = `<h3>קבלה מס׳ ${esc(a.receiptNo)}</h3>
      <p class="muted">${money(a.amount)} · ${esc(a.payMethod)}${a.receiptAt ? ` · הופקה ב-${dm(dayIL(a.receiptAt))}` : ''}</p>
      ${a.receiptUrl ? `<a class="btn small" href="${esc(a.receiptUrl)}" target="_blank" rel="noopener">פתיחת הקבלה (PDF)</a>` : ''}`;
    return;
  }
  box.innerHTML = `<h3>סיום טיפול והפקת קבלה</h3>
    <div class="row">
      <label class="field"><span>סכום (₪)</span><input type="number" inputmode="decimal" min="1" id="rAmount" value="${a.amount ?? ''}"></label>
      <label class="field"><span>אמצעי תשלום</span><select id="rMethod"><option value="">לבחור…</option>${PAY.map((p) => `<option ${p === a.payMethod ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>מייל לשליחת הקבלה (לא חובה)</span><input type="email" id="rEmail" value="${esc(a.clientEmail)}" placeholder="אם ריק, הקבלה לא תישלח במייל"></label>
    ${a.receiptError ? `<p class="err">בניסיון הקודם: ${esc(a.receiptError)}</p>` : ''}
    <div class="actions"><button class="btn" id="rIssue">הפקת קבלה במורנינג</button></div>`;
  $('#rIssue').onclick = async () => {
    const amount = Number($('#rAmount').value), method = $('#rMethod').value, email = $('#rEmail').value.trim();
    if (!(amount > 0)) return toast('צריך סכום', true);
    if (!method) return toast('צריך לבחור אמצעי תשלום', true);
    if (!(await confirmBox('להפיק קבלה?', `${money(amount)} ב${method}${email ? `, ותישלח ל-${email}` : ''}. אי אפשר לבטל קבלה אחרי שהופקה, רק להפיק מסמך ביטול במורנינג.`, 'להפיק', false))) return;
    const btn = $('#rIssue'); btn.disabled = true; btn.textContent = 'מפיקה…';
    try {
      const r = await api(`/api/admin/appointments/${a.id}/receipt`, { method: 'POST', body: { amount, method, email } });
      toast(`קבלה מס׳ ${r.number} הופקה${r.emailed ? ' ונשלחה במייל' : ''}`);
      openAppointment(a.id); refreshBehind();
    } catch (e) { toast(e.message, true); btn.disabled = false; btn.textContent = 'הפקת קבלה במורנינג'; }
  };
}

function refreshBehind() { if (current === 'calendar') renderCalendar(); else if (current === 'clients') renderClients(true); }

// ─── new appointment ───────────────────────────────────────────────
async function newAppointment(client) {
  openSheet('<p class="loading">טוענת…</p>');
  let list;
  try { list = await treatments(); } catch (e) { openSheet(`<p class="err">${esc(e.message)}</p>`); return; }
  const day = weekStart <= dayIL() && dayIL() < addDays(weekStart, 7) ? dayIL() : weekStart;
  openSheet(`
    <h2>טיפול חדש</h2>
    ${client ? `<p><b>${esc(client.name)}</b> · ${esc(client.phone)}</p>` : `
      <div class="row">
        <label class="field"><span>שם</span><input id="nName" autocomplete="off"></label>
        <label class="field"><span>טלפון</span><input id="nPhone" type="tel" inputmode="tel" autocomplete="off"></label>
      </div>
      <p class="muted" style="margin:0;font-size:.85rem">אם הטלפון כבר קיים, הטיפול יתווסף לאותו לקוח.</p>`}
    <label class="field"><span>טיפול</span><select id="nTreat">${list.map((t) => `<option value="${t.id}" data-min="${t.minutes || ''}">${esc(t.name)}${t.minutes ? ` (${t.minutes} דק׳)` : ''}</option>`).join('')}</select></label>
    <div class="row">
      <label class="field"><span>תאריך</span><input type="date" id="nDay" value="${day}"></label>
      <label class="field"><span>שעה</span><input type="time" id="nTime" step="900" value="10:00"></label>
    </div>
    <label class="field"><span>הערות פנימיות</span><textarea id="nNotes"></textarea></label>
    <div class="actions"><button class="btn" id="nSave">שמירה ביומן (מאושר)</button></div>`);
  $('#nSave').onclick = async () => {
    const body = { treatmentId: $('#nTreat').value, start: ilToIso($('#nDay').value, $('#nTime').value), notes: $('#nNotes').value, status: 'מאושר' };
    if (client) body.clientId = client.id; else { body.name = $('#nName').value.trim(); body.phone = $('#nPhone').value.trim(); }
    try { const r = await api('/api/admin/appointments', { method: 'POST', body }); toast('נשמר ביומן'); openAppointment(r.appointment.id); refreshBehind(); }
    catch (e) { toast(e.message, true); }
  };
}

// ─── clients ───────────────────────────────────────────────────────
let clientsCache = null; let clientFilter = 'הכול'; let clientSearch = '';
async function renderClients(fresh = false) {
  if (!clientsCache || fresh) {
    loading();
    try { clientsCache = (await api('/api/admin/clients')).clients; } catch (e) { failed(e); return; }
  }
  const counts = Object.fromEntries(CLIENT_STATUS.map((s) => [s, clientsCache.filter((c) => c.status === s).length]));
  $('#view').innerHTML = `
    <div class="card">
      <div class="item-title">הוספת ליד</div>
      <div class="row">
        <label class="field"><span>שם</span><input id="qName" autocomplete="off"></label>
        <label class="field"><span>טלפון</span><input id="qPhone" type="tel" inputmode="tel" autocomplete="off"></label>
      </div>
      <div class="actions" style="margin-top:0"><button class="btn small" id="qAdd">הוספה</button></div>
    </div>
    <div class="toolbar"><input id="cSearch" type="search" placeholder="חיפוש לפי שם או טלפון" value="${esc(clientSearch)}"></div>
    <div class="chips">${['הכול', ...CLIENT_STATUS].map((s) => `<button data-f="${s}" class="${s === clientFilter ? 'on' : ''}">${s}${s === 'הכול' ? ` (${clientsCache.length})` : ` (${counts[s]})`}</button>`).join('')}</div>
    <div id="cList"></div>`;
  drawClientList();
  $('#cSearch').oninput = (e) => { clientSearch = e.target.value; drawClientList(); };
  $('.chips').onclick = (e) => { const f = e.target.closest('[data-f]')?.dataset.f; if (!f) return; clientFilter = f; renderClients(); };
  $('#qAdd').onclick = async () => {
    const name = $('#qName').value.trim(), phone = $('#qPhone').value.trim();
    if (!phone) return toast('צריך טלפון', true);
    try { const r = await api('/api/admin/clients', { method: 'POST', body: { name, phone } }); toast('הליד נוסף'); clientsCache = null; await renderClients(true); openClient(r.client.id); }
    catch (e) { if (e.status === 409 && e.data?.client) { toast('הטלפון הזה כבר קיים'); openClient(e.data.client.id); } else toast(e.message, true); }
  };
}
function drawClientList() {
  const q = clientSearch.trim().replace(/[-\s]/g, '');
  const list = clientsCache.filter((c) => (clientFilter === 'הכול' || c.status === clientFilter)
    && (!q || String(c.name).includes(clientSearch.trim()) || String(c.phone).replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§')));
  $('#cList').innerHTML = list.length ? list.map((c) => `
    <div class="card click" data-client="${c.id}">
      <div class="row" style="justify-content:space-between;flex-wrap:nowrap">
        <div><div class="item-title">${esc(c.name || '(ללא שם)')}</div><div class="item-sub" dir="ltr" style="text-align:right">${esc(c.phone)}</div></div>
        <span class="chip ${c.status === 'ליד חדש' ? 's-new' : c.status === 'לקוח' ? 's-done' : c.status === 'לא רלוונטי' ? 's-off' : 's-ok'}">${esc(c.status || '—')}</span>
      </div>
    </div>`).join('') : '<p class="empty">אין תוצאות</p>';
}

async function openClient(id) {
  openSheet('<p class="loading">טוענת…</p>');
  let d;
  try { d = await api(`/api/admin/clients/${id}`); } catch (e) { openSheet(`<p class="err">${esc(e.message)}</p>`); return; }
  const c = d.client;
  openSheet(`
    <h2>${esc(c.name || '(ללא שם)')}</h2>
    <div class="actions">
      ${c.phone ? `<a class="btn small soft" href="tel:${esc(c.phone)}">חיוג</a><a class="btn small soft" href="${waLink(c.phone)}" target="_blank" rel="noopener">וואטסאפ</a>` : ''}
      <button class="btn small" id="cBook">קביעת טיפול</button>
    </div>
    <label class="field"><span>שם</span><input id="cName" value="${esc(c.name)}"></label>
    <div class="row">
      <label class="field"><span>טלפון</span><input id="cPhone" type="tel" value="${esc(c.phone)}"></label>
      <label class="field"><span>מייל</span><input id="cEmail" type="email" value="${esc(c.email)}"></label>
    </div>
    <div class="row">
      <label class="field"><span>סטטוס</span><select id="cStatus">${CLIENT_STATUS.map((s) => `<option ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label class="field"><span>מקור</span><input value="${esc(c.source)}" disabled></label>
    </div>
    <label class="field"><span>הערות</span><textarea id="cNotes">${esc(c.notes)}</textarea></label>
    <div class="actions"><button class="btn small ghost" id="cSave">שמירה</button></div>
    <div class="section-title"><h2>טיפולים (${d.appointments.length})</h2></div>
    ${d.appointments.length ? d.appointments.map((a) => `
      <div class="slot click" data-appt="${a.id}">
        <div class="time">${a.start ? dm(dayIL(a.start)) + ' ' + timeIL(a.start) : ''}</div>
        <div style="flex:1"><div>${esc(a.treatmentName)}</div><div class="item-sub">${a.receiptNo ? `קבלה ${esc(a.receiptNo)} · ${money(a.amount)}` : ''}</div></div>
        ${statusChip(a.status)}
      </div>`).join('') : '<p class="empty">עוד אין טיפולים</p>'}`);
  $('#sheetBody').querySelectorAll('[data-appt]').forEach((el) => el.onclick = () => openAppointment(el.dataset.appt));
  $('#cBook').onclick = () => newAppointment(c);
  $('#cSave').onclick = async () => {
    const body = { name: $('#cName').value, phone: $('#cPhone').value, email: $('#cEmail').value, status: $('#cStatus').value, notes: $('#cNotes').value };
    try { await api(`/api/admin/clients/${c.id}`, { method: 'PATCH', body }); toast('נשמר'); clientsCache = null; if (current === 'clients') renderClients(true); }
    catch (e) { toast(e.message, true); }
  };
}

// ─── settings ──────────────────────────────────────────────────────
async function renderSettings() {
  loading();
  try {
    const [s, st] = await Promise.all([api('/api/admin/setup'), api('/api/admin/status').catch(() => null)]);
    treatmentsCache = s.treatments;
    const line = (name, x) => x ? `<div class="status-line"><b>${name}</b><span class="${x.ok ? 'ok' : 'bad'}">${x.ok ? '✓' : '✕'} ${esc(x.message)}</span></div>` : '';
    $('#view').innerHTML = `
      <div class="card">${st ? line('Airtable', st.airtable) + line('מורנינג', st.morning) + line('יומן גוגל', st.calendar) : '<span class="muted">אין מידע על החיבורים</span>'}</div>
      <div class="section-title"><h2>סוגי טיפול</h2></div>
      <div class="card"><table class="grid"><tbody>${s.treatments.map((t) => `
        <tr data-t="${t.id}">
          <td>${esc(t.name)}</td>
          <td><label class="muted" style="font-size:.8rem">דקות<input type="number" min="15" step="15" data-k="minutes" value="${t.minutes ?? ''}"></label></td>
          <td><label class="muted" style="font-size:.8rem">מחיר ₪<input type="number" min="0" data-k="price" value="${t.price ?? ''}"></label></td>
          <td><label class="muted" style="font-size:.8rem;display:flex;flex-direction:column;align-items:center">באתר<input type="checkbox" data-k="onSite" ${t.onSite ? 'checked' : ''}></label></td>
        </tr>`).join('')}</tbody></table></div>
      <div class="section-title"><h2>שעות פעילות</h2></div>
      <div class="card"><table class="grid"><tbody>${s.hours.map((h) => `
        <tr data-h="${h.id}">
          <td><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-k="active" ${h.active ? 'checked' : ''}>${esc(h.day)}</label></td>
          <td><input type="time" step="900" data-k="open" value="${esc(h.open)}"></td>
          <td><input type="time" step="900" data-k="close" value="${esc(h.close)}"></td>
        </tr>`).join('')}</tbody></table>
        <p class="muted" style="font-size:.85rem">בטופס באתר יוצעו רק שעות בתוך הטווח, שלא תפוסות ביומן הגוגל ולא בטיפולים אחרים.</p></div>
      <div class="section-title"><h2>הגדרות</h2></div>
      <div class="card">${s.settings.map((x) => `
        <label class="field" data-s="${x.id}"><span>${esc(x.key)}</span><input value="${esc(x.value)}"><small class="muted">${esc(x.note)}</small></label>`).join('')}</div>
      <div class="actions"><button class="btn danger small" id="logout">יציאה מהמכשיר הזה</button></div>`;
    const save = async (path, body) => { try { await api(path, { method: 'PATCH', body }); toast('נשמר'); } catch (e) { toast(e.message, true); } };
    $('#view').querySelectorAll('[data-t] input').forEach((inp) => inp.onchange = () => {
      const k = inp.dataset.k; save(`/api/admin/treatments/${inp.closest('[data-t]').dataset.t}`, { [k]: k === 'onSite' ? inp.checked : inp.value }); treatmentsCache = null;
    });
    $('#view').querySelectorAll('[data-h] input').forEach((inp) => inp.onchange = () => {
      const k = inp.dataset.k; save(`/api/admin/hours/${inp.closest('[data-h]').dataset.h}`, { [k]: k === 'active' ? inp.checked : inp.value });
    });
    $('#view').querySelectorAll('[data-s] input').forEach((inp) => inp.onchange = () => save(`/api/admin/settings/${inp.closest('[data-s]').dataset.s}`, { value: inp.value }));
    $('#logout').onclick = logout;
  } catch (e) { failed(e); }
}

// ─── start ─────────────────────────────────────────────────────────
window.go = go;
if (token) { $('#app').hidden = false; go('calendar'); } else showLock();
// Wake the server early: on Render's free plan it sleeps when idle.
fetch(API + '/health').catch(() => {});
