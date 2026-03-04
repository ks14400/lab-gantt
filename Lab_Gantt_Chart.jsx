import { useState, useRef, useEffect, useCallback, useMemo } from "react";

const PRESET_COLORS = [
  { bar: "#E8A838", border: "#C68A20" },
  { bar: "#4A90D9", border: "#2D6CB5" },
  { bar: "#5BB55B", border: "#3D8E3D" },
  { bar: "#E07040", border: "#C04E20" },
  { bar: "#9B6DC6", border: "#7B4DA6" },
  { bar: "#D94F7A", border: "#B53360" },
  { bar: "#3DC1C1", border: "#2A9A9A" },
  { bar: "#C4A84D", border: "#A08930" },
  { bar: "#6A8FD9", border: "#4A6FB9" },
  { bar: "#D97B4A", border: "#B95F30" },
];

const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "Move Prep", colorIdx: 0 },
  { id: "cat-2", name: "Equipment Orders", colorIdx: 1 },
  { id: "cat-3", name: "Installation & Setup", colorIdx: 2 },
  { id: "cat-4", name: "Automation & Integration", colorIdx: 3 },
  { id: "cat-5", name: "Design & Build", colorIdx: 4 },
];

const INITIAL_TASKS = [
  { id: 1, catId: "cat-1", task: "Packing instruments & shifting", start: "2025-03-08", end: "2025-03-21" },
  { id: 2, catId: "cat-1", task: "Mapping lab space for CAD", start: "2025-03-08", end: "2025-03-21" },
  { id: 3, catId: "cat-1", task: "Confirming installation requirements", start: "2025-03-08", end: "2025-03-21" },
  { id: 4, catId: "cat-1", task: "Electricals setup", start: "2025-03-08", end: "2025-03-21" },
  { id: 5, catId: "cat-1", task: "WiFi setup", start: "2025-03-08", end: "2025-03-21" },
  { id: 6, catId: "cat-1", task: "HVAC setup", start: "2025-03-08", end: "2025-03-21" },
  { id: 7, catId: "cat-1", task: "Miscellaneous construction", start: "2025-03-08", end: "2025-03-21" },
  { id: 8, catId: "cat-2", task: "Order salt fog machine", start: "2025-03-15", end: "2025-03-21" },
  { id: 9, catId: "cat-2", task: "Order oven", start: "2025-03-15", end: "2025-03-21" },
  { id: 10, catId: "cat-2", task: "Order robotic arm pedestals & lab benches", start: "2025-03-22", end: "2025-03-28" },
  { id: 11, catId: "cat-2", task: "Order robotic arms", start: "2025-03-22", end: "2025-03-28" },
  { id: 12, catId: "cat-2", task: "Order ICP/OES", start: "2025-03-29", end: "2025-04-04" },
  { id: 13, catId: "cat-2", task: "Order Autosorb", start: "2025-03-29", end: "2025-04-04" },
  { id: 14, catId: "cat-2", task: "Order & organize chem storage", start: "2025-04-05", end: "2025-04-11" },
  { id: 15, catId: "cat-2", task: "Order AMR", start: "2025-04-26", end: "2025-05-02" },
  { id: 16, catId: "cat-2", task: "Order gas breakthrough column components", start: "2025-05-17", end: "2025-05-23" },
  { id: 17, catId: "cat-3", task: "PXRD installation & operational setup", start: "2025-03-22", end: "2025-03-28" },
  { id: 18, catId: "cat-3", task: "Sample testing for ICP-OES", start: "2025-03-22", end: "2025-03-28" },
  { id: 19, catId: "cat-3", task: "Receive & install Unchained Junior", start: "2025-03-29", end: "2025-04-04" },
  { id: 20, catId: "cat-3", task: "PXRD & Unchained Junior integration", start: "2025-03-29", end: "2025-04-04" },
  { id: 21, catId: "cat-4", task: "Oven automation", start: "2025-04-05", end: "2025-04-18" },
  { id: 22, catId: "cat-4", task: "Robotic arm integration", start: "2025-04-19", end: "2025-05-02" },
  { id: 23, catId: "cat-4", task: "Receive AMR & begin integration", start: "2025-05-17", end: "2025-05-30" },
  { id: 24, catId: "cat-5", task: "Build & test liquid breakthrough column", start: "2025-04-12", end: "2025-05-02" },
  { id: 25, catId: "cat-5", task: "Design gas breakthrough column", start: "2025-05-03", end: "2025-05-23" },
  { id: 26, catId: "cat-5", task: "Build & test gas breakthrough column", start: "2025-05-24", end: "2025-05-30" },
];

