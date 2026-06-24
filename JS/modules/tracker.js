/* =====================================================================
   TRACKER.JS - Tracker & Score Management
   Tech Professional Student Management System
   ===================================================================== */

/* =====================================================================
   DOM ELEMENTS
   ===================================================================== */

const trackerForm = document.getElementById('tracker-form');
const trackerSubjectSelect = document.getElementById('tracker-subject');
const trackerTypeSelect = document.getElementById('tracker-type');
const trackerScoreInput = document.getElementById('tracker-score');
const trackerTotalInput = document.getElementById('tracker-total');
const trackerLectureInput = document.getElementById('tracker-lecture');
const trackerDateInput = document.getElementById('tracker-date');
const trackerListContainer = document.getElementById('tracker-list-container');
const exportCsvBtn = document.getElementById('export-csv-btn');

/* =====================================================================
   SUBJECT MANAGEMENT
   ===================================================================== */

function loadTrackerSubjects() {
  /* Guard: this element only exists on tracker.html */
  if (!trackerSubjectSelect) return;

  const data = getData();
  trackerSubjectSelect.innerHTML = '<option value="">Select Subject</option>';

  if (data.materials.length === 0) {
    trackerSubjectSelect.innerHTML += '<option disabled>No subjects found. Add subjects in Materials first.</option>';
    return;
  }

  data.materials.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject.id;
    option.textContent = subject.name;
    trackerSubjectSelect.appendChild(option);
  });
}

/* =====================================================================
   VALIDATION
   ===================================================================== */

function validateTrackerInputs() {
  if (!trackerSubjectSelect || !trackerSubjectSelect.value) {
    showError('Please select a subject');
    return false;
  }

  if (!trackerScoreInput || !trackerScoreInput.value || Number(trackerScoreInput.value) < 0) {
    showError('Enter a valid score');
    return false;
  }

  if (!trackerTotalInput || !trackerTotalInput.value || Number(trackerTotalInput.value) <= 0) {
    showError('Enter a valid total score');
    return false;
  }

  const score = Number(trackerScoreInput.value);
  const total = Number(trackerTotalInput.value);

  if (score > total) {
    showError('Score cannot exceed total');
    return false;
  }

  if (!trackerLectureInput || !trackerLectureInput.value) {
    showError('Enter lecture number');
    return false;
  }

  if (!trackerDateInput || !trackerDateInput.value) {
    showError('Select a date');
    return false;
  }

  return true;
}

/* =====================================================================
   ENTRY MANAGEMENT
   ===================================================================== */

function addTrackerEntry() {
  if (!validateTrackerInputs()) return;

  const data = getData();
  const score = Number(trackerScoreInput.value);
  const total = Number(trackerTotalInput.value);
  const percentage = calculatePercentage(score, total);

  const newEntry = {
    id: Date.now(),
    subjectId: Number(trackerSubjectSelect.value),
    type: trackerTypeSelect.value,
    score: score,
    total: total,
    percentage: percentage,
    lecture: Number(trackerLectureInput.value),
    date: trackerDateInput.value,
    createdAt: new Date().toISOString()
  };

  data.tracker.push(newEntry);
  saveData(data);

  showSuccess('Score recorded successfully');
  trackerForm.reset();
  renderTrackerEntries();
}

function getSubjectName(subjectId) {
  const data = getData();
  const subject = findById(data.materials, subjectId);
  return subject ? subject.name : 'Unknown Subject';
}

/**
 * Get entries by subject ID — used by dashboard.js
 */
function getTrackerEntriesBySubject(subjectId) {
  const data = getData();
  return data.tracker.filter(entry => entry.subjectId == subjectId);
}

/**
 * Calculate subject average — used by dashboard.js
 */
function getSubjectAverage(subjectId) {
  const entries = getTrackerEntriesBySubject(subjectId);
  if (entries.length === 0) return 0;

  const sum = entries.reduce((acc, entry) => acc + entry.percentage, 0);
  return Math.round(sum / entries.length);
}

function deleteTrackerEntry(entryId) {
  if (!confirmDelete('this entry')) return;

  const data = getData();
  data.tracker = removeById(data.tracker, entryId);
  saveData(data);

  showSuccess('Entry deleted');
  renderTrackerEntries();
}

function editTrackerEntry(entryId) {
  const data = getData();
  const entry = findById(data.tracker, entryId);

  if (!entry) return;

  const newScore = prompt('Enter new score', entry.score);
  if (newScore === null) return;

  const newTotal = prompt('Enter new total', entry.total);
  if (newTotal === null) return;

  if (!validateRange(Number(newScore), 0, Number(newTotal))) {
    showError('Invalid score or total');
    return;
  }

  entry.score = Number(newScore);
  entry.total = Number(newTotal);
  entry.percentage = calculatePercentage(entry.score, entry.total);

  saveData(data);
  showSuccess('Entry updated');
  renderTrackerEntries();
}

