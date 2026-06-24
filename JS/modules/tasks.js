/* =====================================================================
   TASKS.JS - Task Management & Deadline Tracking
   Tech Professional Student Management System
   ===================================================================== */

/* =====================================================================
   DOM ELEMENTS
   ===================================================================== */

const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDateInput = document.getElementById('task-date');
const taskPrioritySelect = document.getElementById('task-priority');
const tasksListContainer = document.getElementById('tasks-list-container');
const filterButtons = document.querySelectorAll('.filter-group__btn');

/* =====================================================================
   STATE
   ===================================================================== */

let currentTaskFilter = 'all';

/* =====================================================================
   TASK MANAGEMENT
   ===================================================================== */

/**
 * Add new task
 * @param {string} title - Task title
 * @param {string} date - Task deadline date
 * @param {string} priority - Task priority (low, medium, high)
 */
function addTask(title, date, priority) {
  if (!validateRequired(title, 'Task title')) return;
  
  const data = getData();
  
  const newTask = {
    id: Date.now(),
    title: title.trim(),
    date: date,
    priority: priority || 'medium',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  data.tasks.push(newTask);
  saveData(data);
  
  showSuccess(`Task "${title}" added`);
  clearInputs(['task-title', 'task-date']);
  taskPrioritySelect.value = 'medium';
  focusInput('task-title');
  renderTasks();
}

/**
 * Delete task
 * @param {number} taskId - Task ID
 */
function deleteTask(taskId) {
  if (!confirmDelete('this task')) return;
  
  const data = getData();
  data.tasks = removeById(data.tasks, taskId);
  saveData(data);
  
  showSuccess('Task deleted');
  renderTasks();
}

/**
 * Edit task
 * @param {number} taskId - Task ID
 */
function editTask(taskId) {
  const data = getData();
  const task = findById(data.tasks, taskId);
  
  if (!task) return;
  
  const newTitle = prompt('Edit task title', task.title);
  if (!newTitle) return;
  
  if (!validateRequired(newTitle, 'Task title')) return;
  
  task.title = newTitle.trim();
  saveData(data);
  
  showSuccess('Task updated');
  renderTasks();
}

/**
 * Toggle task status (pending/done)
 * @param {number} taskId - Task ID
 */
function toggleTaskStatus(taskId) {
  const data = getData();
  const task = findById(data.tasks, taskId);
  
  if (!task) return;
  
  task.status = task.status === 'pending' ? 'done' : 'pending';
  saveData(data);
  
  showSuccess(`Task marked as ${task.status}`);
  renderTasks();
}

/**
 * Update task priority
 * @param {number} taskId - Task ID
 * @param {string} priority - New priority
 */
function updateTaskPriority(taskId, priority) {
  const data = getData();
  const task = findById(data.tasks, taskId);
  
  if (!task) return;
  
  task.priority = priority;
  saveData(data);
  renderTasks();
}

/**
 * Update task deadline
 * @param {number} taskId - Task ID
 * @param {string} date - New date
 */
function updateTaskDate(taskId, date) {
  const data = getData();
  const task = findById(data.tasks, taskId);
  
  if (!task) return;
  
  task.date = date;
  saveData(data);
  renderTasks();
}

/* =====================================================================
   FILTERING
   ===================================================================== */

/**
 * Get filtered tasks based on current filter
 * @returns {Array} Filtered tasks array
 */
function getFilteredTasks() {
  const data = getData();
  let tasks = data.tasks;
  
  if (currentTaskFilter === 'pending') {
    tasks = tasks.filter(t => t.status === 'pending');
  } else if (currentTaskFilter === 'done') {
    tasks = tasks.filter(t => t.status === 'done');
  }
  
  // Sort by priority and deadline
  return tasks.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    if (a.date && b.date) {
      return new Date(a.date) - new Date(b.date);
    }
    
    return b.id - a.id; // Newest first
  });
}

/**
 * Set active filter
 * @param {string} filter - Filter type (all, pending, done)
 */
function setTaskFilter(filter) {
  currentTaskFilter = filter;
  
  // Update button states
  filterButtons.forEach(btn => {
    btn.classList.remove('filter-group__btn--active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('filter-group__btn--active');
    }
  });
  
  renderTasks();
}

/* =====================================================================
   DEADLINE HELPERS
   ===================================================================== */

/**
 * Get deadline warning message
 * @param {string} date - Task date
 * @returns {string} Warning message or empty string
 */
function getDeadlineWarning(date) {
  if (!date) return '';
  
  const daysLeft = getDaysUntilDeadline(date);
  
  if (daysLeft === null) return '';
  if (daysLeft < 0) return '⚠️ Overdue';
  if (daysLeft === 0) return '⚠️ Due Today';
  if (daysLeft === 1) return '⚠️ Due Tomorrow';
  if (daysLeft <= 3) return `⚠️ ${daysLeft} days left`;
  
  return '';
}

