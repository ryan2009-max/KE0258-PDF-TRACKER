const state = {
  route: location.hash || '#/login',
  currentUser: null,
  admins: [
    { id: 'a1', email: 'admin@example.com', name: 'Alice Admin', password: 'password123', disabled: false },
    { id: 'a2', email: 'bob@example.com', name: 'Bob Admin', password: 'secret456', disabled: true }
  ],
  students: [
    { id: 's1', student_number: 'KE0258001', student_name: 'John Peter', parent_name: 'Mary Peter', parent_phone: '0712 000 001', total_amount: 1200, academic_year: '2025' },
    { id: 's2', student_number: 'KE0258002', student_name: 'Lydia Kariuki', parent_name: 'Peter Kariuki', parent_phone: '0712 000 002', total_amount: 1500, academic_year: '2025' },
    { id: 's3', student_number: 'KE0258003', student_name: 'Samuel Otieno', parent_name: 'Rose Otieno', parent_phone: '0712 000 003', total_amount: 1000, academic_year: '2025' }
  ],
  studentCreds: [
    { student_number: 'KE0258001', password: '1234' },
    { student_number: 'KE0258002', password: '1234' },
    { student_number: 'KE0258003', password: '1234' }
  ],
  payments: [
    { payment_id: 'p1', student_id: 's1', amount_paid: 400, payment_date: new Date().toISOString(), receipt_number: 'RCPT-17000001', recorded_by: 'Alice Admin' }
  ],
  audit: []
}

function uniqReceipt() {
  return 'RCPT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
}

function todayISO(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function getStudentByNumber(sn) {
  return state.students.find(s => s.student_number === sn)
}
function getStudentById(id) {
  return state.students.find(s => s.id === id)
}
function getPaymentsForStudentId(id) {
  return state.payments.filter(p => p.student_id === id)
}
function sum(arr, f) {
  return arr.reduce((acc, x) => acc + (f ? f(x) : x), 0)
}
function formatCurrency(n) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
}
function formatDate(dt) {
  const d = new Date(dt)
  return d.toLocaleString()
}
function studentBalance(s) {
  const total = s.total_amount || 0
  const paid = sum(getPaymentsForStudentId(s.id), p => p.amount_paid)
  return total - paid
}

function requireAdmin() {
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    navigate('#/login')
    return false
  }
  return true
}
function navigate(hash) {
  if (location.hash !== hash) location.hash = hash
  else render()
  persistSession()
}

function templatePage(content, opts = {}) {
  const user = state.currentUser
  let links = []
  if (user && user.role === 'admin') {
    links = [
      { href: '#/dashboard', label: 'Dashboard' },
      { href: '#/search', label: 'Students' },
      { href: '#/reports', label: 'Reports' },
      { href: '#/history', label: 'History' }
    ]
  } else if (user && user.role === 'student') {
    links = [
      { href: '#/s/dashboard', label: 'Dashboard' },
      { href: '#/s/history', label: 'Payment History' },
      { href: '#/s/profile', label: 'Profile' }
    ]
  }
  const navLinks = links.map(l => `<a href="${l.href}" class="${location.hash === l.href ? 'active' : ''}">${l.label}</a>`).join('')
  const userChip = user ? `<span class="user-chip">${user.role === 'admin' ? 'Admin' : 'Student'} • ${user.name}</span>` : ''
  const logout = user ? `<a href="#/login" data-action="logout" class="btn ghost">Logout</a>` : ''
  const nav = user ? `
    <div class="nav">
      <div class="brand"><span class="brand-badge">P</span> PDF Payments</div>
      <div class="nav-links hide-on-mobile">${navLinks}</div>
      <div class="spacer"></div>
      ${userChip}
      ${logout}
    </div>
  ` : ''
  const bottomNav = user && user.role === 'student' ? `
    <div class="bottom-nav show-on-mobile">
      ${links.map(l => `<a href="${l.href}" class="${location.hash === l.href ? 'active' : ''}">${l.label}</a>`).join('')}
    </div>
  ` : ''
  return `
    ${nav}
    <div class="container">${content}</div>
    ${bottomNav}
  `
}

function renderLogin() {
  const mode = location.hash.includes('user') ? 'user' : 'admin'
  const content = `
    <div class="login panel">
      <div class="title">Sign in</div>
      <div class="row wrap" style="margin-bottom:12px">
        <div class="tabs">
          <div class="tab ${mode === 'admin' ? 'active' : ''}" data-mode="admin">Admin</div>
          <div class="tab ${mode === 'user' ? 'active' : ''}" data-mode="user">Student</div>
        </div>
        <span class="pill"><span style="width:8px;height:8px;border-radius:999px;background:#22c55e;display:inline-block"></span> UI-only, mock validation</span>
      </div>
      <div id="auth-error" class="error hidden"></div>
      <form id="login-form">
        ${mode === 'admin' ? `
          <div class="field">
            <label>Email</label>
            <input type="email" name="email" placeholder="admin@example.com" required>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••••••" required>
          </div>
        ` : `
          <div class="field">
            <label>Student Number</label>
            <input type="text" name="student_number" placeholder="KE0258001" required>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••" required>
          </div>
        `}
        <button class="btn" type="submit" style="width:100%">Sign in</button>
      </form>
      <div class="divider"></div>
      <div class="center muted">Future-ready for Supabase Authentication</div>
    </div>
  `
  return templatePage(content)
}