const STORAGE_KEY_TASKS = "gantt_tasks";
const STORAGE_KEY_CATEGORIES = "gantt_categories";

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

const DAY_WIDTH = 11;
const ROW_HEIGHT = 38;

function toDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function toStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function getMondayBefore(d) { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; }

let _nextId = 100;
function nextId() { return ++_nextId; }
let _nextCatId = 100;
function nextCatId() { return `cat-${++_nextCatId}`; }

function buildTimeline(start, end) {
  const weeks = [];
  let d = new Date(start);
  while (d < end) { weeks.push(new Date(d)); d = addDays(d, 7); }
  const months = [];
  let cur = null;
  weeks.forEach((w, i) => {
    const label = w.toLocaleString("en", { month: "short", year: "numeric" });
    if (label !== cur) {
      if (months.length) months[months.length - 1].span = i - months[months.length - 1].startIdx;
      months.push({ label, startIdx: i });
      cur = label;
    }
  });
  if (months.length) months[months.length - 1].span = weeks.length - months[months.length - 1].startIdx;
  return { timelineStart: start, timelineEnd: end, weeks, months };
}

export default function GanttChart() {
  const [tasks, setTasks] = useState(() => loadFromStorage(STORAGE_KEY_TASKS, INITIAL_TASKS));
  const [categories, setCategories] = useState(() => loadFromStorage(STORAGE_KEY_CATEGORIES, INITIAL_CATEGORIES));
  const [collapsed, setCollapsed] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editCatId, setEditCatId] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const chartRef = useRef(null);
  const leftRef = useRef(null);

  const { timelineStart, weeks, months } = useMemo(() => {
    if (tasks.length === 0) {
      const now = getMondayBefore(new Date());
      return buildTimeline(now, addDays(now, 84));
    }
    let earliest = toDate(tasks[0].start), latest = toDate(tasks[0].end);
    tasks.forEach(t => {
      const s = toDate(t.start), e = toDate(t.end);
      if (s < earliest) earliest = s;
      if (e > latest) latest = e;
    });
    return buildTimeline(getMondayBefore(addDays(earliest, -7)), addDays(latest, 14));
  }, [tasks]);

  const getColor = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? PRESET_COLORS[cat.colorIdx % PRESET_COLORS.length] : PRESET_COLORS[0];
  };

  const updateTask = (id, field, value) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, [field]: value };
      if (field === "start" && toDate(value) > toDate(t.end)) updated.end = value;
      if (field === "end" && toDate(value) < toDate(t.start)) updated.start = value;
      return updated;
    }));
  };

  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const addTask = (catId) => {
    const catTasks = tasks.filter(t => t.catId === catId);
    const last = catTasks[catTasks.length - 1];
    const id = nextId();
    const today = toStr(new Date());
    const nextWeek = toStr(addDays(new Date(), 7));
    const newTask = { id, catId, task: "New task", start: last ? last.start : today, end: last ? last.end : nextWeek };
    const idx = last ? tasks.indexOf(last) + 1 : tasks.length;
    const next = [...tasks];
    next.splice(idx, 0, newTask);
    setTasks(next);
    setEditingId(id);
    setEditField("task");
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const id = nextCatId();
    const colorIdx = categories.length % PRESET_COLORS.length;
    setCategories(prev => [...prev, { id, name: newCatName.trim(), colorIdx }]);
    setNewCatName("");
    setShowAddCat(false);
  };

  const deleteCategory = (catId) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    setTasks(prev => prev.filter(t => t.catId !== catId));
  };

  const renameCategory = (catId, name) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name } : c));
  };

  const cycleColor = (catId) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, colorIdx: (c.colorIdx + 1) % PRESET_COLORS.length } : c));
  };

  const handleBarMouseDown = useCallback((e, taskId, type) => {
    e.preventDefault();
    e.stopPropagation();
    const t = tasks.find(x => x.id === taskId);
    setDragInfo({ taskId, type, startX: e.clientX, origStart: t.start, origEnd: t.end });
  }, [tasks]);

  useEffect(() => {
    if (!dragInfo) return;
    const onMove = (e) => {
      const dx = e.clientX - dragInfo.startX;
      const dayDelta = Math.round(dx / DAY_WIDTH);
      if (dragInfo.type === "move") {
        const ns = toStr(addDays(toDate(dragInfo.origStart), dayDelta));
        const ne = toStr(addDays(toDate(dragInfo.origEnd), dayDelta));
        setTasks(prev => prev.map(t => t.id === dragInfo.taskId ? { ...t, start: ns, end: ne } : t));
      } else if (dragInfo.type === "left") {
        const ns = addDays(toDate(dragInfo.origStart), dayDelta);
        if (ns <= toDate(dragInfo.origEnd)) setTasks(prev => prev.map(t => t.id === dragInfo.taskId ? { ...t, start: toStr(ns) } : t));
      } else if (dragInfo.type === "right") {
        const ne = addDays(toDate(dragInfo.origEnd), dayDelta);
        if (ne >= toDate(dragInfo.origStart)) setTasks(prev => prev.map(t => t.id === dragInfo.taskId ? { ...t, end: toStr(ne) } : t));
      }
    };
    const onUp = () => setDragInfo(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragInfo]);

  // Sync vertical scroll between left panel and chart
  useEffect(() => {
    const chart = chartRef.current;
    const left = leftRef.current;
    if (!chart || !left) return;
    const syncFromChart = () => { left.scrollTop = chart.scrollTop; };
    const syncFromLeft = () => { chart.scrollTop = left.scrollTop; };
    chart.addEventListener("scroll", syncFromChart);
    left.addEventListener("scroll", syncFromLeft);
    return () => { chart.removeEventListener("scroll", syncFromChart); left.removeEventListener("scroll", syncFromLeft); };
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories)); }, [categories]);

  const visibleRows = [];
  categories.forEach(cat => {
    const catTasks = tasks.filter(t => t.catId === cat.id);
    visibleRows.push({ type: "header", cat, count: catTasks.length });
    if (!collapsed[cat.id]) catTasks.forEach(t => visibleRows.push({ type: "task", ...t }));
  });

  const todayOffset = daysBetween(timelineStart, new Date());
  const totalWidth = weeks.length * 7 * DAY_WIDTH;
  const totalContentHeight = visibleRows.length * ROW_HEIGHT + 100;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: "#0F1117", color: "#E0E4EC", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "14px 24px 10px", borderBottom: "1px solid #1E2130", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#5BB55B", boxShadow: "0 0 8px #5BB55B80" }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "#F5F7FA" }}>Project Gantt Chart</h1>
          </div>
          <button onClick={() => setShowAddCat(true)}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #2D3348", background: "#1A1D28", color: "#9CA3AF", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#252836"} onMouseLeave={e => e.currentTarget.style.background = "#1A1D28"}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Category
          </button>
        </div>
        <p style={{ margin: "4px 0 0 22px", fontSize: 11, color: "#4B5563", fontFamily: "'IBM Plex Mono', monospace" }}>
          Drag bars to reschedule · Resize edges · Click names to edit · Click color dots to cycle · Timeline auto-scales to your dates
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 8, paddingLeft: 22, flexWrap: "wrap", alignItems: "center" }}>
          {categories.map(cat => {
            const c = PRESET_COLORS[cat.colorIdx % PRESET_COLORS.length];
            return (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }} onClick={() => cycleColor(cat.id)} title="Click to change color">
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c.bar }} />
                <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{cat.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add category modal */}
      {showAddCat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowAddCat(false)}>
          <div style={{ background: "#1A1D28", borderRadius: 12, padding: 24, width: 360, border: "1px solid #2D3348", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#F5F7FA" }}>New Category</h3>
            <input autoFocus placeholder="e.g. Testing & QA, Procurement, Commissioning..." value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCategory()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #2D3348", background: "#13151D", color: "#E0E4EC", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddCat(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #2D3348", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={addCategory} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#5BB55B", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Column headers row */}
      <div style={{ display: "flex", flexShrink: 0 }}>
        <div style={{ minWidth: 380, maxWidth: 380, display: "flex", height: 52, borderBottom: "2px solid #1E2130", background: "#13151D", borderRight: "1px solid #1E2130" }}>
          <div style={{ flex: 1, padding: "0 16px", display: "flex", alignItems: "center", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280" }}>Task</div>
          <div style={{ width: 84, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280" }}>Start</div>
          <div style={{ width: 84, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280" }}>End</div>
          <div style={{ width: 30 }} />
        </div>
        {/* Timeline month+week headers */}
        <div style={{ flex: 1, overflow: "hidden", background: "#13151D" }}>
          <div style={{ display: "flex", height: 24, borderBottom: "1px solid #1E2130" }}>
            {months.map((m, i) => (
              <div key={i} style={{ width: m.span * 7 * DAY_WIDTH, minWidth: m.span * 7 * DAY_WIDTH, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#9CA3AF", borderRight: "1px solid #1E2130" }}>{m.label}</div>
            ))}
          </div>
          <div style={{ display: "flex", height: 28, borderBottom: "2px solid #1E2130" }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ width: 7 * DAY_WIDTH, minWidth: 7 * DAY_WIDTH, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#4B5563", borderRight: "1px solid #1A1D28", fontFamily: "'IBM Plex Mono', monospace" }}>
                {w.getMonth() + 1}/{w.getDate()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left panel */}
        <div ref={leftRef} style={{ minWidth: 380, maxWidth: 380, borderRight: "1px solid #1E2130", flexShrink: 0, overflowY: "auto", overflowX: "hidden" }}>
          {visibleRows.map((item) => {
            if (item.type === "header") {
              const c = PRESET_COLORS[item.cat.colorIdx % PRESET_COLORS.length];
              return (
                <div key={`h-${item.cat.id}`} style={{ display: "flex", alignItems: "center", height: ROW_HEIGHT, padding: "0 10px", background: "#181B24", borderBottom: "1px solid #1E2130", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "#6B7280", cursor: "pointer", transition: "transform 0.15s", transform: collapsed[item.cat.id] ? "rotate(-90deg)" : "rotate(0)", userSelect: "none", flexShrink: 0 }}
                    onClick={() => setCollapsed(p => ({ ...p, [item.cat.id]: !p[item.cat.id] }))}>▼</span>
                  <div style={{ width: 4, height: 18, borderRadius: 2, background: c.bar, flexShrink: 0, cursor: "pointer" }} onClick={() => cycleColor(item.cat.id)} title="Change color" />
                  {editCatId === item.cat.id ? (
                    <input autoFocus value={item.cat.name}
                      onChange={e => renameCategory(item.cat.id, e.target.value)}
                      onBlur={() => setEditCatId(null)}
                      onKeyDown={e => e.key === "Enter" && setEditCatId(null)}
                      style={{ flex: 1, background: "#1E2130", border: `1px solid ${c.bar}`, borderRadius: 4, padding: "2px 6px", color: c.bar, fontSize: 12, fontWeight: 600, fontFamily: "inherit", outline: "none" }} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.bar, flex: 1, cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      onClick={() => setEditCatId(item.cat.id)}>{item.cat.name}</span>
                  )}
                  <span style={{ fontSize: 10, color: "#4B5563", flexShrink: 0 }}>{item.count}</span>
                  <button onClick={() => addTask(item.cat.id)} title="Add task"
                    style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid #2D3348", background: "transparent", color: "#6B7280", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }}>+</button>
                  <button onClick={() => { if (window.confirm(`Delete "${item.cat.name}" and all its tasks?`)) deleteCategory(item.cat.id); }} title="Delete category"
                    style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: "transparent", color: "#4B5563", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              );
            }
            const c = getColor(item.catId);
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", height: ROW_HEIGHT, borderBottom: "1px solid #1A1D28", background: hoveredTask === item.id ? "#1A1D28" : "transparent", transition: "background 0.1s" }}
                onMouseEnter={() => setHoveredTask(item.id)} onMouseLeave={() => setHoveredTask(null)}>
                <div style={{ flex: 1, padding: "0 10px 0 28px", overflow: "hidden" }}>
                  {editingId === item.id && editField === "task" ? (
                    <input autoFocus value={item.task} onChange={e => updateTask(item.id, "task", e.target.value)}
                      onBlur={() => { setEditingId(null); setEditField(null); }}
                      onKeyDown={e => e.key === "Enter" && (setEditingId(null), setEditField(null))}
                      style={{ width: "100%", background: "#1E2130", border: `1px solid ${c.bar}`, borderRadius: 4, padding: "2px 6px", color: "#E0E4EC", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  ) : (
                    <div onClick={() => { setEditingId(item.id); setEditField("task"); }}
                      style={{ fontSize: 12, color: "#D1D5DB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "text" }}>{item.task}</div>
                  )}
                </div>
                <div style={{ width: 84, padding: "0 3px" }}>
                  <input type="date" value={item.start} onChange={e => e.target.value && updateTask(item.id, "start", e.target.value)}
                    style={{ width: "100%", background: "#1A1D28", border: "1px solid #2D3348", borderRadius: 4, padding: "2px 2px", color: "#9CA3AF", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", outline: "none", cursor: "pointer", colorScheme: "dark" }} />
                </div>
                <div style={{ width: 84, padding: "0 3px" }}>
                  <input type="date" value={item.end} onChange={e => e.target.value && updateTask(item.id, "end", e.target.value)}
                    style={{ width: "100%", background: "#1A1D28", border: "1px solid #2D3348", borderRadius: 4, padding: "2px 2px", color: "#9CA3AF", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", outline: "none", cursor: "pointer", colorScheme: "dark" }} />
                </div>
                <div style={{ width: 30, display: "flex", justifyContent: "center" }}>
                  {hoveredTask === item.id && (
                    <button onClick={() => deleteTask(item.id)} style={{ width: 20, height: 20, borderRadius: 4, border: "none", background: "#2D1B1B", color: "#E05050", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right panel - Gantt */}
        <div ref={chartRef} style={{ flex: 1, overflow: "auto" }}>
          <div style={{ position: "relative", width: totalWidth, minHeight: totalContentHeight }}>
            {weeks.map((_, i) => (
              <div key={i} style={{ position: "absolute", left: i * 7 * DAY_WIDTH, top: 0, width: 1, background: "#1A1D28", height: totalContentHeight }} />
            ))}
            {todayOffset >= 0 && todayOffset * DAY_WIDTH < totalWidth && (
              <div style={{ position: "absolute", left: todayOffset * DAY_WIDTH, top: 0, width: 2, background: "#E05050", height: totalContentHeight, zIndex: 3, opacity: 0.7 }}>
                <div style={{ position: "absolute", top: 4, left: -14, background: "#E05050", color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 600, whiteSpace: "nowrap" }}>TODAY</div>
              </div>
            )}
            {visibleRows.map((item) => {
              if (item.type === "header") return <div key={`h-${item.cat.id}`} style={{ height: ROW_HEIGHT, background: "#181B2440" }} />;
              const startDate = toDate(item.start), endDate = toDate(item.end);
              const left = daysBetween(timelineStart, startDate) * DAY_WIDTH;
              const width = Math.max((daysBetween(startDate, endDate) + 1) * DAY_WIDTH, DAY_WIDTH);
              const c = getColor(item.catId);
              const dur = daysBetween(startDate, endDate) + 1;
              return (
                <div key={item.id} style={{ height: ROW_HEIGHT, position: "relative", background: hoveredTask === item.id ? "#1A1D2860" : "transparent" }}
                  onMouseEnter={() => setHoveredTask(item.id)} onMouseLeave={() => setHoveredTask(null)}>
                  <div style={{ position: "absolute", top: 5, left, width, height: ROW_HEIGHT - 10, borderRadius: 5, background: `linear-gradient(135deg, ${c.bar}, ${c.border})`, cursor: dragInfo ? "grabbing" : "grab", boxShadow: hoveredTask === item.id ? `0 2px 12px ${c.bar}40` : "none", transition: "box-shadow 0.15s", display: "flex", alignItems: "center", overflow: "hidden" }}
                    onMouseDown={e => handleBarMouseDown(e, item.id, "move")}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 7, cursor: "ew-resize" }} onMouseDown={e => handleBarMouseDown(e, item.id, "left")} />
                    <span style={{ padding: "0 10px", fontSize: 10, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textShadow: "0 1px 2px rgba(0,0,0,0.3)", pointerEvents: "none", width: "100%" }}>
                      {item.task} <span style={{ fontWeight: 400, opacity: 0.8 }}>({dur}d)</span>
                    </span>
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 7, cursor: "ew-resize" }} onMouseDown={e => handleBarMouseDown(e, item.id, "right")} />
                  </div>
                  {hoveredTask === item.id && width < 140 && (
                    <div style={{ position: "absolute", top: -30, left: Math.max(0, left), background: "#282C38", color: "#F5F7FA", fontSize: 11, fontWeight: 500, padding: "5px 10px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.5)", pointerEvents: "none", border: `1px solid ${c.bar}50` }}>
                      {item.task} — {dur}d ({startDate.toLocaleDateString("en", { month: "short", day: "numeric" })} → {endDate.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
