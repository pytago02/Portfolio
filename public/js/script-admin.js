//<script>
// ─── STATE ───────────────────────────────────────────────────────
let token = localStorage.getItem('admin_token') || '';
let currentPage = 1;
let currentFilter = '';
let currentSearch = '';
let searchTimer;

const API = '';  // Same origin

// ─── AUTH ─────────────────────────────────────────────────────────
async function login() {
  const input = document.getElementById('token-input');
  token = input.value.trim();
  if (!token) return;

  try {
    const res = await fetch(`${API}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      localStorage.setItem('admin_token', token);
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      loadDashboard();
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  } catch {
    document.getElementById('login-error').style.display = 'block';
  }
}

function logout() {
  token = '';
  localStorage.removeItem('admin_token');
  location.reload();
}

document.getElementById('token-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});

// Auto-login if token saved
if (token) {
  fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => {
      if (r.ok) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadDashboard();
      } else {
        localStorage.removeItem('admin_token');
        token = '';
      }
    }).catch(() => {});
}

// ─── NAVIGATION ───────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${name}`)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.textContent.toLowerCase().includes(name === 'dashboard' ? 'dashboard' : 'tin nhắn'))
      n.classList.add('active');
  });
  if (name === 'contacts') loadContacts();
  if (name === 'dashboard') loadDashboard();
}

// ─── DASHBOARD ────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
    const { data } = await res.json();

    document.getElementById('s-unread').textContent     = data.contacts.unread;
    document.getElementById('s-total').textContent      = data.contacts.total;
    document.getElementById('s-views-today').textContent= data.views.today;
    document.getElementById('s-views-week').textContent = data.views.thisWeek;
    document.getElementById('last-updated').textContent = 'Cập nhật: ' + new Date().toLocaleTimeString('vi');

    // Badge
    const badge = document.getElementById('unread-badge');
    badge.textContent = data.contacts.unread;
    badge.style.display = data.contacts.unread > 0 ? 'inline' : 'none';

    // Bar chart
    renderChart(data.viewsChart);

    // Recent contacts
    renderRecentTable(data.recentContacts);
  } catch(e) {
    console.error(e);
  }
}

function renderChart(rows) {
  const chart = document.getElementById('bar-chart');
  if (!rows.length) { chart.innerHTML = '<div style="color:var(--ink4);font-size:12px">Chưa có dữ liệu</div>'; return; }
  const max = Math.max(...rows.map(r => r.views), 1);
  chart.innerHTML = rows.map(r => `
    <div class="bar-wrap" title="${r.date}: ${r.views} views">
      <div class="bar" style="height:${Math.max((r.views/max)*100, 2)}%"></div>
      <div class="bar-label">${r.date.slice(5)}</div>
    </div>
  `).join('');
}

