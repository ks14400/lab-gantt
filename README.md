# Lab Gantt Chart

Interactive Gantt chart for lab project scheduling and timeline visualization.

**Live app:** https://ks14400.github.io/lab-gantt/

## Features

- Drag bars to reschedule tasks
- Resize task duration by dragging edges
- Add, edit, and delete tasks and categories
- Click category color dots to cycle through color themes
- Collapsible task categories
- Auto-scaling timeline based on task dates
- "Today" indicator line
- Changes persist in your browser via localStorage

## Running Locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via GitHub Actions.

To build manually:

```bash
npm run build
```

Output goes to `dist/`.

## Tech Stack

- React 19
- Vite
- GitHub Pages
