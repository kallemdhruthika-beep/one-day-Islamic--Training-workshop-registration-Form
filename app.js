/* One-Day Islamic Workshop Registration — Frontend */

// Paste your deployed Google Apps Script Web App URL here.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyHKDxjtBL8wim1n3sVuHv6oDQkj7rweMwEcGf_HWHNl3RCgYfhB8AH4v9ojSooEg/exec';

async function callApi(action, payload) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('PASTE_YOUR') === 0) {
    throw new Error('The Apps Script Web App URL has not been set yet. Open app.js and set APPS_SCRIPT_URL.');
  }
  const body = Object.assign({ action: action }, payload);
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Network error (HTTP ' + response.status + ')');
  return response.json();
}

const views = {
  register: document.getElementById('viewRegister'),
  success: document.getElementById('viewSuccess'),
  adminLogin: document.getElementById('viewAdminLogin'),
  adminDashboard: document.getElementById('viewAdminDashboard')
};

function showView(name) {
  Object.keys(views).forEach(function (key) { views[key].classList.toggle('hidden', key !== name); });
  document.getElementById('navHome').classList.toggle('active', name === 'register' || name === 'success');
  document.getElementById('navAdmin').classList.toggle('active', name === 'adminLogin' || name === 'adminDashboard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('navHome').addEventListener('click', function () { showView('register'); });
document.getElementById('navAdmin').addEventListener('click', function () {
  if (sessionStorage.getItem('sanaAdminToken')) { showView('adminDashboard'); loadStudents(); }
  else showView('adminLogin');
});

const registrationForm = document.getElementById('registrationForm');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

const validators = {
  studentName: function (v) { return v.trim().length >= 3 ? '' : 'Enter the student name.'; },
  studentMobile: function (v) { return /^[0-9]{10}$/.test(v.trim()) ? '' : 'Enter a valid 10-digit student mobile number.'; },
  qualification: function (v) { return v ? '' : 'Select School or College.'; },
  collegeLevel: function (v) {
    const qualification = registrationForm.elements.qualification.value;
    return qualification === 'College' && !v ? 'Select the college qualification.' : '';
  },
  motherName: function (v) { return v.trim().length >= 3 ? '' : 'Enter the mother name.'; },
  fatherName: function (v) { return v.trim().length >= 3 ? '' : 'Enter the father name.'; },
  parentMobile: function (v) { return /^[0-9]{10}$/.test(v.trim()) ? '' : 'Enter a valid 10-digit parent mobile number.'; },
  address: function (v) { return v.trim().length >= 5 ? '' : 'Enter the full address.'; },
  village: function (v) { return v.trim().length >= 2 ? '' : 'Enter the village.'; },
  constituency: function (v) { return v ? '' : 'Select a constituency.'; },
  quranArabic: function (v) { return v ? '' : "Select Yes or No."; },
  quranSuras: function (v) { return v ? '' : "Select how many Qur'an Surahs you can remember."; }
};

function showFieldError(fieldName, message) {
  const input = registrationForm.elements[fieldName];
  const errorEl = registrationForm.querySelector('.error-msg[data-for="' + fieldName + '"]');
  if (input && input.classList) input.classList.toggle('invalid', !!message);
  if (input && input.length) {
    Array.from(input).forEach(function (radio) { radio.classList.toggle('invalid', !!message); });
  }
  if (errorEl) errorEl.textContent = message;
}
function validateField(fieldName) {
  const input = registrationForm.elements[fieldName];
  if (!input || !validators[fieldName]) return true;
  const value = input.length ? input.value : input.value;
  const message = validators[fieldName](value);
  showFieldError(fieldName, message);
  return message === '';
}

Object.keys(validators).forEach(function (fieldName) {
  const input = registrationForm.elements[fieldName];
  if (input && input.length) {
    Array.from(input).forEach(function (radio) { radio.addEventListener('change', function () { validateField(fieldName); }); });
  } else if (input) {
    input.addEventListener('blur', function () { validateField(fieldName); });
  }
});
['studentMobile', 'parentMobile'].forEach(function (fieldName) {
  registrationForm.elements[fieldName].addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
});

const qualificationSelect = document.getElementById('qualification');
const collegeLevelField = document.getElementById('collegeLevelField');
const collegeLevelSelect = document.getElementById('collegeLevel');
qualificationSelect.addEventListener('change', function () {
  const isCollege = qualificationSelect.value === 'College';
  collegeLevelField.classList.toggle('hidden', !isCollege);
  collegeLevelSelect.required = isCollege;
  if (!isCollege) {
    collegeLevelSelect.value = '';
    showFieldError('collegeLevel', '');
  }
  validateField('qualification');
});

registrationForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  let isValid = true;
  Object.keys(validators).forEach(function (fieldName) { if (!validateField(fieldName)) isValid = false; });
  if (!isValid) { formStatus.textContent = 'Please fix the highlighted fields before submitting.'; formStatus.classList.remove('ok'); return; }

  const quranArabic = registrationForm.elements.quranArabic.value;
  const data = {
    studentName: registrationForm.elements.studentName.value.trim(),
    studentMobile: registrationForm.elements.studentMobile.value.trim(),
    qualification: registrationForm.elements.qualification.value,
    collegeLevel: registrationForm.elements.collegeLevel.value,
    motherName: registrationForm.elements.motherName.value.trim(),
    fatherName: registrationForm.elements.fatherName.value.trim(),
    parentMobile: registrationForm.elements.parentMobile.value.trim(),
    address: registrationForm.elements.address.value.trim(),
    village: registrationForm.elements.village.value.trim(),
    constituency: registrationForm.elements.constituency.value,
    quranArabic: quranArabic,
    quranSuras: registrationForm.elements.quranSuras.value
  };

  submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; formStatus.textContent = '';
  try {
    const result = await callApi('register', { data: data });
    if (result.success) {
      document.getElementById('sName').textContent = data.studentName;
      document.getElementById('sRegId').textContent = result.registrationId;
      document.getElementById('sMobile').textContent = data.studentMobile;
      document.getElementById('sQualification').textContent = data.qualification + (data.collegeLevel ? ' - ' + data.collegeLevel : '');
      document.getElementById('sConstituency').textContent = data.constituency;
      document.getElementById('sDate').textContent = result.registrationDate;
      registrationForm.reset();
      collegeLevelField.classList.add('hidden');
      collegeLevelSelect.required = false;
      Object.keys(validators).forEach(function (fieldName) { showFieldError(fieldName, ''); });
      showView('success');
    } else {
      formStatus.textContent = result.message || 'Registration failed. Please try again.';
      formStatus.classList.remove('ok');
    }
  } catch (err) {
    formStatus.textContent = err.message || 'Could not reach the server. Please try again.';
    formStatus.classList.remove('ok');
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = 'Register for workshop';
  }
});

