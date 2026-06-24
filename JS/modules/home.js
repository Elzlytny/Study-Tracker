/* =====================================================================
   HOME.JS - Add Subject Form (index.html)
   ===================================================================== */
  
/* =====================================================================
   DOM ELEMENTS
   ===================================================================== */

const classLevelSelect  = document.getElementById('class-level');
const semesterSelect    = document.getElementById('semester');
const subjectNameInput  = document.getElementById('subject-name');
const addSubjectBtn     = document.getElementById('add-subject-btn');

/* =====================================================================
   SUBJECT MANAGEMENT
   ===================================================================== */

function addMaterialsSubject(name, year, semester) {
  if (!validateRequired(name, 'Subject name')) return;

  const data = getData();

  const exists = data.materials.some(
    s => s.name === name && s.year === year && s.semester === semester
  );

  if (exists) {
    showError('Subject already exists');
    return;
  }

  const newSubject = {
    id: Date.now(),
    name: name.trim(),
    year: year,
    semester: semester,
    folders: [
      { id: Date.now() + 1, name: 'Lectures',  files: [] },
      { id: Date.now() + 2, name: 'Sections',  files: [] },
      { id: Date.now() + 3, name: 'Sheets',    files: [] }
    ],
    createdAt: new Date().toISOString()
  };

  data.materials.push(newSubject);
  saveData(data);

  showSuccess(`${name} added successfully`);
  clearInputs('subject-name');
  focusInput('subject-name');

  // Redirect to materials page after adding
  window.location.href = 'materials.html';
}

/* =====================================================================
   EVENT LISTENERS
   ===================================================================== */

addSubjectBtn.addEventListener('click', () => {
  addMaterialsSubject(
    subjectNameInput.value,
    classLevelSelect.value,
    semesterSelect.value
  );
});

subjectNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addSubjectBtn.click();
});

/* =====================================================================
   INITIALIZATION
   ===================================================================== */

function initHome() {
  console.log('🏠 Home module initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHome);
} else {
  initHome();
}