/**
 * Get deadline CSS class
 * @param {string} date - Task date
 * @returns {string} CSS class name
 */
function getDeadlineClass(date) {
  if (!date) return '';
  
  const daysLeft = getDaysUntilDeadline(date);
  
  if (daysLeft === null) return '';
  if (daysLeft < 0) return 'task-item--overdue';
  if (daysLeft <= 1) return 'task-item--urgent';
  if (daysLeft <= 3) return 'task-item--approaching';
  
  return '';
}

/* =====================================================================
   RENDERING
   ===================================================================== */

/**
 * Render all tasks
 */
function renderTasks() {
  const tasks = getFilteredTasks();
  
  if (!tasksListContainer) return;
  
  tasksListContainer.innerHTML = '';
  
  if (tasks.length === 0) {
    tasksListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">✅</div>
        <div class="empty-state__title">
          ${currentTaskFilter === 'done' ? 'No Completed Tasks' : 'No Tasks Yet'}
        </div>
        <div class="empty-state__description">
          ${currentTaskFilter === 'done' ? 'Great job! Keep it up.' : 'Add a task to get started'}
        </div>
      </div>
    `;
    return;
  }
  
  tasks.forEach(task => {
    const card = createTaskCard(task);
    tasksListContainer.appendChild(card);
  });
}

/**
 * Create task card element
 * @param {Object} task - Task object
 * @returns {HTMLElement} Task card element
 */
function createTaskCard(task) {
  const card = document.createElement('div');
  
  const deadlineClass = getDeadlineClass(task.date);
  const deadlineWarning = getDeadlineWarning(task.date);
  const formattedDate = task.date ? formatDate(task.date) : '';
  
  card.className = `task-item task-item--${task.status} ${deadlineClass}`.trim();
  
  card.innerHTML = `
    <input 
      type="checkbox" 
      class="task-item__checkbox" 
      ${task.status === 'done' ? 'checked' : ''}
      data-task-id="${task.id}"
    />
    
    <div class="task-item__content">
      <h3 class="task-item__title">${task.title}</h3>
      <div class="task-item__meta">
        ${task.date ? `
          <div class="task-item__date">
            <span>📅 ${formattedDate}</span>
            ${deadlineWarning ? `<span>${deadlineWarning}</span>` : ''}
          </div>
        ` : ''}
        <span class="task-item__priority-badge priority-badge--${task.priority}">
          ${task.priority}
        </span>
      </div>
    </div>
    
    <div class="task-item__actions">
      <button class="task-item__edit-btn" data-task-id="${task.id}" title="Edit">
        ✏️
      </button>
      <button class="task-item__delete-btn" data-task-id="${task.id}" title="Delete">
        🗑️
      </button>
    </div>
  `;
  
  // Event listeners
  const checkbox = card.querySelector('.task-item__checkbox');
  checkbox.addEventListener('change', () => {
    toggleTaskStatus(task.id);
  });
  
  card.querySelector('.task-item__edit-btn').addEventListener('click', () => {
    editTask(task.id);
  });
  
  card.querySelector('.task-item__delete-btn').addEventListener('click', () => {
    deleteTask(task.id);
  });
  
  return card;
}

/* =====================================================================
   STATISTICS
   ===================================================================== */

/**
 * Get task statistics
 * @returns {Object} Task statistics
 */
function getTaskStats() {
  const data = getData();
  
  const pending = data.tasks.filter(t => t.status === 'pending').length;
  const done = data.tasks.filter(t => t.status === 'done').length;
  const highPriority = data.tasks.filter(t => t.priority === 'high' && t.status === 'pending').length;
  const overdue = data.tasks.filter(t => {
    if (t.status === 'done' || !t.date) return false;
    return getDaysUntilDeadline(t.date) < 0;
  }).length;
  
  return {
    total: data.tasks.length,
    pending: pending,
    done: done,
    completion: data.tasks.length > 0 ? Math.round((done / data.tasks.length) * 100) : 0,
    highPriority: highPriority,
    overdue: overdue
  };
}

/* =====================================================================
   EVENT LISTENERS
   ===================================================================== */

// Form submission
if (taskForm) {
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskTitleInput.value, taskDateInput.value, taskPrioritySelect.value);
  });
}

// Filter buttons
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter || btn.textContent.toLowerCase();
    setTaskFilter(filter);
  });
});

// Allow Enter key for inputs
taskTitleInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') taskDateInput.focus();
});

taskDateInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') taskPrioritySelect.focus();
});

taskPrioritySelect.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') taskForm.dispatchEvent(new Event('submit'));
});

/* =====================================================================
   INITIALIZATION
   ===================================================================== */

/**
 * Initialize tasks module
 */
function initTasks() {
  console.log('✅ Tasks module initialized');
  renderTasks();
  setTaskFilter('all');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTasks);
} else {
  initTasks();
}