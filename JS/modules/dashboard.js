/* =====================================================================
   DASHBOARD.JS - Dashboard Analytics & Performance Visualization
   Tech Professional Student Management System
   ===================================================================== */

/* =====================================================================
   DOM ELEMENTS
   ===================================================================== */

const overallPerformanceValue  = document.getElementById('overall-performance-value');
const overallPerformanceBar    = document.getElementById('overall-performance-bar');
const subjectsOverviewContainer = document.getElementById('subjects-overview-container');
const strongestSubjectName     = document.getElementById('strongest-subject-name');
const strongestSubjectPercent  = document.getElementById('strongest-subject-percent');
const weakestSubjectName       = document.getElementById('weakest-subject-name');
const weakestSubjectPercent    = document.getElementById('weakest-subject-percent');
const lectureAnalysisContainer = document.getElementById('lecture-analysis-container');

/* NOTE: chart canvas is re-queried inside createPerformanceChart() so
   it works even after the DOM is rebuilt from an empty state. */

/* =====================================================================
   CHART MANAGEMENT
   ===================================================================== */

let performanceChart = null;

function destroyPerformanceChart() {
  if (performanceChart) {
    performanceChart.destroy();
    performanceChart = null;
  }
}

function createPerformanceChart() {
  destroyPerformanceChart();

  /* Re-query canvas so it still works after DOM resets */
  const canvas = document.getElementById('subjects-chart');
  if (!canvas) return;

  const data   = getData();
  const labels = [];
  const values = [];
  const colors = [];

  data.materials.forEach(subject => {
    const entries = getTrackerEntriesBySubject(subject.id);
    const avg     = calculateAverage(entries);
    labels.push(subject.name);
    values.push(avg);
    colors.push(getColorCode(avg));
  });

  if (labels.length === 0) return;

  const ctx = canvas.getContext('2d');
  performanceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label:            'Performance',
        data:             values,
        backgroundColor:  colors,
        borderRadius:     8,
        borderSkipped:    false,
        borderWidth:      0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });
}

/* =====================================================================
   OVERALL PERFORMANCE
   ===================================================================== */

function getOverallPerformance() {
  const data = getData();
  if (data.tracker.length === 0) return 0;
  const sum = data.tracker.reduce((acc, e) => acc + e.percentage, 0);
  return Math.round(sum / data.tracker.length);
}

function renderOverallPerformance() {
  const overall = getOverallPerformance();
  if (overallPerformanceValue) overallPerformanceValue.textContent = `${overall}%`;
  if (overallPerformanceBar) {
    overallPerformanceBar.style.width     = `${overall}%`;
    overallPerformanceBar.className       = 'progress-bar__fill';
  }
}

/* =====================================================================
   SUBJECTS OVERVIEW
   ===================================================================== */