function renderDashboard() {
  if (!requireAdmin()) return ''
  const totalStudents = state.students.length
  const totalExpected = sum(state.students, s => s.total_amount)
  const today = todayISO()
  const collectedToday = sum(state.payments.filter(p => new Date(p.payment_date) >= new Date(today)), p => p.amount_paid)
  const outstanding = sum(state.students, s => Math.max(0, studentBalance(s)))
  const content = `
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px">
      <h2 style="margin:0">Dashboard</h2>
      <div class="row">
        <a class="btn" href="#/students/new">Add Student</a>
        <a class="btn" href="#/search">Find Student</a>
      </div>
    </div>
    <div class="cards">
      <div class="card"><div class="label">Total students</div><div class="value">${totalStudents}</div></div>
      <div class="card"><div class="label">Total PDF expected</div><div class="value warning">${formatCurrency(totalExpected)}</div></div>
      <div class="card"><div class="label">Collected today</div><div class="value success">${formatCurrency(collectedToday)}</div></div>
      <div class="card"><div class="label">Outstanding balance</div><div class="value danger">${formatCurrency(outstanding)}</div></div>
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="panel">
        <h2>Recent payments</h2>
        ${renderPaymentsTable(state.payments.slice().sort((a,b)=>new Date(b.payment_date)-new Date(a.payment_date)).slice(0,8))}
      </div>
      <div class="panel">
        <h2>Students with outstanding balance</h2>
        ${renderOutstandingTable()}
      </div>
    </div>
    <div class="panel" style="margin-top:16px">
      <h2>Students quick actions</h2>
      ${renderAllStudentsQuickTable()}
    </div>
  `
  return templatePage(content)
}

function renderAddStudent() {
  if (!requireAdmin()) return ''
  const content = `
    <div class="panel" style="max-width:720px;margin:0 auto">
      <h2>Add student</h2>
      <div id="add-error" class="error hidden"></div>
      <div id="add-success" class="success hidden"></div>
      <form id="add-student-form">
        <div class="field"><label>Student Number</label><input name="student_number" placeholder="KE0258004" required></div>
        <div class="field"><label>Student Name</label><input name="student_name" placeholder="Jane Doe" required></div>
        <div class="field"><label>Parent Name</label><input name="parent_name" placeholder="John Doe"></div>
        <div class="field"><label>Parent Phone</label><input name="parent_phone" placeholder="07xx xxx xxx"></div>
        <div class="field"><label>Academic Year</label><input name="academic_year" placeholder="2025"></div>
        <div class="field"><label>Total PDF Required</label><input type="number" name="total_amount" min="0" step="1" placeholder="0" required></div>
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn" type="submit">Save</button>
          <a class="btn ghost" href="#/dashboard">Cancel</a>
        </div>
      </form>
      <div class="subtle" style="margin-top:10px">Read-only demo: saves in temporary session data.</div>
    </div>
  `
  return templatePage(content)
}

function renderAddHistoryForStudent(sn) {
  if (!requireAdmin()) return ''
  const s = getStudentByNumber(sn)
  if (!s) return templatePage(`<div class="panel"><div class="error">Student not found</div></div>`)
  const content = `
    <div class="panel" style="max-width:720px;margin:0 auto">
      <h2>Add history record</h2>
      <div id="ah-error" class="error hidden"></div>
      <div id="ah-success" class="success hidden"></div>
      <form id="add-history-form" data-id="${s.id}">
        <div class="field-inline"><label>Student Number</label><div>${s.student_number}</div></div>
        <div class="field-inline"><label>Student Name</label><div>${s.student_name}</div></div>
        <div class="field"><label>Record type</label>
          <select name="kind">
            <option value="note" selected>Note</option>
            <option value="update">Update Info</option>
          </select>
        </div>
        <div class="field"><label>Details</label><textarea name="details" placeholder="Enter details (e.g., phone confirmed, document verified)"></textarea></div>
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn" type="submit">Save record</button>
          <a class="btn ghost" href="#/dashboard">Cancel</a>
        </div>
      </form>
      <div class="subtle" style="margin-top:10px">UI-only: logs to History with versioning.</div>
    </div>
  `
  return templatePage(content)
}

function renderPaymentsTable(list) {
  if (!list.length) return `<div class="subtle">No payments yet</div>`
  const rows = list.map(p => {
    const s = getStudentById(p.student_id)
    return `<tr>
      <td>${p.receipt_number}</td>
      <td>${s ? s.student_number : '-'}</td>
      <td>${s ? s.student_name : '-'}</td>
      <td>${formatCurrency(p.amount_paid)}</td>
      <td>${formatDate(p.payment_date)}</td>
      <td>${p.recorded_by}</td>
    </tr>`
  }).join('')
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Receipt</th><th>Student #</th><th>Name</th><th>Amount</th><th>Date</th><th>Recorded by</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function renderOutstandingTable() {
  const rows = state.students
    .map(s => ({ s, bal: studentBalance(s) }))
    .filter(x => x.bal > 0)
    .sort((a, b) => b.bal - a.bal)
    .slice(0, 8)
    .map(({ s, bal }) => `
      <tr>
        <td>${s.student_number}</td>
        <td>${s.student_name}</td>
        <td>${formatCurrency(bal)}</td>
        <td class="row" style="gap:6px">
          <a class="btn ghost" href="#/profile/${s.student_number}">Open</a>
          <a class="btn" href="#/students/${s.student_number}/history/new">Add History</a>
        </td>
      </tr>
    `).join('')
  if (!rows) return `<div class="subtle">All clear</div>`
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Student #</th><th>Name</th><th>Balance</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function addAuditLog({ entityType, entityId, action, snapshot, changes = [] }) {
  const user = state.currentUser ? state.currentUser.name : 'System'
  const existing = state.audit.filter(a => a.entityType === entityType && a.entityId === entityId)
  const version = existing.length + 1
  const id = 'h-' + cryptoRandomId().slice(0, 8)
  const entry = {
    id, entityType, entityId, action, version,
    user, timestamp: new Date().toISOString(),
    snapshot, changes
  }
  state.audit.push(entry)
  persistMock()
  return entry
}