/* =====================================================================
   RENDERING
   ===================================================================== */

function renderTrackerEntries() {
  /* Guard: this element only exists on tracker.html */
  if (!trackerListContainer) return;

  const data = getData();
  trackerListContainer.innerHTML = '';

  if (data.tracker.length === 0) {
    trackerListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📊</div>
        <div class="empty-state__title">No Entries Yet</div>
        <div class="empty-state__description">Start tracking your scores to see your progress</div>
      </div>
    `;
    return;
  }

  const sortedEntries = sortByDate(data.tracker, 'date', false);

  sortedEntries.forEach(entry => {
    const card = createTrackerCard(entry);
    trackerListContainer.appendChild(card);
  });
}

function createTrackerCard(entry) {
  const card = document.createElement('div');
  card.className = 'tracker-entry';

  const subjectName = getSubjectName(entry.subjectId);
  const formattedDate = formatDate(entry.date);

  card.innerHTML = `
    <div class="tracker-entry__score-badge">
      <div class="tracker-entry__score-number">${entry.percentage}%</div>
      <div class="tracker-entry__score-total">${entry.score}/${entry.total}</div>
    </div>
    <div class="tracker-entry__details">
      <div class="tracker-entry__header">
        <h3 class="tracker-entry__subject">${subjectName}</h3>
        <span class="tracker-entry__type-badge tracker-entry__type-badge-${entry.type}">
          ${entry.type.toUpperCase()}
        </span>
      </div>
      <div class="tracker-entry__meta">
        <div class="tracker-entry__meta-item">
          <div class="tracker-entry__meta-label">Score</div>
          <div class="tracker-entry__meta-value">${entry.score}/${entry.total}</div>
        </div>
        <div class="tracker-entry__meta-item">
          <div class="tracker-entry__meta-label">Lecture</div>
          <div class="tracker-entry__meta-value">#${entry.lecture}</div>
        </div>
        <div class="tracker-entry__meta-item">
          <div class="tracker-entry__meta-label">Date</div>
          <div class="tracker-entry__meta-value">${formattedDate}</div>
        </div>
      </div>
    </div>
    <div class="tracker-entry__actions">
      <button class="tracker-entry__edit-btn" data-entry-id="${entry.id}">Edit</button>
      <button class="tracker-entry__delete-btn" data-entry-id="${entry.id}">Delete</button>
    </div>
  `;

  card.querySelector('.tracker-entry__edit-btn').addEventListener('click', () => {
    editTrackerEntry(entry.id);
  });

  card.querySelector('.tracker-entry__delete-btn').addEventListener('click', () => {
    deleteTrackerEntry(entry.id);
  });

  return card;
}

/* =====================================================================
   STATISTICS
   ===================================================================== */

function getTrackerStats() {
  const data = getData();

  if (data.tracker.length === 0) {
    return { totalEntries: 0, averageScore: 0, bestScore: 0, worstScore: 0 };
  }

  const entries = data.tracker;
  const scores = entries.map(e => e.percentage);

  return {
    totalEntries: entries.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b) / scores.length),
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores)
  };
}

/* =====================================================================
   EVENT LISTENERS
   ===================================================================== */

if (trackerForm) {
  trackerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTrackerEntry();
  });
}

/* Guard: these elements only exist on tracker.html */
if (trackerLectureInput) {
  trackerLectureInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && trackerDateInput) trackerDateInput.focus();
  });
}

if (trackerDateInput) {
  trackerDateInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && trackerForm) trackerForm.dispatchEvent(new Event('submit'));
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', exportTrackerAsCSV);
}

/* =====================================================================
   EXPORT FUNCTIONALITY
   ===================================================================== */

function exportTrackerAsCSV() {
  const data = getData();

  if (data.tracker.length === 0) {
    showError('No data to export');
    return;
  }

  let csv = 'Subject,Type,Score,Total,Percentage,Lecture,Date\n';

  data.tracker.forEach(entry => {
    const subject = getSubjectName(entry.subjectId);
    csv += `"${subject}","${entry.type}","${entry.score}","${entry.total}","${entry.percentage}%","${entry.lecture}","${entry.date}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tracker-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);

  showSuccess('Data exported successfully');
}

/* =====================================================================
   INITIALIZATION
   ===================================================================== */

function initTracker() {
  console.log('📊 Tracker module initialized');
  /* Guard: only run full init on tracker.html (where trackerListContainer exists) */
  if (!trackerListContainer) return;
  loadTrackerSubjects();
  renderTrackerEntries();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTracker);
} else {
  initTracker();
}
