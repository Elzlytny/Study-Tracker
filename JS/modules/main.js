/* =====================================================================
   MAIN.JS - Global Utilities, Storage, Theme
   Tech Professional Student Management System
   ===================================================================== */

/* =====================================================================
   LOCAL STORAGE MANAGEMENT
   ===================================================================== */

function getData() {
  return JSON.parse(localStorage.getItem("student_tracker_app")) || {
    materials: [],
    tracker: [],
    tasks: [],
    notes: []
  };
}

function saveData(data) {
  localStorage.setItem("student_tracker_app", JSON.stringify(data));
  /* Notify same-tab listeners (storage event only fires in other tabs) */
  window.dispatchEvent(new Event('studyDataChanged'));
}

/* =====================================================================
   THEME MANAGEMENT
   ===================================================================== */

function getTheme() {
  return localStorage.getItem('study_theme') || 'dark';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('study_theme', next);
  applyTheme(next);
}

function initTheme() {
  applyTheme(getTheme());
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.addEventListener('click', toggleTheme);
}

/* =====================================================================
   NOTIFICATION SYSTEM
   ===================================================================== */

function showNotification(message, type = 'info') {
  const prefix = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  alert(`${prefix[type] ?? 'ℹ️'} ${message}`);
}

function showSuccess(message) { showNotification(message, 'success'); }
function showError(message)   { showNotification(message, 'error');   }
function showWarning(message) { showNotification(message, 'warning'); }

/* =====================================================================
   VALIDATION HELPERS
   ===================================================================== */

function validateRequired(value, fieldName) {
  if (!value || !value.toString().trim()) {
    showError(`${fieldName} is required`);
    return false;
  }
  return true;
}


function validateRange(value, min, max) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

function validateURL(url) {
  try { new URL(url); return true; } catch { return false; }
}

/* =====================================================================
   CALCULATION HELPERS
   ===================================================================== */

function calculatePercentage(score, total) {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

function calculateAverage(entries) {
  if (!entries || entries.length === 0) return 0;

  const sum = entries.reduce((acc, entry) => {
    return acc + (entry.percentage || calculatePercentage(entry.score, entry.total));
  }, 0);

  return Number((sum / entries.length).toFixed(1));
}

function getPerformanceColor(percentage) {
  if (percentage >= 70) return 'success';
  if (percentage >= 50) return 'warning';
  return 'danger';
}

function getColorCode(percentage) {
  if (percentage >= 70) return '#10b981';
  if (percentage >= 50) return '#f59e0b';
  return '#ef4444';
}

/* =====================================================================
   DATE HELPERS
   ===================================================================== */

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function getDaysUntilDeadline(deadlineDate) {
  if (!deadlineDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineDate); deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

function isDeadlineApproaching(deadlineDate, daysThreshold = 3) {
  const daysLeft = getDaysUntilDeadline(deadlineDate);
  return daysLeft !== null && daysLeft >= 0 && daysLeft <= daysThreshold;
}

function isDeadlineOverdue(deadlineDate) {
  const daysLeft = getDaysUntilDeadline(deadlineDate);
  return daysLeft !== null && daysLeft < 0;
}

/* =====================================================================
   DOM HELPERS
   ===================================================================== */

function showSection(showId, hideIds = []) {
  hideIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(showId);
  if (target) target.style.display = 'block';
}

function clearInputs(inputs) {
  const ids = Array.isArray(inputs) ? inputs : [inputs];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
      el.value = '';
    }
  });
}

function focusInput(inputId) {
  const el = document.getElementById(inputId);
  if (el) el.focus();
}

function setButtonDisabled(buttonId, isDisabled = true) {
  const btn = document.getElementById(buttonId);
  if (btn) btn.disabled = isDisabled;
}

function setButtonLoading(buttonId, isLoading = true) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.disabled = isLoading;
  btn.classList.toggle('btn--loading', isLoading);
  btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
  btn.textContent = isLoading ? 'Loading...' : btn.dataset.originalText;
}

/* =====================================================================
   ARRAY HELPERS
   ===================================================================== */

function removeById(array, id) { return array.filter(item => item.id !== id); }
function findById(array, id)   { return array.find(item => item.id === id) || null; }

function updateById(array, id, updates) {
  return array.map(item => item.id === id ? { ...item, ...updates } : item);
}

function sortByDate(array, dateField = 'date', ascending = false) {
  return [...array].sort((a, b) => {
    const diff = new Date(a[dateField]) - new Date(b[dateField]);
    return ascending ? diff : -diff;
  });
}

function groupBy(array, property) {
  return array.reduce((groups, item) => {
    const key = item[property];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

/* =====================================================================
   CONFIRMATION DIALOGS
   ===================================================================== */

function confirmAction(message = 'Are you sure?') { return confirm(message); }
function confirmDelete(itemName = 'this item') {
  return confirm(`Delete ${itemName}? This action cannot be undone.`);
}

/* =====================================================================
   INITIALIZATION
   ===================================================================== */

function initializeApp() {
  console.log('🚀 Tech Professional Student Management System Initialized');
  initTheme();

  window.addEventListener('error', (e) => {
    console.error('Global Error:', e.error);
    showError('An unexpected error occurred. Please try again.');
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    showError('An error occurred. Please try again.');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
