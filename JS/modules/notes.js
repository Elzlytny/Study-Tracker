/* =====================================================================
   NOTES.JS - Notes Management & Organization
   Tech Professional Student Management System
   ===================================================================== */

/* =====================================================================
   DOM ELEMENTS
   ===================================================================== */

const noteForm = document.getElementById('note-form');
const noteTextInput = document.getElementById('note-text');
const noteSubjectInput = document.getElementById('note-subject');
const notesListContainer = document.getElementById('notes-list-container');

/* =====================================================================
   STATE
   ===================================================================== */

let selectedNoteId = null;

/* =====================================================================
   NOTE MANAGEMENT
   ===================================================================== */

/**
 * Add new note
 * @param {string} text - Note content
 * @param {string} subject - Subject name (optional)
 */
function addNote(text, subject) {
  if (!validateRequired(text, 'Note content')) return;
  
  const data = getData();
  
  const newNote = {
    id: Date.now(),
    text: text.trim(),
    subject: subject ? subject.trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.notes.push(newNote);
  saveData(data);
  
  showSuccess('Note saved');
  clearInputs(['note-text', 'note-subject']);
  focusInput('note-text');
  renderNotes();
}

/**
 * Delete note
 * @param {number} noteId - Note ID
 */
function deleteNote(noteId) {
  if (!confirmDelete('this note')) return;
  
  const data = getData();
  data.notes = removeById(data.notes, noteId);
  saveData(data);
  
  showSuccess('Note deleted');
  if (selectedNoteId === noteId) {
    selectedNoteId = null;
  }
  renderNotes();
}

/**
 * Edit note
 * @param {number} noteId - Note ID
 */
function editNote(noteId) {
  const data = getData();
  const note = findById(data.notes, noteId);
  
  if (!note) return;
  
  // Show edit form
  noteTextInput.value = note.text;
  noteSubjectInput.value = note.subject;
  selectedNoteId = noteId;
  
  focusInput('note-text');
  showSuccess('Editing note...');
}

/**
 * Save edited note
 */
function saveEditedNote() {
  if (selectedNoteId === null) {
    showError('No note selected for editing');
    return;
  }
  
  const data = getData();
  const note = findById(data.notes, selectedNoteId);
  
  if (!note) return;
  
  if (!validateRequired(noteTextInput.value, 'Note content')) return;
  
  note.text = noteTextInput.value.trim();
  note.subject = noteSubjectInput.value.trim();
  note.updatedAt = new Date().toISOString();
  
  saveData(data);
  
  showSuccess('Note updated');
  selectedNoteId = null;
  clearInputs(['note-text', 'note-subject']);
  renderNotes();
}

/**
 * Cancel editing
 */
function cancelNoteEdit() {
  selectedNoteId = null;
  clearInputs(['note-text', 'note-subject']);
  focusInput('note-text');
  renderNotes();
}

/**
 * Get notes by subject
 * @param {string} subject - Subject name
 * @returns {Array} Notes for that subject
 */
function getNotesBySubject(subject) {
  const data = getData();
  
  if (!subject) {
    return data.notes;
  }
  
  return data.notes.filter(note => 
    note.subject.toLowerCase().includes(subject.toLowerCase())
  );
}

/**
 * Search notes by text content
 * @param {string} query - Search query
 * @returns {Array} Matching notes
 */
function searchNotes(query) {
  const data = getData();
  
  if (!query || query.trim() === '') {
    return data.notes;
  }
  
  const lowerQuery = query.toLowerCase();
  
  return data.notes.filter(note => 
    note.text.toLowerCase().includes(lowerQuery) ||
    note.subject.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get word count for note
 * @param {string} text - Note text
 * @returns {number} Word count
 */
function getWordCount(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Get character count for note
 * @param {string} text - Note text
 * @returns {number} Character count
 */
function getCharacterCount(text) {
  return text.length;
}

/* =====================================================================
   RENDERING
   ===================================================================== */

/**
 * Render all notes
 */
function renderNotes() {
  const data = getData();
  
  if (!notesListContainer) return;
  
  notesListContainer.innerHTML = '';
  
  if (data.notes.length === 0) {
    notesListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📝</div>
        <div class="empty-state__title">No Notes Yet</div>
        <div class="empty-state__description">Create your first note to get started</div>
      </div>
    `;
    return;
  }
  
  // Sort by creation date (newest first)
  const sortedNotes = sortByDate(data.notes, 'createdAt', false);
  
  sortedNotes.forEach(note => {
    const card = createNoteCard(note);
    notesListContainer.appendChild(card);
  });
}

/**
 * Create note card element
 * @param {Object} note - Note object
 * @returns {HTMLElement} Note card element
 */
function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = 'note-card';
  
  if (selectedNoteId === note.id) {
    card.classList.add('note-card--editing');
  }
  
  const formattedDate = formatDate(note.createdAt.split('T')[0]);
  const wordCount = getWordCount(note.text);
  const preview = note.text.substring(0, 150) + (note.text.length > 150 ? '...' : '');
  
  card.innerHTML = `
    <div class="note-card__header">
      <h3 class="note-card__title">${note.subject || 'Untitled Note'}</h3>
      <div class="note-card__date">${formattedDate}</div>
    </div>
    
    <div class="note-card__content">
      ${preview}
    </div>
    
    <div class="note-card__meta">
      ${note.subject ? `
        <span class="note-card__subject-badge">${note.subject}</span>
      ` : ''}
      <span class="note-card__word-count">${wordCount} words</span>
    </div>
    
    <div class="note-card__actions">
      <button class="note-card__view-btn" data-note-id="${note.id}" title="View">
        👁️ View
      </button>
      <button class="note-card__edit-btn" data-note-id="${note.id}" title="Edit">
        ✏️ Edit
      </button>
      <button class="note-card__delete-btn" data-note-id="${note.id}" title="Delete">
        🗑️ Delete
      </button>
    </div>
  `;
  
  // Event listeners
  card.querySelector('.note-card__view-btn').addEventListener('click', () => {
    viewNoteDetail(note.id);
  });
  
  card.querySelector('.note-card__edit-btn').addEventListener('click', () => {
    editNote(note.id);
  });
  
  card.querySelector('.note-card__delete-btn').addEventListener('click', () => {
    deleteNote(note.id);
  });
  
  return card;
}

/**
 * View note in detail
 * @param {number} noteId - Note ID
 */
function viewNoteDetail(noteId) {
  const data = getData();
  const note = findById(data.notes, noteId);
  
  if (!note) return;
  
  // Create detail view
  const modal = document.createElement('div');
  modal.className = 'note-detail-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
  `;
  
  const detail = document.createElement('div');
  detail.className = 'note-detail';
  detail.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  const formattedDate = formatDate(note.createdAt.split('T')[0]);
  const charCount = getCharacterCount(note.text);
  const wordCount = getWordCount(note.text);
  
  detail.innerHTML = `
    <div class="note-detail__header">
      <h2 class="note-detail__title">${note.subject || 'Untitled Note'}</h2>
      <div class="note-detail__meta">
        <span>📅 ${formattedDate}</span>
        <span>📊 ${wordCount} words • ${charCount} characters</span>
      </div>
    </div>
    
    <div class="note-detail__content">
      ${note.text.replace(/\n/g, '<br>')}
    </div>
    
    ${note.subject ? `
      <div style="margin-top: 20px;">
        <span class="note-card__subject-badge">${note.subject}</span>
      </div>
    ` : ''}
    
    <div class="note-detail__actions" style="margin-top: 20px; display: flex; gap: 10px;">
      <button class="note-detail__edit-btn" data-note-id="${note.id}" style="
        padding: 10px 20px;
        background: #00B4D8;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      ">
        ✏️ Edit
      </button>
      <button class="note-detail__close-btn" style="
        padding: 10px 20px;
        background: #f3f4f6;
        color: #333;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      ">
        Close
      </button>
    </div>
  `;
  
  modal.appendChild(detail);
  document.body.appendChild(modal);
  
  // Event listeners
  detail.querySelector('.note-detail__edit-btn').addEventListener('click', () => {
    editNote(note.id);
    modal.remove();
  });
  
  detail.querySelector('.note-detail__close-btn').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/* =====================================================================
   STATISTICS
   ===================================================================== */

/**
 * Get notes statistics
 * @returns {Object} Notes statistics
 */
function getNotesStats() {
  const data = getData();
  
  let totalWords = 0;
  let totalCharacters = 0;
  
  data.notes.forEach(note => {
    totalWords += getWordCount(note.text);
    totalCharacters += getCharacterCount(note.text);
  });
  
  const bySubject = {};
  data.notes.forEach(note => {
    const subject = note.subject || 'No Subject';
    bySubject[subject] = (bySubject[subject] || 0) + 1;
  });
  
  return {
    total: data.notes.length,
    totalWords: totalWords,
    totalCharacters: totalCharacters,
    averageWords: data.notes.length > 0 ? Math.round(totalWords / data.notes.length) : 0,
    bySubject: bySubject
  };
}

/* =====================================================================
   EXPORT FUNCTIONALITY
   ===================================================================== */

/**
 * Export all notes as text file
 */
function exportNotesAsText() {
  const data = getData();
  
  if (data.notes.length === 0) {
    showError('No notes to export');
    return;
  }
  
  let text = `=== STUDENT NOTES ===\nExported: ${new Date().toLocaleString()}\n\n`;
  
  data.notes.forEach((note, index) => {
    text += `Note ${index + 1}\n`;
    text += `Subject: ${note.subject || 'N/A'}\n`;
    text += `Date: ${formatDate(note.createdAt.split('T')[0])}\n`;
    text += `---\n`;
    text += `${note.text}\n`;
    text += `\n${'='.repeat(50)}\n\n`;
  });
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notes-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showSuccess('Notes exported successfully');
}

/**
 * Export single note as markdown
 * @param {number} noteId - Note ID
 */
function exportNoteAsMarkdown(noteId) {
  const data = getData();
  const note = findById(data.notes, noteId);
  
  if (!note) return;
  
  let markdown = `# ${note.subject || 'Untitled Note'}\n\n`;
  markdown += `*${formatDate(note.createdAt.split('T')[0])}*\n\n`;
  markdown += `${note.text}`;
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `note-${note.id}.md`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showSuccess('Note exported');
}

/* =====================================================================
   EVENT LISTENERS
   ===================================================================== */

// Form submission
if (noteForm) {
  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (selectedNoteId !== null) {
      saveEditedNote();
    } else {
      addNote(noteTextInput.value, noteSubjectInput.value);
    }
  });
}

// Allow Tab key to move to next field in textarea
if (noteTextInput) {
  noteTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = noteTextInput.selectionStart;
      const end = noteTextInput.selectionEnd;
      noteTextInput.value = noteTextInput.value.substring(0, start) + '\t' + noteTextInput.value.substring(end);
      noteTextInput.selectionStart = noteTextInput.selectionEnd = start + 1;
    }
  });
}

/* =====================================================================
   INITIALIZATION
   ===================================================================== */

/**
 * Initialize notes module
 */
function initNotes() {
  console.log('📝 Notes module initialized');
  renderNotes();
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotes);
} else {
  initNotes();
}