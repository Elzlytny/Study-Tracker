StudyTracker — Student Productivity & Academic Tracker System
A lightweight, frontend-only web application that helps university students manage their academic life from a single, unified platform — subjects and materials, grades, tasks, notes, performance analytics, and a Pomodoro study timer.
Built entirely with HTML5, CSS3, and Vanilla JavaScript. No backend, no database, no build tools — all data persists locally in the browser via the `localStorage` API.
Live Demo
Open `index.html` in any modern browser, or serve the folder with a tool like VS Code's Live Server extension.
Features
Module	File	Description
🏠 Home	`index.html`	Select academic year/semester and add subjects
📁 Materials	`materials.html`	Organize subjects into folders (Lectures, Sections, Sheets, Quizzes) with Google Drive link support
📊 Tracker	`tracker.html`	Log quiz/sheet scores per lecture, with CSV export
📈 Dashboard	`dashboard.html`	Visual performance analytics — overall progress, strongest/weakest subjects, Chart.js bar chart
✅ Tasks	`tasks.html`	Deadline and priority management with filters (All / Pending / Done)
📝 Notes	`notes.html`	Rich-text notes, optionally linked to a subject
⏱️ Pomodoro	`pomodoro.html`	25/5/15-minute focus timer with session history and custom durations
Tech Stack
HTML5 — semantic structure
CSS3 — responsive layout, animations, dark theme
JavaScript (ES6+) — all app logic, DOM manipulation, no frameworks
Chart.js — dashboard visualizations
localStorage API — client-side data persistence
Project Structure
```
study-tracker/
├── index.html          # Home — year/semester & subject creation
├── materials.html       # Materials — subject folders & files
├── tracker.html          # Score Tracker — grade entry
├── dashboard.html        # Dashboard — analytics & charts
├── tasks.html            # Task Manager — deadlines & priorities
├── notes.html            # Notes — subject-linked annotations
├── pomodoro.html         # Pomodoro Timer — focus sessions
├── CSS/
│   ├── main.css          # Shared styles, navbar, theme
│   ├── home.css
│   ├── materials.css
│   ├── tracker.css
│   ├── dashboard.css
│   ├── tasks.css
│   ├── notes.css
│   └── pomodoro.css
├── JS/
│   └── modules/
│       ├── main.js
│       ├── home.js
│       ├── materials.js
│       ├── tracker.js
│       ├── dashboard.js
│       ├── tasks.js
│       ├── notes.js
│       └── pomodoro.js
└── Assets/
    ├── favicon.svg
    ├── img.webp
    └── opengraph.jpg
```
Getting Started
Clone the repository:
```bash
   git clone https://github.com/<your-username>/study-tracker.git
   cd study-tracker
   ```
Open `index.html` directly in your browser, or run it with a local server (recommended, for relative paths and dev tools to work smoothly):
```bash
   npx serve .
   ```
or use the Live Server extension in VS Code.
No installation, no dependencies, no `npm install` required.
Data & Privacy
All data (subjects, grades, tasks, notes, Pomodoro history) is stored exclusively in your browser's `localStorage`. Nothing is sent to a server — your academic data stays private and works fully offline after the first load.
> **Note:** Because data is stored per-browser, it does not sync across devices. Clearing your browser data will erase your saved subjects, grades, tasks, and notes.
Project Team
Yassin Mohamed Mohamed Mostafa — Home & Materials
Ahmed Khaled Abd El-Azeem — Score Tracker
Mohamed Mahmoud Mohamed Abd El-Ghany — Dashboard & Analytics
Sara Sameh Abd El-Fattah — Notes, Tasks & Pomodoro
Advisor: Dr. Sara — Sphinx University, Faculty of Computer Science & Information Technology
Work-Based Professional Project — Level 2 · 2025–2026
License
This project was developed for academic purposes as part of a university course. Feel free to fork and build on it for learning purposes.# Study-Tracker