function renderHistoryList() {
  if (!requireAdmin()) return ''
  const sp = new URLSearchParams(location.hash.split('?')[1] || '')
  const q = (sp.get('q') || '').toLowerCase()
  const type = sp.get('type') || ''
  const action = sp.get('action') || ''
  let list = state.audit.slice().sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))
  if (type) list = list.filter(x => x.entityType === type)
  if (action) list = list.filter(x => x.action === action)
  if (q) {
    list = list.filter(x => {
      const snap = x.snapshot || {}
      const hay = [
        x.entityType, x.action, x.user,
        snap.student_number, snap.student_name, snap.receipt_number
      ].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }
  const rows = list.map(x => {
    const isMod = x.action === 'update'
    const tag = isMod ? `<span class="pill">modified</span>` : ''
    const snap = x.snapshot || {}
    return `
      <tr>
        <td>v${x.version}</td>
        <td>${x.entityType}</td>
        <td>${snap.student_number || '-'}</td>
        <td>${snap.student_name || '-'}</td>
        <td>${x.action}</td>
        <td>${new Date(x.timestamp).toLocaleString()}</td>
        <td>${x.user}</td>
        <td>${tag}</td>
        <td><a class="btn ghost" href="#/history/${x.id}">Open</a></td>
      </tr>
    `
  }).join('')
  const content = `
    <div class="panel">
      <h2>History</h2>
      <div class="grid grid-3" style="margin-bottom:10px">
        <div class="field"><label>Search</label><input id="h-q" placeholder="Search by student, receipt, user" value="${q}"></div>
        <div class="field"><label>Type</label>
          <select id="h-type">
            <option value="" ${type===''?'selected':''}>All</option>
            <option value="student" ${type==='student'?'selected':''}>Student</option>
            <option value="payment" ${type==='payment'?'selected':''}>Payment</option>
          </select>
        </div>
        <div class="field"><label>Action</label>
          <select id="h-action">
            <option value="" ${action===''?'selected':''}>All</option>
            <option value="create" ${action==='create'?'selected':''}>Create</option>
            <option value="update" ${action==='update'?'selected':''}>Update</option>
            <option value="note" ${action==='note'?'selected':''}>Note</option>
          </select>
        </div>
      </div>
      <table>
        <thead><tr><th>Version</th><th>Entity</th><th>Student #</th><th>Name</th><th>Action</th><th>Timestamp</th><th>User</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
  return templatePage(content)
}

function renderHistoryDetail() {
  if (!requireAdmin()) return ''
  const id = location.hash.split('/')[2]
  const x = state.audit.find(a => a.id === id)
  if (!x) return templatePage(`<div class="panel"><div class="error">Entry not found</div></div>`)
  const snap = x.snapshot || {}
  let fields = ''
  if (x.entityType === 'student') {
    fields = `
      <div class="field-inline"><label>Student Number</label><div>${snap.student_number}</div></div>
      <div class="field-inline"><label>Student Name</label><div>${snap.student_name}</div></div>
      <div class="field-inline"><label>Parent Name</label><div>${snap.parent_name||''}</div></div>
      <div class="field-inline"><label>Parent Phone</label><div>${snap.parent_phone||''}</div></div>
      <div class="field-inline"><label>Academic Year</label><div>${snap.academic_year||''}</div></div>
      <div class="field-inline"><label>Total PDF Required</label><div>${formatCurrency(snap.total_amount||0)}</div></div>
    `
  } else {
    fields = `
      <div class="field-inline"><label>Receipt</label><div>${snap.receipt_number||''}</div></div>
      <div class="field-inline"><label>Student Number</label><div>${snap.student_number||''}</div></div>
      <div class="field-inline"><label>Amount</label><div>${formatCurrency(snap.amount_paid||0)}</div></div>
      <div class="field-inline"><label>Payment Date</label><div>${snap.payment_date?formatDate(snap.payment_date):''}</div></div>
      <div class="field-inline"><label>Recorded By</label><div>${snap.recorded_by||''}</div></div>
    `
  }
  const changes = x.changes && x.changes.length ? `
    <div class="panel" style="margin-top:12px">
      <h2>Modified fields</h2>
      <div class="subtle">${x.changes.join(', ')}</div>
    </div>` : ''
  const content = `
    <div class="panel" style="max-width:720px">
      <h2>History entry v${x.version}</h2>
      <div class="field-inline"><label>Entity</label><div>${x.entityType}</div></div>
      <div class="field-inline"><label>Action</label><div>${x.action}</div></div>
      <div class="field-inline"><label>Timestamp</label><div>${new Date(x.timestamp).toLocaleString()}</div></div>
      <div class="field-inline"><label>User</label><div>${x.user}</div></div>
      <div class="divider"></div>
      ${fields}
      <div class="row" style="margin-top:12px;gap:8px">
        <a class="btn" href="#/history/${x.id}/edit">Edit this version</a>
        <a class="btn ghost" href="#/history">Back</a>
      </div>
    </div>
    ${changes}
  `
  return templatePage(content)
}

function renderHistoryEdit() {
  if (!requireAdmin()) return ''
  const [, , id] = location.hash.split('/')
  const x = state.audit.find(a => a.id === id)
  if (!x) return templatePage(`<div class="panel"><div class="error">Entry not found</div></div>`)
  const s = x.snapshot
  let formFields = ''
  if (x.entityType === 'student') {
    formFields = `
      <div class="field"><label>Student Number</label><input name="student_number" value="${s.student_number}" required></div>
      <div class="field"><label>Student Name</label><input name="student_name" value="${s.student_name}" required></div>
      <div class="field"><label>Parent Name</label><input name="parent_name" value="${s.parent_name||''}"></div>
      <div class="field"><label>Parent Phone</label><input name="parent_phone" value="${s.parent_phone||''}"></div>
      <div class="field"><label>Academic Year</label><input name="academic_year" value="${s.academic_year||''}"></div>
      <div class="field"><label>Total PDF Required</label><input type="number" name="total_amount" value="${s.total_amount||0}" min="0" step="1" required></div>
    `
  } else {
    formFields = `
      <div class="field"><label>Receipt Number</label><input name="receipt_number" value="${s.receipt_number||''}" disabled></div>
      <div class="field"><label>Student Number</label><input name="student_number" value="${s.student_number||''}" disabled></div>
      <div class="field"><label>Amount Paid</label><input type="number" name="amount_paid" value="${s.amount_paid||0}" min="0" step="1"></div>
      <div class="field"><label>Recorded By</label><input name="recorded_by" value="${s.recorded_by||''}"></div>
    `
  }
  const content = `
    <div class="panel" style="max-width:720px">
      <h2>Edit history entry</h2>
      <div id="hist-edit-error" class="error hidden"></div>
      <form id="history-edit-form" data-id="${x.id}">
        ${formFields}
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn" type="submit">Save as new version</button>
          <a class="btn ghost" href="#/history/${x.id}">Cancel</a>
        </div>
      </form>
      <div class="subtle" style="margin-top:10px">UI-only: saves to demo data with versioning.</div>
    </div>
  `
  return templatePage(content)
}

function renderSearch() {
  if (!requireAdmin()) return ''
  const q = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || ''
  const lower = q.trim().toLowerCase()
  const results = state.students.filter(s =>
    !q ? true :
    s.student_number.toLowerCase().includes(lower) ||
    s.student_name.toLowerCase().includes(lower)
  )
  const items = results.map(s => `
    <tr>
      <td>${s.student_number}</td>
      <td>${s.student_name}</td>
      <td>${formatCurrency(studentBalance(s))}</td>
      <td><a class="btn ghost" href="#/profile/${s.student_number}">View</a></td>
    </tr>
  `).join('')
  const content = `
    <div class="panel">
      <h2>Student search</h2>
      <div class="field">
        <input type="text" id="search-q" placeholder="Search by student number or name" value="${q}">
      </div>
      <div class="subtle">Results: ${results.length}</div>
      <div style="margin-top:8px">
        <table>
          <thead><tr><th>Student #</th><th>Name</th><th>Balance</th><th></th></tr></thead>
          <tbody>${items}</tbody>
        </table>
      </div>
    </div>
  `
  return templatePage(content)
}

function renderProfile() {
  if (!requireAdmin()) return ''
  const parts = location.hash.split('/')
  const sn = parts[2]
  const s = getStudentByNumber(sn)
  if (!s) {
    return templatePage(`<div class="panel"><div class="error">Student not found</div></div>`)
  }
  const bal = studentBalance(s)
  const list = getPaymentsForStudentId(s.id).slice().sort((a,b)=>new Date(b.payment_date)-new Date(a.payment_date))
  const content = `
    <div class="grid grid-2">
      <div class="panel">
        <h2>Profile</h2>
        <div class="field-inline"><label>Student number</label><div>${s.student_number}</div></div>
        <div class="field-inline"><label>Student name</label><div>${s.student_name}</div></div>
        <div class="field-inline"><label>Parent name</label><div>${s.parent_name}</div></div>
        <div class="field-inline"><label>Parent phone</label><div>${s.parent_phone}</div></div>
        <div class="field-inline"><label>Total PDF required</label><div>${formatCurrency(s.total_amount)}</div></div>
        <div class="field-inline"><label>Remaining balance</label><div class="${bal>0?'value danger':''}">${formatCurrency(bal)}</div></div>
        <div class="row" style="margin-top:12px;gap:8px">
          <a class="btn" href="#/payment/${s.student_number}">Record Payment</a>
          <a class="btn ghost" href="#/profile/${s.student_number}#history">View Payment History</a>
          <button class="btn ghost" data-action="print-receipt-placeholder">Print Receipt</button>
        </div>
      </div>
      <div class="panel">
        <h2>Payment history</h2>
        ${renderPaymentsTable(list)}
      </div>
    </div>
  `
  return templatePage(content)
}

function renderRecordPayment() {
  if (!requireAdmin()) return ''
  const sn = location.hash.split('/')[2]
  const s = getStudentByNumber(sn)
  if (!s) {
    return templatePage(`<div class="panel"><div class="error">Student not found</div></div>`)
  }
  const bal = Math.max(0, studentBalance(s))
  const now = new Date().toISOString()
  const content = `
    <div class="panel" style="max-width:640px;margin:0 auto">
      <h2>Record payment</h2>
      <div id="pay-error" class="error hidden"></div>
      <div id="pay-success" class="success hidden"></div>
      <form id="payment-form">
        <div class="field-inline"><label>Student number</label><div>${s.student_number}</div></div>
        <div class="field"><label>Amount paid</label><input type="number" min="1" step="1" name="amount" placeholder="0" required></div>
        <div class="field-inline"><label>Payment date</label><div>${formatDate(now)}</div></div>
        <div class="field-inline"><label>Recorded by</label><div>${state.currentUser ? state.currentUser.name : '-'}</div></div>
        <div class="subtle">Remaining balance: ${formatCurrency(bal)}</div>
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn" type="submit">Save payment</button>
          <a class="btn ghost" href="#/profile/${s.student_number}">Cancel</a>
        </div>
      </form>
    </div>
  `
  return templatePage(content)
}

function renderReports() {
  if (!requireAdmin()) return ''
  const todayStart = new Date(todayISO())
  const todays = state.payments.filter(p => new Date(p.payment_date) >= todayStart)
  const outstanding = state.students.map(s => ({ s, bal: studentBalance(s) })).filter(x => x.bal > 0)
  const content = `
    <div class="grid grid-2">
      <div class="panel">
        <h2>Daily collection</h2>
        <div class="subtle">Total: ${formatCurrency(sum(todays, p => p.amount_paid))}</div>
        ${renderPaymentsTable(todays.sort((a,b)=>new Date(b.payment_date)-new Date(a.payment_date)))}
      </div>
      <div class="panel">
        <h2>Outstanding balances</h2>
        <div class="subtle">Students: ${outstanding.length}</div>
        <table>
          <thead><tr><th>Student #</th><th>Name</th><th>Balance</th><th>Actions</th></tr></thead>
          <tbody>
            ${outstanding.sort((a,b)=>b.bal-a.bal).map(({s,bal})=>`
              <tr>
                <td>${s.student_number}</td>
                <td>${s.student_name}</td>
                <td>${formatCurrency(bal)}</td>
                <td class="row" style="gap:6px">
                  <a class="btn ghost" href="#/profile/${s.student_number}">Open</a>
                  <a class="btn" href="#/students/${s.student_number}/history/new">Add History</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
  return templatePage(content)
}

function renderAllStudentsQuickTable() {
  const rows = state.students
    .slice()
    .sort((a,b)=>a.student_number.localeCompare(b.student_number))
    .map(s => `
      <tr>
        <td>${s.student_number}</td>
        <td>${s.student_name}</td>
        <td>${formatCurrency(Math.max(0, studentBalance(s)))}</td>
        <td class="row" style="gap:6px">
          <a class="btn ghost" href="#/profile/${s.student_number}">Open</a>
          <a class="btn" href="#/students/${s.student_number}/history/new">Add History</a>
        </td>
      </tr>
    `).join('')
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Student #</th><th>Name</th><th>Balance</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function render() {
  const route = location.hash || '#/login'
  state.route = route
  let html = ''
  if (route.startsWith('#/login')) html = renderLogin()
  else if (route.startsWith('#/dashboard')) html = renderDashboard()
  else if (route.startsWith('#/search')) html = renderSearch()
  else if (route.startsWith('#/profile/')) html = renderProfile()
  else if (route.startsWith('#/payment/')) html = renderRecordPayment()
  else if (route.startsWith('#/reports')) html = renderReports()
  else if (route.startsWith('#/s/dashboard')) html = renderStudentDashboard()
  else if (route.startsWith('#/s/history')) html = renderStudentHistory()
  else if (route.startsWith('#/s/profile')) html = renderStudentProfile()
  else if (route.startsWith('#/history/') && route.split('/').length===3) html = renderHistoryDetail()
  else if (route.startsWith('#/history/') && route.split('/').length===4) html = renderHistoryEdit()
  else if (route.startsWith('#/history')) html = renderHistoryList()
  else if (route.startsWith('#/students/new')) html = renderAddStudent()
  else if (route.startsWith('#/students/') && route.endsWith('/history/new')) {
    const sn = route.split('/')[2]
    html = renderAddHistoryForStudent(sn)
  }
  else html = renderLogin()
  document.getElementById('app').innerHTML = html
  wireEvents()
}

function wireEvents() {
  const app = document.getElementById('app')
  const tabs = app.querySelectorAll('.tab[data-mode]')
  tabs.forEach(t => t.addEventListener('click', e => {
    const mode = e.currentTarget.getAttribute('data-mode')
    navigate(`#/login/${mode}`)
  }))

  const logout = app.querySelector('[data-action="logout"]')
  if (logout) logout.addEventListener('click', e => {
    state.currentUser = null
    persistSession()
  })

  const loginForm = app.querySelector('#login-form')
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault()
      const data = Object.fromEntries(new FormData(loginForm).entries())
      const isAdmin = !location.hash.includes('user')
      const errorBox = document.getElementById('auth-error')
      errorBox.classList.add('hidden')
      if (isAdmin) {
        const user = state.admins.find(a => a.email.toLowerCase() === (data.email || '').toLowerCase())
        if (!user) {
          errorBox.textContent = 'User not found'
          errorBox.classList.remove('hidden')
          return
        }
        if (user.disabled) {
          errorBox.textContent = 'Account disabled'
          errorBox.classList.remove('hidden')
          return
        }
        if (user.password !== data.password) {
          errorBox.textContent = 'Invalid credentials'
          errorBox.classList.remove('hidden')
          return
        }
        state.currentUser = { role: 'admin', id: user.id, name: user.name, email: user.email }
        navigate('#/dashboard')
      } else {
        const cred = state.studentCreds.find(u => u.student_number === data.student_number)
        if (!cred) {
          errorBox.textContent = 'User not found'
          errorBox.classList.remove('hidden')
          return
        }
        if (cred.password !== data.password) {
          errorBox.textContent = 'Invalid credentials'
          errorBox.classList.remove('hidden')
          return
        }
        const s = getStudentByNumber(cred.student_number)
        state.currentUser = { role: 'student', id: s.id, name: s.student_name, student_number: s.student_number }
        navigate('#/s/dashboard')
      }
      persistSession()
    })
  }

  const searchQ = app.querySelector('#search-q')
  if (searchQ) {
    searchQ.addEventListener('input', e => {
      const val = e.currentTarget.value
      const base = '#/search'
      const q = val ? `${base}?q=${encodeURIComponent(val)}` : base
      navigate(q)
    })
  }

  const payForm = app.querySelector('#payment-form')
  if (payForm) {
    payForm.addEventListener('submit', e => {
      e.preventDefault()
      const sn = location.hash.split('/')[2]
      const s = getStudentByNumber(sn)
      const errorBox = document.getElementById('pay-error')
      const successBox = document.getElementById('pay-success')
      errorBox.classList.add('hidden')
      successBox.classList.add('hidden')
      const amount = parseInt(new FormData(payForm).get('amount'), 10)
      if (!amount || amount <= 0) {
        errorBox.textContent = 'Enter a valid amount'
        errorBox.classList.remove('hidden')
        return
      }
      const bal = Math.max(0, studentBalance(s))
      if (amount > bal && bal > 0) {
        errorBox.textContent = 'Amount exceeds remaining balance'
        errorBox.classList.remove('hidden')
        return
      }
      const p = {
        payment_id: cryptoRandomId(),
        student_id: s.id,
        amount_paid: amount,
        payment_date: new Date().toISOString(),
        receipt_number: uniqReceipt(),
        recorded_by: state.currentUser ? state.currentUser.name : 'Unknown'
      }
      state.payments.push(p)
      addAuditLog({
        entityType: 'payment',
        entityId: p.payment_id,
        action: 'create',
        snapshot: {
          receipt_number: p.receipt_number,
          student_number: s.student_number,
          amount_paid: p.amount_paid,
          payment_date: p.payment_date,
          recorded_by: p.recorded_by
        }
      })
      persistMock()
      successBox.textContent = `Payment saved. Receipt ${p.receipt_number}`
      successBox.classList.remove('hidden')
      setTimeout(() => navigate(`#/profile/${s.student_number}`), 600)
    })
  }

  const printBtn = app.querySelector('[data-action="print-receipt-placeholder"]')
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      alert('Select a payment from history to print a receipt after saving.')
    })
  }
  const histQ = app.querySelector('#h-q')
  const histType = app.querySelector('#h-type')
  const histAction = app.querySelector('#h-action')
  function updateHistoryFilters() {
    const q = histQ ? histQ.value : ''
    const t = histType ? histType.value : ''
    const a = histAction ? histAction.value : ''
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (t) qs.set('type', t)
    if (a) qs.set('action', a)
    const s = qs.toString()
    navigate(`#/history${s ? '?' + s : ''}`)
  }
  if (histQ) histQ.addEventListener('input', updateHistoryFilters)
  if (histType) histType.addEventListener('change', updateHistoryFilters)
  if (histAction) histAction.addEventListener('change', updateHistoryFilters)
  const histEditForm = app.querySelector('#history-edit-form')
  if (histEditForm) {
    histEditForm.addEventListener('submit', e => {
      e.preventDefault()
      const id = histEditForm.getAttribute('data-id')
      const entry = state.audit.find(a => a.id === id)
      const form = Object.fromEntries(new FormData(histEditForm).entries())
      const errorBox = document.getElementById('hist-edit-error')
      errorBox.classList.add('hidden')
      if (!entry) {
        errorBox.textContent = 'Entry not found.'
        errorBox.classList.remove('hidden')
        return
      }
      const prev = entry.snapshot
      let snapshot = { ...prev }
      if (entry.entityType === 'student') {
        const sn = (form.student_number || '').trim().toUpperCase()
        if (!sn) {
          errorBox.textContent = 'Student number is required.'
          errorBox.classList.remove('hidden')
          return
        }
        const existingOther = state.students.find(s => s.student_number === sn && s.id !== entry.entityId)
        if (existingOther) {
          errorBox.textContent = 'Another student already uses that number.'
          errorBox.classList.remove('hidden')
          return
        }
        snapshot = {
          student_number: sn,
          student_name: (form.student_name||'').trim(),
          parent_name: (form.parent_name||'').trim(),
          parent_phone: (form.parent_phone||'').trim(),
          academic_year: (form.academic_year||'').trim(),
          total_amount: parseInt(form.total_amount||'0', 10) || 0
        }
        const idx = state.students.findIndex(s => s.id === entry.entityId)
        if (idx >= 0) {
          state.students[idx] = { ...state.students[idx], ...snapshot }
        }
      } else {
        snapshot = {
          ...snapshot,
          amount_paid: parseInt(form.amount_paid || '0', 10) || snapshot.amount_paid || 0,
          recorded_by: (form.recorded_by || snapshot.recorded_by || '').trim()
        }
      }
      const changes = Object.keys(snapshot).filter(k => JSON.stringify(snapshot[k]) !== JSON.stringify(prev[k]))
      addAuditLog({
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: 'update',
        snapshot,
        changes
      })
      persistMock()
      navigate('#/history')
      persistSession()
    })
  }
  const addHistForm = app.querySelector('#add-history-form')
  if (addHistForm) {
    addHistForm.addEventListener('submit', e => {
      e.preventDefault()
      const id = addHistForm.getAttribute('data-id')
      const s = state.students.find(x => x.id === id)
      const form = Object.fromEntries(new FormData(addHistForm).entries())
      const errorBox = document.getElementById('ah-error')
      const successBox = document.getElementById('ah-success')
      errorBox.classList.add('hidden')
      successBox.classList.add('hidden')
      if (!s) {
        errorBox.textContent = 'Student not found.'
        errorBox.classList.remove('hidden')
        return
      }
      const note = (form.details || '').trim()
      const action = form.kind === 'update' ? 'update' : 'note'
      const snapshot = {
        student_number: s.student_number,
        student_name: s.student_name,
        parent_name: s.parent_name,
        parent_phone: s.parent_phone,
        academic_year: s.academic_year,
        total_amount: s.total_amount,
        note
      }
      const changes = note ? ['note'] : []
      addAuditLog({ entityType: 'student', entityId: s.id, action, snapshot, changes })
      persistMock()
      successBox.textContent = 'History record added.'
      successBox.classList.remove('hidden')
      setTimeout(() => { navigate('#/history'); persistSession() }, 700)
    })
  }
  const addForm = app.querySelector('#add-student-form')
  if (addForm) {
    addForm.addEventListener('submit', e => {
      e.preventDefault()
      const data = Object.fromEntries(new FormData(addForm).entries())
      const errorBox = document.getElementById('add-error')
      const successBox = document.getElementById('add-success')
      errorBox.classList.add('hidden')
      successBox.classList.add('hidden')
      const sn = (data.student_number || '').trim().toUpperCase()
      const name = (data.student_name || '').trim()
      const total = parseInt(data.total_amount, 10)
      if (!sn || !name || isNaN(total) || total < 0) {
        errorBox.textContent = 'Fill all required fields with valid values.'
        errorBox.classList.remove('hidden')
        return
      }
      if (state.students.find(s => s.student_number === sn)) {
        errorBox.textContent = 'Student number already exists.'
        errorBox.classList.remove('hidden')
        return
      }
      const id = 's' + cryptoRandomId().slice(0,6)
      state.students.push({
        id,
        student_number: sn,
        student_name: name,
        parent_name: data.parent_name || '',
        parent_phone: data.parent_phone || '',
        total_amount: total,
        academic_year: (data.academic_year || '').trim() || ''
      })
      addAuditLog({
        entityType: 'student',
        entityId: id,
        action: 'create',
        snapshot: {
          student_number: sn,
          student_name: name,
          parent_name: data.parent_name || '',
          parent_phone: data.parent_phone || '',
          total_amount: total,
          academic_year: (data.academic_year || '').trim() || ''
        }
      })
      persistMock()
      successBox.textContent = 'Student added successfully.'
      successBox.classList.remove('hidden')
      setTimeout(() => navigate(`#/profile/${sn}`), 700)
    })
  }
  const dlReceiptBtns = app.querySelectorAll('[data-action="download-receipt"]')
  dlReceiptBtns.forEach(btn => btn.addEventListener('click', () => {
    alert('Download will be available after backend integration.')
  }))
  const dlLatest = app.querySelector('[data-action="download-latest"]')
  if (dlLatest) dlLatest.addEventListener('click', () => alert('Download will be available later.'))
  const dlStmt = app.querySelector('[data-action="download-statement"]')
  if (dlStmt) dlStmt.addEventListener('click', () => alert('Download will be available later.'))

  bindGesturesAndShortcuts()
}

