/* =====================================================================
   MATERIALS.JS - Subjects, Folders & Files Management (materials.html)
   ===================================================================== */

/* =====================================================================
   STATE
   ===================================================================== */

let currentSubject = null;
let currentFolder  = null;

/* =====================================================================
   DOM ELEMENTS
   ===================================================================== */

const classLevelSelect      = document.getElementById('class-level');
const semesterSelect        = document.getElementById('semester');
const subjectsContainer     = document.getElementById('subjects-container');
const subjectTitleElement   = document.getElementById('subject-title');
const foldersContainer      = document.getElementById('folders-container');
const folderNameInput       = document.getElementById('folder-name-input');
const addFolderBtn          = document.getElementById('add-folder-btn');
const folderTitleElement    = document.getElementById('folder-title');
const filesContainer        = document.getElementById('files-container');
const fileNameInput         = document.getElementById('file-name-input');
const fileLinkInput         = document.getElementById('file-link-input');
const addFileBtn            = document.getElementById('add-file-btn');
const backToMaterialsBtn    = document.getElementById('back-to-materials-btn');
const backToSubjectBtn      = document.getElementById('back-to-subject-btn');

/* =====================================================================
   SECTION MANAGEMENT
   ===================================================================== */

function showMaterialsSection(sectionId) {
  ['materials-view', 'subject-details-view', 'folder-view'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(sectionId);
  if (target) target.style.display = 'block';
}

/* =====================================================================
   SUBJECT MANAGEMENT
   ===================================================================== */

function deleteMaterialsSubject(subjectId) {
  if (!confirmDelete('this subject')) return;

  const data = getData();
  data.materials = removeById(data.materials, subjectId);
  data.tracker   = data.tracker.filter(entry => entry.subjectId !== subjectId);

  saveData(data);
  showSuccess('Subject deleted');
  renderMaterialsSubjects();
}

function editMaterialsSubject(subjectId) {
  const data    = getData();
  const subject = findById(data.materials, subjectId);
  if (!subject) return;

  const newName = prompt('Edit subject name', subject.name);
  if (!newName) return;
  if (!validateRequired(newName, 'Subject name')) return;

  subject.name = newName.trim();
  saveData(data);

  showSuccess('Subject updated');
  renderMaterialsSubjects();
}

function renderMaterialsSubjects() {
  const data     = getData();
  const year     = classLevelSelect ? classLevelSelect.value : null;
  const semester = semesterSelect   ? semesterSelect.value   : null;

  // ✅ لو فيه dropdowns استخدمهم، لو لأ اعرض الكل
  const filtered = (year && semester)
    ? data.materials.filter(s => s.year === year && s.semester === semester)
    : data.materials;

  subjectsContainer.innerHTML = '';

  if (filtered.length === 0) {
    subjectsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📚</div>
        <div class="empty-state__title">No Subjects Yet</div>
        <div class="empty-state__description">Go to Home to add your first subject</div>
      </div>`;
    return;
  }

  filtered.forEach(subject => {
    subjectsContainer.appendChild(createSubjectCard(subject));
  });
}

function createSubjectCard(subject) {
  const card = document.createElement('div');
  card.className = 'subject-card';

  const totalFiles = subject.folders.reduce((sum, f) => sum + f.files.length, 0);

  card.innerHTML = `
    <div class="subject-card__header">
      <h3 class="subject-card__title">${subject.name}</h3>
    </div>
    <div class="subject-card__meta">
      <div class="subject-card__meta-item">
        <span class="subject-card__meta-label">Year:</span>
        <span>${subject.year}</span>
      </div>
      <div class="subject-card__meta-item">
        <span class="subject-card__meta-label">Semester:</span>
        <span>${subject.semester}</span>
      </div>
    </div>
    <div class="subject-card__count">
      ${subject.folders.length} folders • ${totalFiles} files
    </div>
    <div class="subject-card__actions">
      <button class="subject-card__view-btn"   data-subject-id="${subject.id}">Open</button>
      <button class="subject-card__delete-btn" data-subject-id="${subject.id}">Delete</button>
    </div>`;

  const openSubject = () => {
    currentSubject = subject.id;
    showMaterialsSection('subject-details-view');
    renderSubjectDetails();
  };

  card.addEventListener('click', (e) => {
    if (!e.target.closest('.subject-card__delete-btn') &&
        !e.target.closest('.subject-card__view-btn')) {
      openSubject();
    }
  });

  card.querySelector('.subject-card__view-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openSubject();
  });

  card.querySelector('.subject-card__delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteMaterialsSubject(subject.id);
  });

  return card;
}

/* =====================================================================
   FOLDER MANAGEMENT
   ===================================================================== */

function renderSubjectDetails() {
  const data    = getData();
  const subject = data.materials.find(s => s.id == currentSubject);
  if (!subject) return;

  subjectTitleElement.textContent = subject.name;
  foldersContainer.innerHTML = '';

  subject.folders.forEach(folder => {
    foldersContainer.appendChild(createFolderCard(folder));
  });
}

function createFolderCard(folder) {
  const card = document.createElement('div');
  card.className = 'folder-card';

  const isDefault = ['Lectures', 'Sections', 'Sheets'].includes(folder.name);

  card.innerHTML = `
    <div class="folder-card__header">
      <div class="folder-card__title">${folder.name}</div>
      ${!isDefault ? `<button class="folder-card__delete-btn" data-folder-id="${folder.id}">✕</button>` : ''}
    </div>
    <div class="folder-card__file-count">${folder.files.length} files</div>`;

  card.addEventListener('click', (e) => {
    if (!e.target.classList.contains('folder-card__delete-btn')) {
      currentFolder = folder.id;
      showMaterialsSection('folder-view');
      renderFolderFiles();
    }
  });

  if (!isDefault) {
    card.querySelector('.folder-card__delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteMaterialsFolder(folder.id);
    });
  }

  return card;
}

function addMaterialsFolder(name) {
  if (!validateRequired(name, 'Folder name')) return;

  const data    = getData();
  const subject = data.materials.find(s => s.id == currentSubject);
  if (!subject) return;

  if (subject.folders.some(f => f.name === name.trim())) {
    showError('Folder already exists');
    return;
  }

  subject.folders.push({ id: Date.now(), name: name.trim(), files: [] });
  saveData(data);

  showSuccess(`Folder "${name}" created`);
  clearInputs('folder-name-input');
  renderSubjectDetails();
}

function deleteMaterialsFolder(folderId) {
  if (!confirmDelete('this folder')) return;

  const data    = getData();
  const subject = data.materials.find(s => s.id == currentSubject);
  if (!subject) return;

  subject.folders = subject.folders.filter(f => f.id !== folderId);
  saveData(data);

  showSuccess('Folder deleted');
  renderSubjectDetails();
}

/* =====================================================================
   FILE MANAGEMENT
   ===================================================================== */

function renderFolderFiles() {
  const data    = getData();
  const subject = data.materials.find(s => s.id == currentSubject);
  if (!subject) return;
  const folder  = subject.folders.find(f => f.id == currentFolder);
  if (!folder) return;

  folderTitleElement.textContent = folder.name;
  filesContainer.innerHTML = '';

  if (folder.files.length === 0) {
    filesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📄</div>
        <div class="empty-state__title">No Files Yet</div>
        <div class="empty-state__description">Add your first file to this folder</div>
      </div>`;
    return;
  }

  folder.files.forEach(file => {
    filesContainer.appendChild(createFileItem(file, folder.id));
  });
}

function createFileItem(file, folderId) {
  const item = document.createElement('div');
  item.className = 'file-item';

  item.innerHTML = `
    <div class="file-item__icon">📎</div>
    <div class="file-item__content">
      <div class="file-item__name">${file.name}</div>
      <a href="${file.link}" target="_blank" rel="noopener noreferrer" class="file-item__link">
        Open File
      </a>
    </div>
    <div class="file-item__actions">
      <button class="file-item__download-btn" data-file-id="${file.id}" data-folder-id="${folderId}">Edit</button>
      <button class="file-item__delete-btn"   data-file-id="${file.id}" data-folder-id="${folderId}">Delete</button>
    </div>`;

  item.querySelector('.file-item__download-btn').addEventListener('click', () => {
    editMaterialsFile(file.id, folderId);
  });

  item.querySelector('.file-item__delete-btn').addEventListener('click', () => {
    deleteMaterialsFile(file.id, folderId);
  });

  return item;
}

function addMaterialsFile(name, link) {
  if (!validateRequired(name, 'File name'))  return;
  if (!validateRequired(link, 'File link'))  return;
  if (!validateURL(link)) { showError('Invalid URL format'); return; }

  const data    = getData();
  const subject = data.materials.find(s => s.id == currentSubject);
  if (!subject) return;
  const folder  = subject.folders.find(f => f.id == currentFolder);
  if (!folder) return;

  folder.files.push({ id: Date.now(), name: name.trim(), link: link.trim() });
  saveData(data);

  showSuccess(`File "${name}" added`);
  clearInputs(['file-name-input', 'file-link-input']);
  renderFolderFiles();
}

function editMaterialsFile(fileId, folderId) {
  const data    = getData();
  const subject = data.materials.find(s => s.id == currentSubject);
  if (!subject) return;
  const folder  = subject.folders.find(f => f.id === folderId);
  if (!folder) return;
  const file    = folder.files.find(f => f.id === fileId);
  if (!file) return;

  const newName = prompt('Edit file name', file.name);
  const newLink = prompt('Edit file link', file.link);

  if (!newName || !newLink) return;
  if (!validateURL(newLink)) { showError('Invalid URL format'); return; }

  file.name = newName.trim();
  file.link = newLink.trim();
  saveData(data);

  showSuccess('File updated');
  renderFolderFiles();
}

function deleteMaterialsFile(fileId, folderId) {
  if (!confirmDelete('this file')) return;

  const data    = getData();
  const subject = data.materials.find(s => s.id == currentSubject);
  if (!subject) return;
  const folder  = subject.folders.find(f => f.id === folderId);
  if (!folder) return;

  folder.files = removeById(folder.files, fileId);
  saveData(data);

  showSuccess('File deleted');
  renderFolderFiles();
}

/* =====================================================================
   EVENT LISTENERS
   ===================================================================== */

if (addFolderBtn) {
  addFolderBtn.addEventListener('click', () => addMaterialsFolder(folderNameInput.value));
}

if (addFileBtn) {
  addFileBtn.addEventListener('click', () => addMaterialsFile(fileNameInput.value, fileLinkInput.value));
}

if (backToMaterialsBtn) {
  backToMaterialsBtn.addEventListener('click', () => {
    currentSubject = null;
    showMaterialsSection('materials-view');
    renderMaterialsSubjects();
  });
}

if (backToSubjectBtn) {
  backToSubjectBtn.addEventListener('click', () => {
    currentFolder = null;
    showMaterialsSection('subject-details-view');
    renderSubjectDetails();
  });
}

if (classLevelSelect) classLevelSelect.addEventListener('change', renderMaterialsSubjects);
if (semesterSelect)   semesterSelect.addEventListener('change',   renderMaterialsSubjects);

if (folderNameInput) {
  folderNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addFolderBtn.click();
  });
}

if (fileNameInput) {
  fileNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fileLinkInput.focus();
  });
}

if (fileLinkInput) {
  fileLinkInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addFileBtn.click();
  });
}

/* =====================================================================
   INITIALIZATION
   ===================================================================== */

function initMaterials() {
  console.log('📚 Materials module initialized');
  renderMaterialsSubjects();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMaterials);
} else {
  initMaterials();
}