function renderRecentTable(rows) {
  const el = document.getElementById('recent-table');
  if (!rows.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Chưa có tin nhắn nào</div></div>'; return; }
  el.innerHTML = `<table><thead><tr><th>Người gửi</th><th>Chủ đề</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>
    ${rows.map(r => `<tr onclick="viewContact(${r.id})" style="cursor:pointer">
      <td><div class="td-name">${esc(r.name)}</div><div class="td-email">${esc(r.email)}</div></td>
      <td style="font-size:13px;color:var(--ink2)">${esc(r.subject || '—')}</td>
      <td>${statusPill(r.status)}</td>
      <td class="td-date">${fmtDate(r.created_at)}</td>
    </tr>`).join('')}
  </tbody></table>`;
}

// ─── CONTACTS ─────────────────────────────────────────────────────
async function loadContacts() {
  const params = new URLSearchParams({
    page: currentPage, limit: 20,
    ...(currentFilter && { status: currentFilter }),
    ...(currentSearch && { q: currentSearch }),
  });

  const res = await fetch(`${API}/api/admin/contacts?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  const { data, pagination, unreadCount } = await res.json();

  document.getElementById('contacts-sub').textContent = `${pagination.total} tin nhắn · ${unreadCount} chưa đọc`;

  const badge = document.getElementById('unread-badge');
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? 'inline' : 'none';

  const tbody = document.getElementById('contacts-body');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Không có tin nhắn nào</div></div></td></tr>`;
  } else {
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>
          <div class="td-name">${esc(r.name)}</div>
          <div class="td-email">${esc(r.email)}</div>
        </td>
        <td style="font-size:13px;color:var(--ink2)">${esc(r.subject || '—')}</td>
        <td class="td-msg">${esc(r.message).slice(0, 100)}${r.message.length > 100 ? '...' : ''}</td>
        <td>${statusPill(r.status)}</td>
        <td class="td-date">${fmtDate(r.created_at)}</td>
        <td>
          <div class="action-btns">
            <button class="act-btn" onclick="viewContact(${r.id})">Xem</button>
            <button class="act-btn" onclick="updateStatus(${r.id},'replied')">✓ Trả lời</button>
            <button class="act-btn danger" onclick="deleteContact(${r.id})">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Pagination
  const pg = document.getElementById('pagination');
  if (pagination.pages <= 1) { pg.innerHTML = ''; return; }
  let html = `<button class="pg-btn" onclick="goPage(${currentPage-1})" ${currentPage<=1?'disabled':''}>‹</button>`;
  for (let i = 1; i <= pagination.pages; i++) {
    html += `<button class="pg-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="pg-btn" onclick="goPage(${currentPage+1})" ${currentPage>=pagination.pages?'disabled':''}>›</button>`;
  pg.innerHTML = html;
}

function goPage(p) { currentPage = p; loadContacts(); }

function setFilter(status) {
  currentFilter = status;
  currentPage = 1;
  document.querySelectorAll('.filter-btn[data-status]').forEach(b => {
    b.classList.toggle('active', b.dataset.status === status);
  });
  loadContacts();
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = document.getElementById('search-input').value;
    currentPage = 1;
    loadContacts();
  }, 300);
}

// ─── VIEW CONTACT ──────────────────────────────────────────────────
async function viewContact(id) {
  const res = await fetch(`${API}/api/admin/contacts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  const { data: r } = await res.json();

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-label">Từ</div>
    <div class="modal-val"><strong>${esc(r.name)}</strong> &lt;${esc(r.email)}&gt;</div>
    <div class="modal-label">Chủ đề</div>
    <div class="modal-val">${esc(r.subject || '(Không có chủ đề)')}</div>
    <div class="modal-label">Ngày gửi</div>
    <div class="modal-val">${fmtDate(r.created_at, true)}</div>
    <div class="modal-label">Nội dung</div>
    <div class="modal-message">${esc(r.message)}</div>
    <div class="modal-actions">
      <a class="modal-btn primary" href="mailto:${esc(r.email)}?subject=Re: ${esc(r.subject||'Portfolio Contact')}" onclick="updateStatus(${r.id},'replied')">
        ✉ Trả lời email
      </a>
      <button class="modal-btn" onclick="updateStatus(${r.id},'archived');closeModal()">Lưu trữ</button>
      <button class="modal-btn" onclick="deleteContact(${r.id});closeModal()" style="color:#dc2626">Xóa</button>
    </div>
  `;
  document.getElementById('modal').classList.add('open');
  loadContacts(); // refresh status
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal'))
    document.getElementById('modal').classList.remove('open');
}

// ─── ACTIONS ──────────────────────────────────────────────────────
async function updateStatus(id, status) {
  await fetch(`${API}/api/admin/contacts/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  showToast(`Đã cập nhật: ${status}`, 'success');
  loadContacts();
  loadDashboard();
}

async function deleteContact(id) {
  if (!confirm('Xóa tin nhắn này?')) return;
  await fetch(`${API}/api/admin/contacts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  showToast('Đã xóa tin nhắn', 'success');
  loadContacts();
  loadDashboard();
}

function exportCSV() {
  window.open(`${API}/api/admin/export?token=${token}`, '_blank');
  // Note: token in URL only for export; in production use a short-lived export token
  fetch(`${API}/api/admin/export`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `contacts_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    });
}

// ─── HELPERS ──────────────────────────────────────────────────────
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function statusPill(s) {
  const labels = { unread:'Mới', read:'Đã đọc', replied:'Đã trả lời', archived:'Lưu trữ' };
  return `<span class="status-pill status-${s}">${labels[s]||s}</span>`;
}

function fmtDate(str, full=false) {
  const d = new Date(str);
  if (full) return d.toLocaleString('vi-VN');
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return Math.floor(diff/60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff/3600) + ' giờ trước';
  return d.toLocaleDateString('vi-VN');
}

function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3000);
}
// </script>