function renderSubjectsOverview() {
  const data = getData();
  if (!subjectsOverviewContainer) return;

  subjectsOverviewContainer.innerHTML = '';

  if (data.materials.length === 0) {
    subjectsOverviewContainer.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state__icon">📚</div>
        <div class="empty-state__title">No Subjects Yet</div>
        <div class="empty-state__description">Add subjects in Materials to see overview</div>
      </div>`;
    return;
  }

  data.materials.forEach(subject => {
    const entries = getTrackerEntriesBySubject(subject.id);
    const avg     = calculateAverage(entries);
    const color   = getColorCode(avg);

    const card = document.createElement('div');
    card.className = 'subject-overview-card';
    card.innerHTML = `
      <div class="subject-overview-card__name">${subject.name}</div>
      <div class="subject-overview-card__percentage" style="color:${color};">${avg}%</div>
      <div class="subject-overview-card__bar">
        <div class="subject-overview-card__bar-fill" style="width:${avg}%;background-color:${color};"></div>
      </div>`;
    subjectsOverviewContainer.appendChild(card);
  });
}

/* =====================================================================
   INSIGHTS
   ===================================================================== */

/* findWeakestSubject */
function findWeakestSubject() {
  const data = getData();
  let weakest = null, minAvg = Infinity;

  data.materials.forEach(s => {
    const entries = getTrackerEntriesBySubject(s.id);
    const avg = calculateAverage(entries);
    if (entries.length > 0 && avg < minAvg) {
      minAvg = avg;
      weakest = { name: s.name, average: avg };
    }
  });

  return weakest || { name: 'N/A', average: 0 };
}

/* findStrongestSubject */
function findStrongestSubject() {
  const data = getData();
  let strongest = null, maxAvg = -Infinity;

  data.materials.forEach(s => {
    const entries = getTrackerEntriesBySubject(s.id);
    const avg = calculateAverage(entries);
    if (entries.length > 0 && avg > maxAvg) {
      maxAvg = avg;
      strongest = { name: s.name, average: avg };
    }
  });

  return strongest || { name: 'N/A', average: 0 };
}

function renderInsights() {
  const strongest = findStrongestSubject();
  const weakest   = findWeakestSubject();

  if (strongestSubjectName)   strongestSubjectName.textContent   = strongest.name;
  if (strongestSubjectPercent) strongestSubjectPercent.textContent = `${Math.round(strongest.average)}%`;
  if (weakestSubjectName)     weakestSubjectName.textContent     = weakest.name;
  if (weakestSubjectPercent)  weakestSubjectPercent.textContent  = `${Math.round(weakest.average)}%`;
}

/* =====================================================================
   LECTURE ANALYSIS
   ===================================================================== */

function renderLectureAnalysis() {
  if (!lectureAnalysisContainer) return;

  const data = getData();
  const grouped = {};

  data.tracker.forEach(e => {
    // ✅ key بالـ subject + lecture مع بعض
    const subject = data.materials.find(s => s.id == e.subjectId);
    const subjectName = subject ? subject.name : 'Unknown';
    const key = `${e.subjectId}_${e.lecture}`;

    if (!grouped[key]) grouped[key] = { lecture: e.lecture, subjectName, entries: [] };
    grouped[key].entries.push(e);
  });

  lectureAnalysisContainer.innerHTML = '';
  const keys = Object.keys(grouped).sort((a, b) => {
    const [, numA] = a.split('_');
    const [, numB] = b.split('_');
    return Number(numB) - Number(numA);
  });

  if (keys.length === 0) {
    lectureAnalysisContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📝</div>
        <div class="empty-state__title">No Lecture Data</div>
        <div class="empty-state__description">Add tracking entries to see lecture analysis</div>
      </div>`;
    return;
  }

  keys.slice(0, 10).forEach(key => {
    const { lecture, subjectName, entries } = grouped[key];
    const avg   = calculateAverage(entries);
    const color = getColorCode(avg);

    const item = document.createElement('div');
    item.className = 'lecture-item';
    item.innerHTML = `
      <div class="lecture-item__number">${lecture}</div>
      <div class="lecture-item__details">
        <div class="lecture-item__title">Lecture #${lecture}</div>
        <div class="lecture-item__meta">${subjectName} • ${entries.length} entries</div>
      </div>
      <div class="lecture-item__score" style="color:${color};">${Math.round(avg)}%</div>`;
    lectureAnalysisContainer.appendChild(item);
  });
}

/* =====================================================================
   MAIN RENDER — always renders all sections (no DOM destruction)
   ===================================================================== */

function renderDashboard() {
  renderOverallPerformance();
  renderSubjectsOverview();
  renderInsights();
  renderLectureAnalysis();
  createPerformanceChart();
}

/* =====================================================================
   SUMMARY & TREND HELPERS (available for future use)
   ===================================================================== */

function getDashboardSummary() {
  const data = getData();
  const overall   = getOverallPerformance();
  const strongest = findStrongestSubject();
  const weakest   = findWeakestSubject();
  let quizzes = 0, sheets = 0;
  data.tracker.forEach(e => { if (e.type === 'quiz') quizzes++; else sheets++; });
  return { overall, subjects: data.materials.length, entries: data.tracker.length, quizzes, sheets, strongest, weakest };
}

function getPerformanceTrend(days = 30) {
  const data  = getData();
  const today = new Date();
  const trend = {};
  data.tracker.forEach(e => {
    const diff = Math.floor((today - new Date(e.date)) / (1000 * 60 * 60 * 24));
    if (diff <= days) {
      if (!trend[e.date]) trend[e.date] = [];
      trend[e.date].push(e.percentage);
    }
  });
  return Object.entries(trend).map(([date, pcts]) => ({
    date,
    average: Math.round(pcts.reduce((a, b) => a + b) / pcts.length),
    count: pcts.length
  }));
}

/* =====================================================================
   PDF EXPORT
   ===================================================================== */

function exportDashboardAsPDF() {
  window.print();
}

/* =====================================================================
   INITIALIZATION
   ===================================================================== */

function initDashboard() {
  console.log('📊 Dashboard module initialized');
  renderDashboard();

  const exportBtn = document.getElementById('export-pdf-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportDashboardAsPDF);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

/* =====================================================================
   LIVE UPDATE LISTENERS
   Same-tab updates: dispatched by saveData() in main.js
   Cross-tab updates: native storage event
   ===================================================================== */

window.addEventListener('studyDataChanged', () => {
  renderDashboard();
});

window.addEventListener('storage', (e) => {
  if (e.key === 'student_tracker_app') renderDashboard();
});
