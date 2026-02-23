import axios from "axios";

//Declare interfaces for worker, shift, result and apiList
interface Worker {
  id: number;
  name: string;
  status: number; // 0 = active, 1 or 2 = inactive
}

interface Shift {
  id: number;
  workerId: number;
  cancelledAt: string | null;
  endAt: string;
}

interface Result {
  name: string;
  shifts: number;
}

interface ApiList<T> {
  data: T[];
  links?: { next?: string | null };
}

//Use API_BASE from .env or localhost:3000
const API_BASE = process.env.API_BASE || "http://localhost:3000";

// ---------------------- Helpers ----------------------

/**
 * Fetches all pages from a paginated API endpoint
 * Follows next links until all data is retrieved
 */
async function fetchAllPages<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    try {
      const response = await axios.get<ApiList<T>>(nextUrl);
      const page: ApiList<T> = response.data;

      if (Array.isArray(page?.data)) {
        items.push(...page.data);
      }

      nextUrl = page?.links?.next || null;
    } catch {
      // Fail silently, return what we have so far
      break;
    }
  }

  return items;
}

/**
 * Returns true if worker is active (status === 0)
 */
function isWorkerActive(worker: Worker): boolean {
  return worker.status === 0;
}

/**
 * Returns true if shift is completed (not cancelled and ended in the past)
 */
function isShiftCompleted(shift: Shift): boolean {
  return !shift.cancelledAt && new Date(shift.endAt) <= new Date();
}

// ---------------------- Main Logic ----------------------

/**
 * Fetches top 3 workers by completed shifts
 * Only considers active workers and completed shifts
 */
async function fetchTopWorkers(): Promise<Result[]> {
  try {
    // Fetch all workers and shifts concurrently
    const [workers, shifts] = await Promise.all([
      fetchAllPages<Worker>(`${API_BASE}/workers`),
      fetchAllPages<Shift>(`${API_BASE}/shifts`),
    ]);

    // Filter active workers and create lookup structures
    const activeWorkers = workers.filter(isWorkerActive);
    const activeWorkerIds = new Set(activeWorkers.map((w) => w.id));
    const workerMap = new Map(activeWorkers.map((w) => [w.id, w]));

    // Count completed shifts for each active worker
    const shiftCounts = new Map<number, number>();
    shifts.forEach((shift) => {
      if (activeWorkerIds.has(shift.workerId) && isShiftCompleted(shift)) {
        shiftCounts.set(shift.workerId, (shiftCounts.get(shift.workerId) || 0) + 1);
      }
    });

    // Convert counts to result objects
    const results: Result[] = [];
    workerMap.forEach((worker, id) => {
      const count = shiftCounts.get(id) || 0;
      if (count > 0) {
        results.push({ name: worker.name, shifts: count });
      }
    });

    // Sort by shift count (descending) and name (ascending for ties)
    return results.sort((a, b) => b.shifts - a.shifts || a.name.localeCompare(b.name)).slice(0, 3);
  } catch {
    // Return empty array on error
    return [];
  }
}

// Execute script - output only the JSON array
fetchTopWorkers()
  .then((results) => {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(() => {
    console.log(JSON.stringify([], null, 2));
    process.exit(0);
  });