function cryptoRandomId() {
  try {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return Math.random().toString(36).slice(2)
  }
}

function bindGesturesAndShortcuts() {
  const isStudent = state.currentUser && state.currentUser.role === 'student'
  let startX = 0
  let startY = 0
  function onTouchStart(e) {
    if (!isStudent) return
    const t = e.touches && e.touches[0]
    if (!t) return
    startX = t.clientX
    startY = t.clientY
  }
  function onTouchEnd(e) {
    if (!isStudent) return
    const t = e.changedTouches && e.changedTouches[0]
    if (!t) return
    const dx = t.clientX - startX
    const dy = t.clientY - startY
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      const order = ['#/s/dashboard', '#/s/history', '#/s/profile']
      const idx = order.findIndex(x => location.hash.startsWith(x))
      if (dx < 0 && idx < order.length - 1) navigate(order[idx + 1])
      if (dx > 0 && idx > 0) navigate(order[idx - 1])
    }
  }
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchend', onTouchEnd)
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })

  function onKey(e) {
    const isAdmin = state.currentUser && state.currentUser.role === 'admin'
    if (isAdmin && e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const el = document.getElementById('search-q')
      if (el) {
        e.preventDefault()
        el.focus()
      }
    }
    if (isStudent && e.altKey) {
      if (e.key === '1') navigate('#/s/dashboard')
      if (e.key === '2') navigate('#/s/history')
      if (e.key === '3') navigate('#/s/profile')
    }
    if (isAdmin && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      navigate('#/students/new')
    }
  }
  window.removeEventListener('keydown', onKey)
  window.addEventListener('keydown', onKey)
}

