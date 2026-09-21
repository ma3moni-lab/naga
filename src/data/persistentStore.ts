// Persistent demo store — saves to localStorage with a 72-hour TTL.
// All staff using the same browser share the same state for up to 72 hrs,
// after which data resets automatically to the original seeded values.

import { PROGRESS_REPORTS, MATERIAL_REQUESTS, LEAVE_REQUESTS } from "./dummy";

// ─── Enhanced Types ───────────────────────────────────────────────────────────

export type ReportComment = {
  id: string;
  author: string;
  role: string;
  text: string;
  date: string;
};

export type EnhancedProgressReport = typeof PROGRESS_REPORTS[0] & {
  comments?: ReportComment[];
  rating?: number;        // 1–5
  reviewNote?: string;    // note left when returning
  videoUrl?: string;
};

// ─── Store shape ──────────────────────────────────────────────────────────────

interface PersistedStore {
  ts: number; // Date.now() when last saved
  progressReports: EnhancedProgressReport[];
  materialRequests: typeof MATERIAL_REQUESTS;
  leaveRequests: typeof LEAVE_REQUESTS;
}

const STORE_KEY = "naga_ops_v1";
const TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

// ─── Load ─────────────────────────────────────────────────────────────────────

function loadStore(): PersistedStore | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PersistedStore;
    if (!s.ts || Date.now() - s.ts > TTL_MS) {
      localStorage.removeItem(STORE_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

const _stored = loadStore();

// ─── Mutable live stores (singleton — shared across all module imports) ───────

export let LIVE_PROGRESS_REPORTS: EnhancedProgressReport[] = _stored
  ? _stored.progressReports
  : PROGRESS_REPORTS.map((r) => ({ ...r }));

export let LIVE_MATERIAL_REQUESTS: typeof MATERIAL_REQUESTS = _stored
  ? _stored.materialRequests
  : MATERIAL_REQUESTS.map((m) => ({ ...m }));

export let LIVE_LEAVE_REQUESTS: typeof LEAVE_REQUESTS = _stored
  ? _stored.leaveRequests
  : LEAVE_REQUESTS.map((l) => ({ ...l }));

// ─── Persist ──────────────────────────────────────────────────────────────────

export function persistStore(): void {
  try {
    const s: PersistedStore = {
      ts: Date.now(),
      progressReports: LIVE_PROGRESS_REPORTS,
      materialRequests: LIVE_MATERIAL_REQUESTS,
      leaveRequests: LIVE_LEAVE_REQUESTS,
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    // Storage quota exceeded — ignore silently
  }
}

// ─── Expiry helpers ───────────────────────────────────────────────────────────

export function getStoreExpiryDate(): Date | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PersistedStore;
    return new Date(s.ts + TTL_MS);
  } catch {
    return null;
  }
}

export function getStoreAgeMs(): number {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return 0;
    const s = JSON.parse(raw) as PersistedStore;
    return Date.now() - s.ts;
  } catch {
    return 0;
  }
}

export function formatExpiryCountdown(expiryDate: Date): string {
  const ms = expiryDate.getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hrs = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export function resetStore(): void {
  localStorage.removeItem(STORE_KEY);
  LIVE_PROGRESS_REPORTS = PROGRESS_REPORTS.map((r) => ({ ...r }));
  LIVE_MATERIAL_REQUESTS = MATERIAL_REQUESTS.map((m) => ({ ...m }));
  LIVE_LEAVE_REQUESTS = LEAVE_REQUESTS.map((l) => ({ ...l }));
}
