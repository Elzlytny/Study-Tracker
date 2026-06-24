/* =====================================================================
   POMODORO.JS - Pomodoro Study Timer
   ===================================================================== */

/* =====================================================================
   CONSTANTS
   ===================================================================== */

const MODES = {
  work:       { label: 'Focus',        minutes: 25, color: '#ef4444' },
  shortBreak: { label: 'Short Break',  minutes: 5,  color: '#10b981' },
  longBreak:  { label: 'Long Break',   minutes: 15, color: '#00B4D8' }
};

const SESSIONS_BEFORE_LONG_BREAK = 4;

/* =====================================================================
   STATE
   ===================================================================== */

let currentMode    = 'work';
let timeRemaining  = MODES.work.minutes * 60;   /* seconds */
let timerInterval  = null;
let isRunning      = false;
let workSessionsDone = 0;
let totalSecondsInMode = MODES.work.minutes * 60;

/* =====================================================================
   DOM ELEMENTS
   ===================================================================== */

const timerDisplay    = document.getElementById('timer-display');
const timerMinutes    = document.getElementById('timer-minutes');
const timerSeconds    = document.getElementById('timer-seconds');
const sessionLabel    = document.getElementById('session-label');
const sessionCount    = document.getElementById('session-count');
const startPauseBtn   = document.getElementById('start-pause-btn');
const resetBtn        = document.getElementById('reset-btn');
const skipBtn         = document.getElementById('skip-btn');
const progressRing    = document.getElementById('progress-ring');
const modeButtons     = document.querySelectorAll('.pomo-mode-btn');
const statsTotal      = document.getElementById('stats-total');
const statsFocus      = document.getElementById('stats-focus');
const historyList     = document.getElementById('history-list');
const workMinInput    = document.getElementById('work-min-input');
const shortMinInput   = document.getElementById('short-min-input');
const longMinInput    = document.getElementById('long-min-input');
const applySettingsBtn = document.getElementById('apply-settings-btn');

/* =====================================================================
   RING PROGRESS
   ===================================================================== */

const RING_RADIUS = 90;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

if (progressRing) {
  progressRing.style.strokeDasharray = RING_CIRCUMFERENCE;
  progressRing.style.strokeDashoffset = '0';
}

function updateRing() {
  if (!progressRing) return;
  const progress = timeRemaining / totalSecondsInMode;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  progressRing.style.strokeDashoffset = offset;
  progressRing.style.stroke = MODES[currentMode].color;
}

/* =====================================================================
   DISPLAY
   ===================================================================== */

function updateDisplay() {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  if (timerMinutes) timerMinutes.textContent = String(mins).padStart(2, '0');
  if (timerSeconds) timerSeconds.textContent = String(secs).padStart(2, '0');
  if (sessionLabel) sessionLabel.textContent = MODES[currentMode].label;
  if (sessionCount) sessionCount.textContent = `Session ${workSessionsDone + (currentMode === 'work' ? 1 : 0)} • ${workSessionsDone} completed`;
  if (startPauseBtn) startPauseBtn.textContent = isRunning ? '⏸ Pause' : '▶ Start';
  document.title = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')} – ${MODES[currentMode].label} | StudyTracker`;
  updateRing();
}

/* =====================================================================
   AUDIO (Web Audio API — no file needed)
   ===================================================================== */

function playBeep(type = 'end') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = type === 'end' ? [880, 1100, 880] : [660];
    let t = ctx.currentTime;
    freqs.forEach(freq => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
      t += 0.45;
    });
  } catch (e) {
    /* silently ignore if AudioContext is unavailable */
  }
}

/* =====================================================================
   NOTIFICATION
   ===================================================================== */

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/Assets/img.webp' });
  }
}

/* =====================================================================
   TIMER LOGIC
   ===================================================================== */

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  requestNotificationPermission();
  timerInterval = setInterval(() => {
    timeRemaining--;
    if (timeRemaining <= 0) {
      timeRemaining = 0;
      updateDisplay();
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      onSessionComplete();
    } else {
      updateDisplay();
    }
  }, 1000);
  updateDisplay();
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  updateDisplay();
}

function resetTimer() {
  pauseTimer();
  timeRemaining = totalSecondsInMode;
  updateDisplay();
}

function skipToNext() {
  pauseTimer();
  advanceMode(false);
}

function onSessionComplete() {
  playBeep('end');

  if (currentMode === 'work') {
    workSessionsDone++;
    saveStats();
    sendNotification('🍅 Focus session done!', 'Time for a break. Well done!');
    showSuccess(`Focus session complete! ${workSessionsDone} sessions done today.`);
    offerTrackerLog();
    advanceMode(true);
  } else {
    sendNotification('☕ Break over!', 'Time to focus again.');
    showSuccess('Break complete! Ready to focus?');
    advanceMode(true);
  }
}

function advanceMode(autoSwitch) {
  if (currentMode === 'work') {
    if (workSessionsDone % SESSIONS_BEFORE_LONG_BREAK === 0) {
      switchMode('longBreak');
    } else {
      switchMode('shortBreak');
    }
  } else {
    switchMode('work');
  }
  if (autoSwitch) {
    setTimeout(startTimer, 1000);
  }
}

/* =====================================================================
   MODE SWITCHING
   ===================================================================== */

function switchMode(mode) {
  currentMode = mode;
  totalSecondsInMode = MODES[mode].minutes * 60;
  timeRemaining = totalSecondsInMode;
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;

  /* update active button */
  if (modeButtons) {
    modeButtons.forEach(btn => {
      btn.classList.toggle('pomo-mode-btn--active', btn.dataset.mode === mode);
    });
  }

  /* update ring color */
  if (progressRing) progressRing.style.stroke = MODES[mode].color;

  updateDisplay();
}