function persistMock() {
  try {
    const data = {
      students: state.students,
      payments: state.payments,
      audit: state.audit
    }
    localStorage.setItem('pdfpay_data', JSON.stringify(data))
  } catch {}
}
function hydrateMock() {
  try {
    const raw = localStorage.getItem('pdfpay_data')
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data.students)) state.students = data.students
      if (Array.isArray(data.payments)) state.payments = data.payments
      if (Array.isArray(data.audit)) state.audit = data.audit
    } else {
      // Seed initial history from demo data
      state.students.forEach(s => addAuditLog({ entityType: 'student', entityId: s.id, action: 'create', snapshot: {
        student_number: s.student_number,
        student_name: s.student_name,
        parent_name: s.parent_name,
        parent_phone: s.parent_phone,
        total_amount: s.total_amount,
        academic_year: s.academic_year
      }}))
      state.payments.forEach(p => {
        const s = getStudentById(p.student_id)
        addAuditLog({ entityType: 'payment', entityId: p.payment_id, action: 'create', snapshot: {
          receipt_number: p.receipt_number,
          student_number: s ? s.student_number : '',
          amount_paid: p.amount_paid,
          payment_date: p.payment_date,
          recorded_by: p.recorded_by
        }})
      })
      persistMock()
    }
  } catch {}
}
function requireStudent() {
  if (!state.currentUser || state.currentUser.role !== 'student') {
    navigate('#/login/user')
    return false
  }
  return true
}

