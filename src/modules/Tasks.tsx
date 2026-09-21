import { useState, useRef, useEffect, useCallback } from "react";
import { TASKS } from "../data/dummy";
import { logActivity } from "../data/activityLog";
import { showToast } from "../utils/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type UpdateType =
  | "update"
  | "status_change"
  | "query"
  | "reopen"
  | "completion_request"
  | "completion_confirmed"
  | "system";

type TaskUpdate = {
  id: string;
  author: string;
  authorRole: string;
  type: UpdateType;
  text: string;
  timestamp: string;
};

type ReopenRecord = {
  by: string;
  byRole: string;
  at: string;
  reason: string;
};

type TaskStatus = "Todo" | "In Progress" | "Pending Completion" | "Done";

type Task = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigner: string;
  project: string | null;
  priority: "High" | "Medium" | "Low";
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  tags: string[];
  updates: TaskUpdate[];
  reopenHistory: ReopenRecord[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STAFF_MEMBERS = [
  { name: "Emeka Okonkwo", role: "MD / CEO", abbr: "CEO", color: "#D4A843" },
  { name: "Chukwuma Eze", role: "HOWO — Abuja", abbr: "HOWO", color: "#a78bfa" },
  { name: "Lola Adebayo", role: "Finance Manager", abbr: "FIN", color: "#6B9FE5" },
  { name: "Kola Adekunle", role: "PCO — Abuja", abbr: "PCO", color: "#8eb6ec" },
  { name: "Abiodun Fashola", role: "PCO — Palm Court", abbr: "PCO", color: "#8eb6ec" },
  { name: "Ngozi Adeyemi", role: "PCO — Emerald Gardens", abbr: "PCO", color: "#8eb6ec" },
  { name: "Tunde Bakare", role: "PCO — Granite Heights", abbr: "PCO", color: "#8eb6ec" },
  { name: "Ibrahim Lawal", role: "Deputy CEO / Admin", abbr: "ADM", color: "#C084FC" },
  { name: "Samuel Ekele", role: "IVM — Abuja", abbr: "IVM", color: "#b0ccf3" },
  { name: "Sola Ogunlola", role: "Inventory Manager", abbr: "IVM", color: "#b0ccf3" },
  { name: "Blessing Omosu", role: "Estate Manager", abbr: "EST", color: "#6B9FE5" },
  { name: "Yetunde Afolabi", role: "Admin Officer", abbr: "ADM", color: "#C084FC" },
  { name: "Kola Adebisi", role: "PRM", abbr: "PRM", color: "#b0ccf3" },
  { name: "Ngozi Nwosu", role: "Customer Support Officer", abbr: "CSO", color: "#34D1BF" },
];

const PROJECTS_LIST = ["NAGA Palm Court", "Emerald Gardens", "Granite Heights"];

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  High:   { bg: "#FEF2F2", text: "#B91C1C", dot: "#EF4444", border: "#FECACA" },
  Medium: { bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B", border: "#FDE68A" },
  Low:    { bg: "#F9FAFB", text: "#4B5563", dot: "#9CA3AF", border: "#E5E7EB" },
};

const STATUS_CONFIG: Record<TaskStatus, { color: string; bg: string; text: string; icon: string; label: string }> = {
  "Todo":               { color: "#94A3B8", bg: "#F1F5F9", text: "#475569", icon: "○", label: "Todo" },
  "In Progress":        { color: "#F59E0B", bg: "#FFFBEB", text: "#92400E", icon: "◑", label: "In Progress" },
  "Pending Completion": { color: "#6B9FE5", bg: "#EAF2FC", text: "#1e3a6e", icon: "◎", label: "Pending" },
  "Done":               { color: "#10B981", bg: "#ECFDF5", text: "#065F46", icon: "●", label: "Done" },
};

const UPDATE_TYPE_CONFIG: Record<UpdateType, { color: string; label: string }> = {
  update:               { color: "#6B9FE5", label: "Update" },
  status_change:        { color: "#8B5CF6", label: "Status" },
  query:                { color: "#F59E0B", label: "Query" },
  reopen:               { color: "#EF4444", label: "Reopened" },
  completion_request:   { color: "#10B981", label: "Completion" },
  completion_confirmed: { color: "#10B981", label: "Confirmed" },
  system:               { color: "#9CA3AF", label: "System" },
};

const BOARD_COLUMNS: TaskStatus[] = ["Todo", "In Progress", "Pending Completion", "Done"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
function getStaffMember(name: string) {
  return STAFF_MEMBERS.find((s) => s.name === name);
}
function getStaffColor(name: string) {
  return getStaffMember(name)?.color ?? "#6B9FE5";
}
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function isOverdue(dueDate: string, status: TaskStatus) {
  if (status === "Done") return false;
  return new Date(dueDate) < new Date();
}
function nowStr() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}
function seedUpdates(tasks: Task[]): Task[] {
  return tasks.map((t) => ({
    ...t,
    status: t.status as TaskStatus,
    updates: (t as any).updates ?? [],
    reopenHistory: (t as any).reopenHistory ?? [],
  }));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const color = getStaffColor(name);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Quick Status Picker ──────────────────────────────────────────────────────

function QuickStatusPicker({
  task, onMove, onClose,
}: {
  task: Task; onMove: (newStatus: TaskStatus) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-[#E8EAF0] overflow-hidden py-1"
      style={{ minWidth: 190 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 border-b border-[#F0F2F5]">
        <span className="text-[9.5px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Move to…</span>
      </div>
      {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => {
        const cfg = STATUS_CONFIG[s];
        const isCurrent = task.status === s;
        return (
          <button
            key={s}
            disabled={isCurrent}
            onClick={() => { if (!isCurrent) { onMove(s); onClose(); } }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#F7F8FA] disabled:opacity-50 disabled:cursor-default"
          >
            <span className="text-[12px]" style={{ color: cfg.color }}>{cfg.icon}</span>
            <span className="text-[12px] font-medium flex-1" style={{ color: isCurrent ? "#9CA3AF" : "#1e1b4b" }}>{s}</span>
            {isCurrent && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.text }}>current</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Task Card (list view) ────────────────────────────────────────────────────

function TaskCard({
  task, onClick, onStatusChange,
}: {
  task: Task; onClick: () => void; onStatusChange: (newStatus: TaskStatus) => void;
}) {
  const priority = PRIORITY_STYLES[task.priority];
  const statusCfg = STATUS_CONFIG[task.status];
  const overdue = isOverdue(task.dueDate, task.status);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  return (
    <div
      className="bg-white rounded-xl mb-2.5 group transition-all hover:shadow-md"
      style={{ border: "1px solid #E8EAF0", borderLeft: `3px solid ${priority.dot}` }}
    >
      {/* Top row: status badge (tappable) + ID + overdue */}
      <div className="px-3.5 pt-3 pb-0 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowStatusPicker((v) => !v); }}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80 active:scale-95"
            style={{ background: statusCfg.bg, color: statusCfg.text, border: `1px solid ${statusCfg.color}30` }}
            title="Tap to change status"
          >
            <span>{statusCfg.icon}</span>
            {statusCfg.label}
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ marginLeft: 1, opacity: 0.6 }}>
              <path d="M1.5 3l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showStatusPicker && (
            <QuickStatusPicker
              task={task}
              onMove={onStatusChange}
              onClose={() => setShowStatusPicker(false)}
            />
          )}
        </div>

        <span className="text-[10px] font-mono" style={{ color: "#94A3B8" }}>{task.id}</span>
        {overdue && (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
            ⚠ Overdue
          </span>
        )}
      </div>

      {/* Clickable body */}
      <div className="px-3.5 pt-2 pb-3 cursor-pointer" onClick={onClick}>
        <p className="text-[13px] font-semibold leading-snug mb-1 group-hover:text-[#25205B] transition-colors" style={{ color: "#1e1b4b" }}>
          {task.title}
        </p>
        <p className="text-[11px] leading-relaxed mb-2.5 line-clamp-2" style={{ color: "#69707D" }}>
          {task.description}
        </p>

        {/* Tags */}
        {(task.project || task.tags.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.project && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#F1F5F9", color: "#25205B" }}>
                {task.project}
              </span>
            )}
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#6B9FE5" }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Avatar name={task.assignee} size={20} />
            <span className="text-[10.5px]" style={{ color: "#69707D" }}>{task.assignee.split(" ")[0]}</span>
            <span className="text-[10px]" style={{ color: "#C4C9D4" }}>·</span>
            <span className="text-[10px]" style={{ color: "#B0B8C4" }}>{task.assigner.split(" ")[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            {task.updates.length > 0 && (
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: "#9CA3AF" }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1h10v8H6.5L4 10.5V9H1V1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                {task.updates.length}
              </span>
            )}
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: overdue ? "#B91C1C" : "#69707D", background: overdue ? "#FEF2F2" : "transparent" }}
            >
              {formatDate(task.dueDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Pending completion banner */}
      {task.status === "Pending Completion" && (
        <div className="mx-3.5 mb-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: "#EAF2FC", color: "#1e3a6e", border: "1px solid #D3E3F9" }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#6B9FE5" strokeWidth="1.3" />
            <path d="M4 6l1.5 1.5L8 4" stroke="#6B9FE5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Awaiting confirmation from assigner — tap status to update
        </div>
      )}
    </div>
  );
}

// ─── Kanban Card (board view) ─────────────────────────────────────────────────

function KanbanBoardCard({
  task,
  onClick,
  isDragging,
  onDragStart,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: {
  task: Task;
  onClick: () => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
}) {
  const priority = PRIORITY_STYLES[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="rounded-xl bg-white mb-2 group transition-all hover:shadow-md"
      style={{
        border: "1px solid #E8EAF0",
        borderTop: `3px solid ${priority.dot}`,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.45 : 1,
        transform: isDragging ? "scale(0.96) rotate(-1deg)" : "scale(1)",
        transition: "transform 0.1s, opacity 0.1s, box-shadow 0.15s",
        userSelect: "none",
      }}
    >
      {/* Drag handle row */}
      <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
        <span
          className="text-[9.5px] font-mono font-semibold"
          style={{ color: "#94A3B8" }}
        >
          {task.id}
        </span>
        {/* Drag handle icon */}
        <div className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "#9CA3AF" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="2" width="2" height="2" rx="1" />
            <rect x="6" y="2" width="2" height="2" rx="1" />
            <rect x="2" y="6" width="2" height="2" rx="1" />
            <rect x="6" y="6" width="2" height="2" rx="1" />
            <rect x="2" y="10" width="2" height="2" rx="1" />
            <rect x="6" y="10" width="2" height="2" rx="1" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pt-1.5 pb-3">
        <p className="text-[12.5px] font-semibold leading-snug mb-2" style={{ color: "#1e1b4b" }}>
          {task.title}
        </p>

        {/* Priority + overdue */}
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          <span
            className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            style={{ background: priority.bg, color: priority.text, border: `1px solid ${priority.border}` }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: priority.dot }} />
            {task.priority}
          </span>
          {overdue && (
            <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
              ⚠ Overdue
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[9.5px] px-1.5 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#6B9FE5" }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar name={task.assignee} size={20} />
            <span className="text-[10px]" style={{ color: "#69707D" }}>{task.assignee.split(" ")[0]}</span>
          </div>
          <span
            className="text-[10px] font-medium"
            style={{ color: overdue ? "#EF4444" : "#9CA3AF" }}
          >
            {formatDate(task.dueDate)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

function KanbanBoard({
  tasks,
  onCardClick,
  onTaskMove,
}: {
  tasks: Task[];
  onCardClick: (task: Task) => void;
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
}) {
  const dragId = useRef<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);

  const touchTaskId = useRef<string | null>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [touchDraggingId, setTouchDraggingId] = useState<string | null>(null);
  const [touchActiveColumn, setTouchActiveColumn] = useState<TaskStatus | null>(null);
  const columnRefs = useRef<Partial<Record<TaskStatus, HTMLDivElement | null>>>({});

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, taskId: string) {
    dragId.current = taskId;
    setIsDraggingId(taskId);
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragEnd() {
    dragId.current = null;
    setIsDraggingId(null);
    setDragOverColumn(null);
  }
  function handleColDragOver(e: React.DragEvent<HTMLDivElement>, col: TaskStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(col);
  }
  function handleColDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null);
  }
  function handleColDrop(e: React.DragEvent<HTMLDivElement>, col: TaskStatus) {
    e.preventDefault();
    if (dragId.current) onTaskMove(dragId.current, col);
    dragId.current = null;
    setIsDraggingId(null);
    setDragOverColumn(null);
  }
  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>, taskId: string) {
    touchTimer.current = setTimeout(() => {
      touchTaskId.current = taskId;
      setTouchDraggingId(taskId);
    }, 600);
  }
  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!touchTaskId.current) {
      if (touchTimer.current) clearTimeout(touchTimer.current);
      return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    for (const col of BOARD_COLUMNS) {
      const ref = columnRefs.current[col];
      if (ref && el && ref.contains(el as Node)) {
        setTouchActiveColumn(col);
        return;
      }
    }
    setTouchActiveColumn(null);
  }
  function handleTouchEnd() {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    if (touchTaskId.current && touchActiveColumn) onTaskMove(touchTaskId.current, touchActiveColumn);
    touchTaskId.current = null;
    setTouchDraggingId(null);
    setTouchActiveColumn(null);
  }

  const anyDragging = isDraggingId !== null || touchDraggingId !== null;

  return (
    <div className="overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      <div
        className="flex gap-3"
        style={{ minWidth: `${BOARD_COLUMNS.length * 260}px` }}
      >
        {BOARD_COLUMNS.map((col) => {
          const cfg = STATUS_CONFIG[col];
          const items = tasks.filter((t) => t.status === col);
          const isOver = dragOverColumn === col || touchActiveColumn === col;

          return (
            <div
              key={col}
              ref={(el) => { columnRefs.current[col] = el; }}
              className="flex flex-col rounded-2xl flex-1 min-w-[240px] transition-all"
              style={{
                background: isOver ? "#F4F7FF" : "#F8FAFC",
                border: `1px solid ${isOver ? "rgba(107,159,229,0.4)" : "#E8EAF0"}`,
                outline: isOver ? "2px solid rgba(107,159,229,0.35)" : "2px solid transparent",
                outlineOffset: "1px",
              }}
              onDragOver={(e) => handleColDragOver(e, col)}
              onDragLeave={handleColDragLeave}
              onDrop={(e) => handleColDrop(e, col)}
            >
              {/* Column header */}
              <div
                className="px-3.5 pt-3 pb-2.5 flex items-center justify-between shrink-0 rounded-t-2xl"
                style={{
                  borderBottom: `1px solid ${cfg.color}22`,
                  borderTop: `3px solid ${cfg.color}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[15px]" style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span className="text-[12px] font-bold tracking-tight" style={{ color: cfg.text }}>{col}</span>
                </div>
                <span
                  className="text-[10.5px] font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center"
                  style={{ background: `${cfg.color}22`, color: cfg.color }}
                >
                  {items.length}
                </span>
              </div>

              {/* Cards area */}
              <div
                className="flex-1 overflow-y-auto px-2.5 pt-2.5 pb-2"
                style={{
                  minHeight: 120,
                  maxHeight: `calc(100dvh - var(--demo-bar-h, 0px) - 52px - 210px)`,
                  WebkitOverflowScrolling: "touch",
                } as React.CSSProperties}
              >
                {items.length === 0 && !isOver && (
                  <div
                    className="text-center py-10 rounded-xl border-2 border-dashed flex flex-col items-center gap-2"
                    style={{ color: "#C4C9D4", borderColor: "#E4E7EC" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
                      <rect x="3" y="11" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.25" />
                      <rect x="3" y="17" width="15" height="3" rx="1.5" fill="currentColor" opacity="0.15" />
                    </svg>
                    <span className="text-[11px]">Drop tasks here</span>
                  </div>
                )}

                {items.map((task) => (
                  <KanbanBoardCard
                    key={task.id}
                    task={task}
                    onClick={() => onCardClick(task)}
                    isDragging={isDraggingId === task.id || touchDraggingId === task.id}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, task.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                ))}

                {isOver && anyDragging && (
                  <div
                    className="rounded-xl border-2 border-dashed h-14 mb-2"
                    style={{ borderColor: "#6B9FE5", background: "rgba(107,159,229,0.06)" }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reopen Modal ─────────────────────────────────────────────────────────────

function ReopenModal({
  task, actor, actorRole, onConfirm, onClose,
}: {
  task: Task; actor: string; actorRole: string; onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF2F2" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1l2.4 5L17 7l-4 3.8.9 5.2L9 13.5l-4.9 2.5.9-5.2L1 7l5.6-1L9 1z" stroke="#EF4444" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[15px]" style={{ color: "#1e1b4b" }}>Reopen Task</h3>
            <p className="text-[11px]" style={{ color: "#69707D" }}>{task.id} · {task.title}</p>
          </div>
        </div>
        <div className="mb-3 px-3 py-2.5 rounded-lg text-[11.5px]" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          This task is currently <strong>Done</strong>. Reopening will move it back to <strong>Todo</strong>.
        </div>
        <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#69707D" }}>
          Reason for reopening *
        </label>
        <textarea
          rows={3}
          className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
          style={{ borderColor: "#E8EAF0", color: "#25205B" }}
          placeholder="Why is this task being reopened?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border" style={{ borderColor: "#E8EAF0", color: "#69707D" }}>Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm rounded-xl font-semibold text-white disabled:opacity-40"
            style={{ background: "#EF4444" }}
          >
            Reopen Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────

function TaskDetailModal({
  task, actor, actorRole, isCEO, onClose, onUpdate,
}: {
  task: Task; actor: string; actorRole: string; isCEO: boolean; onClose: () => void; onUpdate: (updated: Task) => void;
}) {
  const [updateText, setUpdateText] = useState("");
  const [queryText, setQueryText] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "timeline">("details");
  const [showQueryInput, setShowQueryInput] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const isAssignee = actor === task.assignee;
  const isAssigner = actor === task.assigner;
  const canQuery = (isCEO || isAssigner) && task.status !== "Done";
  const canUpdate = isAssignee && task.status !== "Done" && task.status !== "Pending Completion";
  const canRequestCompletion = isAssignee && task.status === "In Progress";
  const canConfirmCompletion = (isCEO || isAssigner) && task.status === "Pending Completion";
  const canMoveToInProgress = task.status === "Todo";
  const canReopen = (isCEO || isAssigner) && task.status === "Done";

  const priority = PRIORITY_STYLES[task.priority];
  const statusCfg = STATUS_CONFIG[task.status];
  const overdue = isOverdue(task.dueDate, task.status);
  const assigneeStaff = getStaffMember(task.assignee);
  const assignerStaff = getStaffMember(task.assigner);

  function addUpdate(type: UpdateType, text: string) {
    const upd: TaskUpdate = { id: "UPD-" + Date.now(), author: actor, authorRole: actorRole, type, text, timestamp: nowStr() };
    return [...task.updates, upd];
  }
  function handlePostUpdate() {
    if (!updateText.trim()) return;
    onUpdate({ ...task, updates: addUpdate("update", updateText.trim()) });
    setUpdateText("");
  }
  function handleQuery() {
    if (!queryText.trim()) return;
    onUpdate({ ...task, updates: addUpdate("query", queryText.trim()) });
    setQueryText("");
    setShowQueryInput(false);
  }
  function handleMoveToInProgress() {
    onUpdate({ ...task, status: "In Progress", updates: addUpdate("status_change", `${actor} moved task from Todo to In Progress.`) });
  }
  function handleRequestCompletion() {
    onUpdate({ ...task, status: "Pending Completion", updates: addUpdate("completion_request", `${actor} has marked this task as complete from their end and is awaiting confirmation.`) });
  }
  function handleConfirmCompletion() {
    onUpdate({ ...task, status: "Done", updates: addUpdate("completion_confirmed", `${actor} confirmed task completion.`) });
  }
  function handleReopen(reason: string) {
    const record: ReopenRecord = { by: actor, byRole: actorRole, at: nowStr(), reason };
    onUpdate({ ...task, status: "Todo", updates: addUpdate("reopen", `Task reopened by ${actor}. Reason: ${reason}`), reopenHistory: [...task.reopenHistory, record] });
    setShowReopenModal(false);
  }

  useEffect(() => {
    if (activeTab === "timeline" && timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [activeTab, task.updates.length]);

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
          style={{ maxWidth: 700, maxHeight: "92vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-mono font-semibold" style={{ color: "#6B9FE5" }}>{task.id}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: priority.bg, color: priority.text, border: `1px solid ${priority.border}` }}>
                    {task.priority} Priority
                  </span>
                  {overdue && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#B91C1C" }}>⚠ Overdue</span>}
                </div>
                <h2 className="text-[17px] font-bold leading-snug" style={{ color: "#1e1b4b", fontFamily: "var(--font-display)" }}>
                  {task.title}
                </h2>
              </div>
              <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#4B5563] text-xl shrink-0 leading-none mt-1">×</button>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{ background: statusCfg.bg, color: statusCfg.text, border: `1px solid ${statusCfg.color}30` }}
              >
                <span>{statusCfg.icon}</span>
                {task.status}
              </span>
              {task.project && (
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: "#F1F5F9", color: "#475569" }}>
                  {task.project}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-6 pt-1" style={{ borderBottom: "1px solid #F1F5F9" }}>
            {(["details", "timeline"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2.5 text-[12px] font-semibold capitalize transition-colors relative"
                style={{ color: activeTab === tab ? "#25205B" : "#9CA3AF" }}
              >
                {tab}
                {tab === "timeline" && task.updates.length > 0 && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#6B9FE5" }}>
                    {task.updates.length}
                  </span>
                )}
                {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#25205B" }} />}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "details" && (
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Description</label>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#374151" }}>{task.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Assigned To</label>
                    <div className="flex items-center gap-2">
                      <Avatar name={task.assignee} size={30} />
                      <div>
                        <div className="text-[12.5px] font-semibold" style={{ color: "#1e1b4b" }}>{task.assignee}</div>
                        <div className="text-[10.5px]" style={{ color: "#6B9FE5" }}>{assigneeStaff?.role ?? "Staff"}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Assigned By</label>
                    <div className="flex items-center gap-2">
                      <Avatar name={task.assigner} size={30} />
                      <div>
                        <div className="text-[12.5px] font-semibold" style={{ color: "#1e1b4b" }}>{task.assigner}</div>
                        <div className="text-[10.5px]" style={{ color: "#6B9FE5" }}>{assignerStaff?.role ?? "Staff"}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#9CA3AF" }}>Created</label>
                    <span className="text-[12.5px]" style={{ color: "#374151" }}>{formatDate(task.createdAt)}</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#9CA3AF" }}>Due Date</label>
                    <span className="text-[12.5px] font-medium" style={{ color: overdue ? "#EF4444" : "#374151" }}>
                      {formatDate(task.dueDate)} {overdue && "· Overdue"}
                    </span>
                  </div>
                </div>
                {task.tags.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: "#EAF2FC", color: "#6B9FE5" }}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {task.reopenHistory.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Reopen History</label>
                    <div className="space-y-2">
                      {task.reopenHistory.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-[11.5px]" style={{ background: "#FEF2F2" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0"><path d="M2 7a5 5 0 105-5H5M3 5L1 7l2 2" stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <div>
                            <span className="font-semibold" style={{ color: "#B91C1C" }}>{r.by}</span>
                            <span style={{ color: "#69707D" }}> reopened on {r.at} — "{r.reason}"</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="p-6" ref={timelineRef}>
                {task.updates.length === 0 ? (
                  <div className="text-center py-12 text-[12px]" style={{ color: "#9CA3AF" }}>
                    No activity yet. Updates, queries, and status changes will appear here.
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[15px] top-0 bottom-4 w-px" style={{ background: "#E8EAF0" }} />
                    <div className="space-y-4">
                      {task.updates.map((upd) => {
                        const cfg = UPDATE_TYPE_CONFIG[upd.type];
                        return (
                          <div key={upd.id} className="flex items-start gap-3 relative">
                            <div
                              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0 z-10"
                              style={{ background: getStaffColor(upd.author) }}
                            >
                              {getInitials(upd.author)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-[12px]" style={{ color: "#1e1b4b" }}>{upd.author}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: cfg.color + "18", color: cfg.color }}>
                                  {cfg.label}
                                </span>
                                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{formatDateTime(upd.timestamp)}</span>
                              </div>
                              <div
                                className="text-[12.5px] leading-relaxed px-3 py-2 rounded-xl"
                                style={{ background: upd.type === "query" ? "#FFFBEB" : "#F8FAFC", color: "#374151", border: upd.type === "query" ? "1px solid #FDE68A" : "1px solid #F1F5F9" }}
                              >
                                {upd.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {canUpdate && (
                  <div className="mt-5 pt-4" style={{ borderTop: "1px solid #F1F5F9" }}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Post an Update</label>
                    <textarea
                      rows={3}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#6B9FE5] transition-colors"
                      style={{ borderColor: "#E8EAF0", color: "#25205B" }}
                      placeholder="Share a progress update…"
                      value={updateText}
                      onChange={(e) => setUpdateText(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <button onClick={handlePostUpdate} disabled={!updateText.trim()} className="px-4 py-2 text-sm rounded-xl font-semibold text-white disabled:opacity-40" style={{ background: "#6B9FE5" }}>
                        Post Update
                      </button>
                    </div>
                  </div>
                )}
                {canQuery && showQueryInput && (
                  <div className="mt-5 pt-4" style={{ borderTop: "1px solid #F1F5F9" }}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#F59E0B" }}>
                      Send Query to {task.assignee.split(" ")[0]}
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none transition-colors"
                      style={{ borderColor: "#FDE68A", color: "#25205B", background: "#FFFBEB" }}
                      placeholder="Ask a question or request a status update…"
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => { setShowQueryInput(false); setQueryText(""); }} className="px-3 py-2 text-xs rounded-xl border" style={{ borderColor: "#E8EAF0", color: "#69707D" }}>Cancel</button>
                      <button onClick={handleQuery} disabled={!queryText.trim()} className="px-4 py-2 text-sm rounded-xl font-semibold text-white disabled:opacity-40" style={{ background: "#F59E0B" }}>
                        Send Query
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center gap-2 flex-wrap" style={{ borderTop: "1px solid #F1F5F9", background: "#FAFBFC" }}>
            {canMoveToInProgress && (isAssignee || isCEO || isAssigner) && (
              <button onClick={() => { handleMoveToInProgress(); setActiveTab("timeline"); }} className="px-4 py-2 text-[12px] font-semibold rounded-xl text-white" style={{ background: "#F59E0B" }}>
                Start Task
              </button>
            )}
            {canRequestCompletion && (
              <button onClick={() => { handleRequestCompletion(); setActiveTab("timeline"); }} className="px-4 py-2 text-[12px] font-semibold rounded-xl text-white" style={{ background: "#6B9FE5" }}>
                Mark Complete (My Side)
              </button>
            )}
            {canConfirmCompletion && (
              <button onClick={() => { handleConfirmCompletion(); setActiveTab("timeline"); }} className="px-4 py-2 text-[12px] font-semibold rounded-xl text-white" style={{ background: "#10B981" }}>
                Confirm &amp; Close Task
              </button>
            )}
            {canQuery && !showQueryInput && (
              <button onClick={() => { setShowQueryInput(true); setActiveTab("timeline"); }} className="px-4 py-2 text-[12px] font-semibold rounded-xl" style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }}>
                Send Query
              </button>
            )}
            {canUpdate && (
              <button onClick={() => setActiveTab("timeline")} className="px-4 py-2 text-[12px] font-semibold rounded-xl" style={{ background: "#EAF2FC", color: "#25205B" }}>
                Post Update
              </button>
            )}
            {canReopen && (
              <button onClick={() => setShowReopenModal(true)} className="px-4 py-2 text-[12px] font-semibold rounded-xl ml-auto" style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}>
                Reopen Task
              </button>
            )}
          </div>
        </div>
      </div>

      {showReopenModal && (
        <ReopenModal task={task} actor={actor} actorRole={actorRole} onConfirm={handleReopen} onClose={() => setShowReopenModal(false)} />
      )}
    </>
  );
}

// ─── New Task Modal ────────────────────────────────────────────────────────────

function NewTaskModal({ actor, actorRole, onClose, onAdd }: { actor: string; actorRole: string; onClose: () => void; onAdd: (task: Task) => void }) {
  const [form, setForm] = useState({ title: "", description: "", assignee: "", priority: "Medium" as Task["priority"], project: "", dueDate: "", tagsInput: "" });
  const [staffSearch, setStaffSearch] = useState("");
  const [staffOpen, setStaffOpen] = useState(false);
  const staffRef = useRef<HTMLDivElement>(null);

  const filteredStaff = STAFF_MEMBERS.filter(
    (s) => s.name !== actor && (s.name.toLowerCase().includes(staffSearch.toLowerCase()) || s.role.toLowerCase().includes(staffSearch.toLowerCase()))
  );

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (staffRef.current && !staffRef.current.contains(e.target as Node)) setStaffOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate || !form.assignee) return;
    const tags = form.tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const newTask: Task = {
      id: "TSK-" + String(Date.now()).slice(-4),
      title: form.title.trim(),
      description: form.description.trim(),
      assignee: form.assignee,
      assigner: actor,
      project: form.project || null,
      priority: form.priority,
      status: "Todo",
      dueDate: form.dueDate,
      createdAt: nowStr().slice(0, 10),
      tags,
      updates: [{
        id: "UPD-0", author: actor, authorRole: actorRole, type: "system",
        text: `Task created by ${actor} and assigned to ${form.assignee}.`,
        timestamp: nowStr(),
      }],
      reopenHistory: [],
    };
    onAdd(newTask);
    onClose();
  }

  const selectedStaff = STAFF_MEMBERS.find((s) => s.name === form.assignee);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full my-8" style={{ maxWidth: 560 }}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div>
            <h2 className="text-[17px] font-bold" style={{ color: "#1e1b4b", fontFamily: "var(--font-display)" }}>Create New Task</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>Assign work and set expectations</p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#4B5563] text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Task Title *</label>
            <input
              required
              className="w-full border rounded-xl px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-[#6B9FE5] transition-colors"
              style={{ borderColor: "#E8EAF0", color: "#1e1b4b" }}
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Description</label>
            <textarea
              rows={3}
              className="w-full border rounded-xl px-3.5 py-2.5 text-[13px] resize-none focus:outline-none focus:border-[#6B9FE5] transition-colors"
              style={{ borderColor: "#E8EAF0", color: "#374151" }}
              placeholder="Add context, scope, and requirements…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Assign To *</label>
            <div className="relative" ref={staffRef}>
              <div
                className="w-full border rounded-xl px-3.5 py-2.5 cursor-pointer flex items-center gap-2.5 transition-colors"
                style={{ borderColor: staffOpen ? "#6B9FE5" : "#E8EAF0" }}
                onClick={() => setStaffOpen(!staffOpen)}
              >
                {selectedStaff ? (
                  <>
                    <Avatar name={selectedStaff.name} size={26} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: "#1e1b4b" }}>{selectedStaff.name}</div>
                      <div className="text-[10.5px]" style={{ color: "#6B9FE5" }}>{selectedStaff.role}</div>
                    </div>
                  </>
                ) : (
                  <span className="text-[13px]" style={{ color: "#9CA3AF" }}>Select a staff member…</span>
                )}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-auto shrink-0" style={{ transform: staffOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", color: "#9CA3AF" }}>
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {staffOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border z-50 overflow-hidden" style={{ borderColor: "#E8EAF0" }}>
                  <div className="p-2">
                    <input
                      autoFocus
                      className="w-full px-3 py-2 text-[12px] rounded-lg border focus:outline-none"
                      style={{ borderColor: "#E8EAF0", color: "#1e1b4b" }}
                      placeholder="Search by name or role…"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                    {filteredStaff.length === 0 ? (
                      <div className="px-4 py-3 text-[12px] text-center" style={{ color: "#9CA3AF" }}>No staff found</div>
                    ) : filteredStaff.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8FAFC] transition-colors text-left"
                        onClick={() => { setForm({ ...form, assignee: s.name }); setStaffOpen(false); setStaffSearch(""); }}
                      >
                        <Avatar name={s.name} size={28} />
                        <div>
                          <div className="text-[12.5px] font-semibold" style={{ color: "#1e1b4b" }}>{s.name}</div>
                          <div className="text-[10.5px]" style={{ color: "#6B9FE5" }}>{s.role}</div>
                        </div>
                        {form.assignee === s.name && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-auto shrink-0"><path d="M2 7l4 4 6-6" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Priority</label>
              <div className="flex gap-2">
                {(["High", "Medium", "Low"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className="flex-1 py-2 rounded-xl text-[11px] font-semibold border transition-all"
                    style={{
                      background: form.priority === p ? PRIORITY_STYLES[p].bg : "white",
                      color: form.priority === p ? PRIORITY_STYLES[p].text : "#9CA3AF",
                      borderColor: form.priority === p ? PRIORITY_STYLES[p].dot + "60" : "#E8EAF0",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Project</label>
              <select
                className="w-full border rounded-xl px-3 py-2.5 text-[12.5px] focus:outline-none focus:border-[#6B9FE5] transition-colors"
                style={{ borderColor: "#E8EAF0", color: form.project ? "#1e1b4b" : "#9CA3AF" }}
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
              >
                <option value="">No project</option>
                {PROJECTS_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Due Date *</label>
              <input
                required
                type="date"
                className="w-full border rounded-xl px-3 py-2.5 text-[12.5px] focus:outline-none focus:border-[#6B9FE5] transition-colors"
                style={{ borderColor: "#E8EAF0", color: "#1e1b4b" }}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Tags</label>
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-[12.5px] focus:outline-none focus:border-[#6B9FE5] transition-colors"
                style={{ borderColor: "#E8EAF0", color: "#1e1b4b" }}
                placeholder="finance, construction…"
                value={form.tagsInput}
                onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
              />
              <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Comma-separated</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2" style={{ borderTop: "1px solid #F1F5F9" }}>
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm rounded-xl border" style={{ borderColor: "#E8EAF0", color: "#69707D" }}>Cancel</button>
            <button
              type="submit"
              disabled={!form.title.trim() || !form.dueDate || !form.assignee}
              className="px-5 py-2.5 text-sm rounded-xl font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: "#25205B" }}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Tasks() {
  const staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const actor: string = staffInfo.name ?? "Emeka Okonkwo";
  const actorRoleKey: string = staffInfo.role ?? "ceo";
  const actorRole: string = getStaffMember(actor)?.role ?? actorRoleKey.toUpperCase();
  const isCEO = actorRoleKey === "ceo";

  const [tasks, setTasks] = useState<Task[]>(() => seedUpdates(TASKS as any[]));
  const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const statuses: TaskStatus[] = ["Todo", "In Progress", "Pending Completion", "Done"];

  const counts: Record<TaskStatus, number> = {
    "Todo": tasks.filter((t) => t.status === "Todo").length,
    "In Progress": tasks.filter((t) => t.status === "In Progress").length,
    "Pending Completion": tasks.filter((t) => t.status === "Pending Completion").length,
    "Done": tasks.filter((t) => t.status === "Done").length,
  };

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  const filteredTasks = tasks.filter((t) => {
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    const matchProject = filterProject ? t.project === filterProject : true;
    const matchSearch = search
      ? t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.project ?? "").toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.includes(search.toLowerCase()))
      : true;
    return matchStatus && matchProject && matchSearch;
  });

  const handleUpdateTask = useCallback((updated: Task) => {
    const prev = tasks.find((t) => t.id === updated.id);
    setTasks((all) => all.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTask?.id === updated.id) setSelectedTask(updated);

    const lastUpd = updated.updates[updated.updates.length - 1];
    if (lastUpd) {
      if (lastUpd.type === "query") showToast(`Query sent to ${updated.assignee.split(" ")[0]}`, "warning");
      else if (lastUpd.type === "completion_request") showToast("Awaiting confirmation from assigner", "info");
      else if (lastUpd.type === "completion_confirmed") showToast("Task confirmed as complete", "success");
      else if (lastUpd.type === "reopen") showToast("Task reopened and moved to Todo", "warning");
      else if (lastUpd.type === "update") showToast("Progress update posted", "info");
    }

    if (prev?.status !== updated.status) {
      logActivity({
        timestamp: nowStr(), actor, role: actorRole, action: "Task Status Updated",
        module: "Tasks", detail: `Task "${updated.title}" moved to ${updated.status}.`, ref: updated.id, severity: "info",
      });
    }
  }, [tasks, selectedTask, actor, actorRole]);

  const handleAdd = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev]);
    showToast(`Task assigned to ${task.assignee.split(" ")[0]}`, "success");
    logActivity({
      timestamp: nowStr(), actor, role: actorRole, action: "Task Created",
      module: "Tasks", detail: `New task "${task.title}" assigned to ${task.assignee}. Due: ${task.dueDate}.`, ref: task.id, severity: "info",
    });
  }, [actor, actorRole]);

  const visibleStatuses = filterStatus ? [filterStatus] : statuses;

  return (
    <div className="flex flex-col h-full" style={{ background: "#F7F8FA", fontFamily: "var(--font-sans)" }}>

      {/* ── Header ── */}
      <div className="px-4 md:px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid #ECEEF2" }}>

        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <h1 className="text-[20px] font-bold" style={{ color: "#1e1b4b", fontFamily: "var(--font-display)" }}>
                Task Board
              </h1>
              {overdueCount > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
                >
                  {overdueCount} overdue
                </span>
              )}
            </div>
            <p className="text-[12px]" style={{ color: "#69707D" }}>
              {tasks.length} tasks · {counts["In Progress"]} in progress · {counts["Pending Completion"]} awaiting confirmation
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View toggle */}
            <div className="flex items-center rounded-xl p-0.5 gap-0.5" style={{ background: "#ECEEF2" }}>
              {(["list", "board"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={mode === "list" ? "List view" : "Board view"}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                  style={{
                    background: viewMode === mode ? "white" : "transparent",
                    color: viewMode === mode ? "#25205B" : "#69707D",
                    boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {mode === "list" ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
                      <rect x="1" y="6" width="8" height="2" rx="1" fill="currentColor" />
                      <rect x="1" y="10" width="10" height="2" rx="1" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="4" height="12" rx="1.5" fill="currentColor" />
                      <rect x="7" y="1" width="4" height="12" rx="1.5" fill="currentColor" opacity="0.6" />
                      <rect x="13" y="1" width="4" height="12" rx="1.5" fill="currentColor" opacity="0.35" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-md active:scale-95"
              style={{ background: "#25205B" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
              New Task
            </button>
          </div>
        </div>

        {/* Search + Status filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative sm:w-52 shrink-0">
            <svg
              width="13" height="13" viewBox="0 0 12 12" fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#9CA3AF" }}
            >
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] focus:outline-none focus:border-[#6B9FE5] transition-colors"
              style={{ border: "1px solid #E8EAF0", color: "#1e1b4b", background: "white" }}
            />
          </div>

          {/* Filter chips — horizontal scroll on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } as React.CSSProperties}>
            <button
              onClick={() => setFilterStatus(null)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all"
              style={{
                background: filterStatus === null ? "#1e1b4b" : "white",
                color: filterStatus === null ? "white" : "#69707D",
                border: `1px solid ${filterStatus === null ? "#1e1b4b" : "#E8EAF0"}`,
              }}
            >
              All
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: filterStatus === null ? "rgba(255,255,255,0.2)" : "#F1F5F9", color: filterStatus === null ? "white" : "#69707D" }}>
                {tasks.length}
              </span>
            </button>

            {statuses.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const active = filterStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all"
                  style={{
                    background: active ? cfg.color : "white",
                    color: active ? "white" : cfg.text,
                    border: `1px solid ${active ? cfg.color : cfg.color + "50"}`,
                  }}
                >
                  <span>{cfg.icon}</span>
                  {s === "Pending Completion" ? "Pending" : s}
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? "rgba(255,255,255,0.25)" : `${cfg.color}18`, color: active ? "white" : cfg.color }}
                  >
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Project filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pt-2 pb-0.5" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } as React.CSSProperties}>
            <button
              onClick={() => setFilterProject(null)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all"
              style={{
                background: filterProject === null ? "#6B9FE5" : "white",
                color: filterProject === null ? "white" : "#69707D",
                border: `1px solid ${filterProject === null ? "#6B9FE5" : "#E8EAF0"}`,
              }}
            >
              All Projects
            </button>
            {PROJECTS_LIST.map((p) => {
              const active = filterProject === p;
              const projectCount = tasks.filter((t) => t.project === p).length;
              return (
                <button
                  key={p}
                  onClick={() => setFilterProject(active ? null : p)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all"
                  style={{
                    background: active ? "#1a1645" : "white",
                    color: active ? "#D4A843" : "#475569",
                    border: `1px solid ${active ? "#1a1645" : "#E8EAF0"}`,
                  }}
                >
                  {p}
                  <span
                    className="text-[9px] font-bold px-1 py-0.5 rounded-full"
                    style={{ background: active ? "rgba(212,168,67,0.25)" : "#F1F5F9", color: active ? "#D4A843" : "#94A3B8" }}
                  >
                    {projectCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-6" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

        {/* No results */}
        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
              <circle cx="24" cy="24" r="20" fill="#F1F5F9" />
              <path d="M16 24h16M24 16v16" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            </svg>
            <p className="text-[14px] font-semibold" style={{ color: "#475569" }}>No tasks found</p>
            <p className="text-[12px] mt-1" style={{ color: "#94A3B8" }}>
              {search ? `No results for "${search}"` : "Create a new task to get started"}
            </p>
          </div>
        )}

        {/* ── Board view ── */}
        {viewMode === "board" && filteredTasks.length > 0 && (
          <KanbanBoard
            tasks={filteredTasks}
            onCardClick={setSelectedTask}
            onTaskMove={(taskId, newStatus) => {
              setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
              showToast("Task moved", "info");
            }}
          />
        )}

        {/* ── List view ── */}
        {viewMode === "list" && filteredTasks.length > 0 && (
          <>
            {/* Mobile: single scrollable list grouped by status */}
            <div className="sm:hidden space-y-6">
              {visibleStatuses.map((status) => {
                const items = filteredTasks.filter((t) => t.status === status);
                if (items.length === 0) return null;
                const cfg = STATUS_CONFIG[status];
                return (
                  <div key={status}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
                    >
                      <span style={{ color: cfg.color }}>{cfg.icon}</span>
                      <span className="text-[12px] font-bold" style={{ color: cfg.text }}>{status}</span>
                      <span className="ml-auto text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                        {items.length}
                      </span>
                    </div>
                    {items.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                        onStatusChange={(newStatus) => {
                          setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
                          showToast(`Moved to ${newStatus}`, "info");
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Desktop: multi-column grid */}
            <div
              className="hidden sm:grid gap-4"
              style={{ gridTemplateColumns: `repeat(${visibleStatuses.length}, minmax(0, 1fr))` }}
            >
              {visibleStatuses.map((status) => {
                const cfg = STATUS_CONFIG[status];
                const items = filteredTasks.filter((t) => t.status === status);
                return (
                  <div key={status}>
                    <div
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-3"
                      style={{ borderTop: `3px solid ${cfg.color}`, background: cfg.bg, border: `1px solid ${cfg.color}30`, borderTopColor: cfg.color }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]" style={{ color: cfg.color }}>{cfg.icon}</span>
                        <span className="text-[12px] font-bold" style={{ color: cfg.text }}>{status}</span>
                      </div>
                      <span className="text-[10.5px] font-bold w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${cfg.color}22`, color: cfg.color }}>
                        {items.length}
                      </span>
                    </div>
                    <div>
                      {items.length === 0 ? (
                        <div className="text-center py-10 text-[11px] rounded-xl border-2 border-dashed" style={{ color: "#C4C9D4", borderColor: "#E4E7EC" }}>
                          No tasks
                        </div>
                      ) : items.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                          onStatusChange={(newStatus) => {
                            setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
                            showToast(`Moved to ${newStatus}`, "info");
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showNew && (
        <NewTaskModal actor={actor} actorRole={actorRole} onClose={() => setShowNew(false)} onAdd={handleAdd} />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          actor={actor}
          actorRole={actorRole}
          isCEO={isCEO}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
    </div>
  );
}