/* =====================================================================
   OFFER TRACKER LOG
   ===================================================================== */

function offerTrackerLog() {
  const modal = document.getElementById('tracker-log-modal');
  if (!modal) return;
  const data = getData();
  const subjectSelect = document.getElementById('pomo-subject-select');
  if (subjectSelect) {
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    data.materials.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      subjectSelect.appendChild(opt);
    });
  }
  modal.style.display = 'flex';
}

/* =====================================================================
   STATS & HISTORY
   ===================================================================== */

function getPomodoroData() {
  return JSON.parse(localStorage.getItem('pomodoro_data')) || { sessions: [] };
}

function savePomodoroData(data) {
  localStorage.setItem('pomodoro_data', JSON.stringify(data));
}

function saveStats() {
  const data = getPomodoroData();
  data.sessions.push({
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    mode: currentMode,
    minutes: MODES[currentMode].minutes,
    completedAt: new Date().toISOString()
  });
  savePomodoroData(data);
  renderStats();
}

function renderStats() {
  const data = getPomodoroData();
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = data.sessions.filter(s => s.date === today && s.mode === 'work');
  const totalFocusToday = todaySessions.reduce((sum, s) => sum + s.minutes, 0);

  if (statsTotal) statsTotal.textContent = `${todaySessions.length}`;
  if (statsFocus)  statsFocus.textContent  = `${totalFocusToday} min`;

  if (!historyList) return;
  const recent = [...data.sessions].reverse().slice(0, 10);
  historyList.innerHTML = recent.length === 0
    ? '<li class="pomo-history__empty">No sessions yet today</li>'
    : recent.map(s => `
        <li class="pomo-history__item">
          <span class="pomo-history__mode" style="color:${MODES[s.mode]?.color || '#999'}">${MODES[s.mode]?.label || s.mode}</span>
          <span class="pomo-history__mins">${s.minutes} min</span>
          <span class="pomo-history__date">${formatDate(s.date)}</span>
        </li>`).join('');
}

/* =====================================================================
   CUSTOM SETTINGS
   ===================================================================== */

function applyCustomSettings() {
  const work  = parseInt(workMinInput?.value, 10);
  const short = parseInt(shortMinInput?.value, 10);
  const lng   = parseInt(longMinInput?.value, 10);

  if (!Number.isInteger(work) || work < 1 || work > 90) {
    showError('Work duration must be 1–90 minutes'); return;
  }
  if (!Number.isInteger(short) || short < 1 || short > 30) {
    showError('Short break must be 1–30 minutes'); return;
  }
  if (!Number.isInteger(lng) || lng < 1 || lng > 60) {
    showError('Long break must be 1–60 minutes'); return;
  }

  MODES.work.minutes       = work;
  MODES.shortBreak.minutes = short;
  MODES.longBreak.minutes  = lng;

  switchMode(currentMode);   /* re-apply current mode with new duration */
  showSuccess('Settings applied!');
}

/* =====================================================================
   EVENT LISTENERS
   ===================================================================== */

if (startPauseBtn) {
  startPauseBtn.addEventListener('click', () => {
    if (isRunning) pauseTimer(); else startTimer();
  });
}

if (resetBtn) resetBtn.addEventListener('click', resetTimer);
if (skipBtn)  skipBtn.addEventListener('click',  skipToNext);

if (modeButtons) {
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.mode) switchMode(btn.dataset.mode);
    });
  });
}

if (applySettingsBtn) applySettingsBtn.addEventListener('click', applyCustomSettings);

/* Tracker log modal */
const closeModalBtn = document.getElementById('close-pomo-modal');
const logEntryBtn   = document.getElementById('log-pomo-entry');

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    const modal = document.getElementById('tracker-log-modal');
    if (modal) modal.style.display = 'none';
  });
}

if (logEntryBtn) {
  logEntryBtn.addEventListener('click', () => {
    const subjectSelect = document.getElementById('pomo-subject-select');
    const scoreInput    = document.getElementById('pomo-score');
    const totalInput    = document.getElementById('pomo-total');
    const lectureInput  = document.getElementById('pomo-lecture');
    const typeSelect    = document.getElementById('pomo-type');

    const subjectId = subjectSelect?.value;
    const score     = Number(scoreInput?.value);
    const total     = Number(totalInput?.value);
    const lecture   = Number(lectureInput?.value);
    const type      = typeSelect?.value || 'quiz';

    if (!subjectId)               { showError('Please select a subject'); return; }
    if (!score && score !== 0)    { showError('Enter a score'); return; }
    if (!total || total <= 0)     { showError('Enter a total score'); return; }
    if (score > total)            { showError('Score cannot exceed total'); return; }
    if (!lecture || lecture <= 0) { showError('Enter lecture number'); return; }

    const data = getData();
    data.tracker.push({
      id: Date.now(),
      subjectId: Number(subjectId),
      type,
      score,
      total,
      percentage: calculatePercentage(score, total),
      lecture,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });
    saveData(data);
    showSuccess('Score logged successfully!');

    const modal = document.getElementById('tracker-log-modal');
    if (modal) modal.style.display = 'none';
  });
}

/* keyboard shortcut: Space to start/pause */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    if (isRunning) pauseTimer(); else startTimer();
  }
});

/* =====================================================================
   INITIALIZATION
   ===================================================================== */

function initPomodoro() {
  console.log('🍅 Pomodoro module initialized');
  switchMode('work');
  renderStats();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPomodoro);
} else {
  initPomodoro();
}