function renderStudentDashboard() {
  if (!requireStudent()) return ''
  const s = getStudentById(state.currentUser.id)
  const payments = getPaymentsForStudentId(s.id).slice().sort((a,b)=>new Date(b.payment_date)-new Date(a.payment_date))
  const total = s.total_amount || 0
  const paid = sum(payments, p => p.amount_paid)
  const bal = Math.max(0, total - paid)
  let status = { label: 'Not Paid', cls: 'red' }
  if (paid >= total && total > 0) status = { label: 'Paid in Full', cls: 'green' }
  else if (paid > 0 && paid < total) status = { label: 'Partial Payment', cls: 'orange' }
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
  const content = `
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px">
      <div>
        <div style="font-size:20px;font-weight:700">Welcome, ${s.student_name}</div>
        <div class="row" style="gap:8px;margin-top:6px">
          <div class="pill">Student Number: <strong>${s.student_number}</strong></div>
          <div class="pill">Academic Year: <strong>${s.academic_year || '-'}</strong></div>
          <div class="status"><span class="dot ${status.cls}"></span>${status.label}</div>
        </div>
      </div>
      <div><a class="btn ghost" href="#/login" data-action="logout">Logout</a></div>
    </div>
    <div class="cards">
      <div class="card"><div class="label">Total PDF Required</div><div class="value warning">${formatCurrency(total)}</div></div>
      <div class="card"><div class="label">Total Paid</div><div class="value success">${formatCurrency(paid)}</div></div>
      <div class="card"><div class="label">Remaining Balance</div><div class="value ${bal>0?'danger':'success'}">${formatCurrency(bal)}</div></div>
      <div class="card"><div class="label">Payment Status</div><div style="margin-top:8px" class="status"><span class="dot ${status.cls}"></span>${status.label}</div></div>
    </div>
    <div class="panel" style="margin-top:16px">
      <h2>Payment progress</h2>
      <div class="subtle" style="margin-bottom:6px">${pct}% paid</div>
      <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="panel">
        <h2>Recent payment activity</h2>
        ${payments.length ? `
          <table>
            <thead><tr><th>Receipt</th><th>Amount</th><th>Date</th><th>Recorded by</th><th></th></tr></thead>
            <tbody>
              ${payments.slice(0,5).map(p=>`
                <tr>
                  <td>${p.receipt_number}</td>
                  <td>${formatCurrency(p.amount_paid)}</td>
                  <td>${formatDate(p.payment_date)}</td>
                  <td>${p.recorded_by}</td>
                  <td><button class="btn ghost" data-action="download-receipt" data-r="${p.receipt_number}">Download</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top:10px"><a class="btn" href="#/s/history">View Full Payment History</a></div>
        ` : `<div class="subtle">No payments yet</div>`}
      </div>
      <div class="panel">
        <h2>Notice</h2>
        ${bal>0 ? `
          <div class="notice danger">You have an outstanding PDF balance of ${formatCurrency(bal)}.</div>
        ` : `
          <div class="notice success">Your PDF payments are fully completed. Thank you.</div>
        `}
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn" data-action="download-latest">Download Latest Receipt (PDF)</button>
          <button class="btn ghost" data-action="download-statement">Download Full Statement</button>
        </div>
        <div class="subtle" style="margin-top:10px">Auto logout after inactivity is enabled (placeholder).</div>
      </div>
    </div>
  `
  return templatePage(content)
}

function renderStudentHistory() {
  if (!requireStudent()) return ''
  const s = getStudentById(state.currentUser.id)
  const payments = getPaymentsForStudentId(s.id).slice().sort((a,b)=>new Date(b.payment_date)-new Date(a.payment_date))
  const content = `
    <div class="panel">
      <h2>Payment history</h2>
      <div class="grid grid-3" style="margin-bottom:10px">
        <div class="field"><label>Date from</label><input type="date" id="hist-from"></div>
        <div class="field"><label>Date to</label><input type="date" id="hist-to"></div>
        <div class="field"><label>Academic year</label><select id="hist-year"><option value="">All</option><option>${s.academic_year || '2025'}</option></select></div>
      </div>
      <table>
        <thead><tr><th>Receipt Number</th><th>Amount</th><th>Payment Date</th><th>Payment Time</th><th>Recorded By</th><th></th></tr></thead>
        <tbody>
          ${payments.map(p=>{
            const d=new Date(p.payment_date)
            const dateStr=d.toLocaleDateString()
            const timeStr=d.toLocaleTimeString()
            return `
              <tr>
                <td>${p.receipt_number}</td>
                <td>${formatCurrency(p.amount_paid)}</td>
                <td>${dateStr}</td>
                <td>${timeStr}</td>
                <td>${p.recorded_by}</td>
                <td><button class="btn ghost" data-action="download-receipt" data-r="${p.receipt_number}">Download</button></td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  `
  return templatePage(content)
}

function renderStudentProfile() {
  if (!requireStudent()) return ''
  const s = getStudentById(state.currentUser.id)
  const total = s.total_amount || 0
  const paid = sum(getPaymentsForStudentId(s.id), p => p.amount_paid)
  const bal = Math.max(0, total - paid)
  const content = `
    <div class="panel" style="max-width:720px">
      <h2>Profile</h2>
      <div class="field-inline"><label>Student Number</label><div>${s.student_number}</div></div>
      <div class="field-inline"><label>Student Name</label><div>${s.student_name}</div></div>
      <div class="field-inline"><label>Parent Name</label><div>${s.parent_name}</div></div>
      <div class="field-inline"><label>Parent Phone</label><div>${s.parent_phone}</div></div>
      <div class="field-inline"><label>Academic Year</label><div>${s.academic_year || '-'}</div></div>
      <div class="field-inline"><label>Total PDF Required</label><div>${formatCurrency(total)}</div></div>
      <div class="field-inline"><label>Total Paid</label><div>${formatCurrency(paid)}</div></div>
      <div class="field-inline"><label>Remaining Balance</label><div class="${bal>0?'value danger':''}">${formatCurrency(bal)}</div></div>
    </div>
  `
  return templatePage(content)
}

window.addEventListener('hashchange', render)
document.addEventListener('DOMContentLoaded', () => {
  restoreSession()
  if (!location.hash) navigate('#/login')
  hydrateMock()
  render()
})

function restoreSession() {
  try {
    const raw = localStorage.getItem('pdfpay_session')
    if (raw) {
      const sess = JSON.parse(raw)
      if (sess && sess.currentUser) state.currentUser = sess.currentUser
      if (sess && sess.lastRoute) location.hash = sess.lastRoute
    }
  } catch {}
}
function persistSession() {
  try {
    const data = { currentUser: state.currentUser, lastRoute: location.hash }
    localStorage.setItem('pdfpay_session', JSON.stringify(data))
  } catch {}
}