document.getElementById('printBtn').addEventListener('click', function () { window.print(); });
document.getElementById('newRegBtn').addEventListener('click', function () { showView('register'); });

const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginStatus = document.getElementById('adminLoginStatus');
adminLoginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  if (!username || !password) { adminLoginStatus.textContent = 'Enter both username and password.'; return; }
  adminLoginBtn.disabled = true; adminLoginBtn.textContent = 'Logging in…'; adminLoginStatus.textContent = '';
  try {
    const result = await callApi('adminLogin', { username: username, password: password });
    if (result.success) { sessionStorage.setItem('sanaAdminToken', result.token); adminLoginForm.reset(); showView('adminDashboard'); loadStudents(); }
    else adminLoginStatus.textContent = result.message || 'Login failed.';
  } catch (err) { adminLoginStatus.textContent = err.message || 'Could not reach the server.'; }
  finally { adminLoginBtn.disabled = false; adminLoginBtn.textContent = 'Log in'; }
});
document.getElementById('logoutBtn').addEventListener('click', function () { sessionStorage.removeItem('sanaAdminToken'); showView('register'); });

let allStudents = [];
async function loadStudents() {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading registrations…</td></tr>';
  const token = sessionStorage.getItem('sanaAdminToken');
  if (!token) { showView('adminLogin'); return; }
  try {
    const result = await callApi('getStudents', { token: token });
    if (!result.success) {
      if (result.message && result.message.toLowerCase().indexOf('session') !== -1) { sessionStorage.removeItem('sanaAdminToken'); showView('adminLogin'); adminLoginStatus.textContent = result.message; return; }
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">' + escapeHtml(result.message || 'Could not load data.') + '</td></tr>'; return;
    }
    allStudents = result.students || [];
    populateFilterOptions(allStudents); updateStats(allStudents); renderStudentsTable();
  } catch (err) { tbody.innerHTML = '<tr><td colspan="8" class="table-empty">' + escapeHtml(err.message || 'Network error.') + '</td></tr>'; }
}
function populateFilterOptions(students) {
  const select = document.getElementById('filterQualification'); const current = select.value;
  const options = Array.from(new Set(students.map(function (s) { return s.qualification; }).filter(Boolean))).sort();
  select.innerHTML = '<option value="">All</option>' + options.map(function (x) { return '<option value="' + escapeAttr(x) + '">' + escapeHtml(x) + '</option>'; }).join('');
  select.value = current;
}
function updateStats(students) {
  document.getElementById('statTotal').textContent = students.length;
  const todayStr = formatDateOnly(new Date());
  document.getElementById('statToday').textContent = students.filter(function (s) { return String(s.registrationDate || '').indexOf(todayStr) === 0; }).length;
  let latest = '—';
  if (students.length) { const sorted = students.slice().sort(function (a,b) { return parseRegDate(b.registrationDate) - parseRegDate(a.registrationDate); }); latest = sorted[0].registrationId; }
  document.getElementById('statLatest').textContent = latest;
}
function formatDateOnly(d) { return String(d.getDate()).padStart(2,'0') + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + d.getFullYear(); }
function parseRegDate(str) { if (!str) return 0; const parts = String(str).split(/[\s:-]/); if (parts.length < 3) return 0; const [dd,mm,yyyy,HH,mi,ss] = parts; return new Date(yyyy, mm-1, dd, HH||0, mi||0, ss||0).getTime(); }
function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  const regId = document.getElementById('searchRegId').value.trim().toLowerCase();
  const name = document.getElementById('searchName').value.trim().toLowerCase();
  const mobile = document.getElementById('searchMobile').value.trim();
  const qualification = document.getElementById('filterQualification').value;
  const sortOrder = document.getElementById('sortOrder').value;
  let filtered = allStudents.filter(function (s) {
    if (regId && String(s.registrationId).toLowerCase().indexOf(regId) === -1) return false;
    if (name && String(s.studentName).toLowerCase().indexOf(name) === -1) return false;
    if (mobile && String(s.studentMobile).indexOf(mobile) === -1) return false;
    if (qualification && s.qualification !== qualification) return false;
    return true;
  });
  filtered.sort(function (a,b) { const diff = parseRegDate(a.registrationDate) - parseRegDate(b.registrationDate); return sortOrder === 'asc' ? diff : -diff; });
  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No registrations match these filters.</td></tr>'; return; }
  tbody.innerHTML = filtered.map(function (s) {
    return '<tr><td>' + escapeHtml(s.registrationId) + '</td><td>' + escapeHtml(s.studentName) + '</td><td>' + escapeHtml(s.studentMobile) + '</td><td>' + escapeHtml(s.qualification + (s.collegeLevel ? ' - ' + s.collegeLevel : '')) + '</td><td>' + escapeHtml(s.village) + '</td><td>' + escapeHtml(s.constituency) + '</td><td>' + escapeHtml(s.registrationDate) + '</td><td><span class="status-pill">' + escapeHtml(s.status || 'Confirmed') + '</span></td></tr>';
  }).join('');
}
['searchRegId','searchName','searchMobile'].forEach(function (id) { document.getElementById(id).addEventListener('input', renderStudentsTable); });
['filterQualification','sortOrder'].forEach(function (id) { document.getElementById(id).addEventListener('change', renderStudentsTable); });
document.getElementById('refreshBtn').addEventListener('click', loadStudents);
function escapeHtml(str) { return String(str == null ? '' : str).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function escapeAttr(str) { return escapeHtml(str); }
document.getElementById('year').textContent = new Date().getFullYear();
showView('register');