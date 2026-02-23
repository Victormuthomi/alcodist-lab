import axios from "axios";

//Declare interfaces for workplace, shift, result and apiList
interface Workplace {
  id: number;
  name: string;
  status: number; // 0 = active, 1 or 2 = inactive
}

interface Shift {
  id: number;
  workplaceId: number;
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
 * Returns true if workplace is active (status === 0)
 */
function isWorkplaceActive(wp: Workplace): boolean {
  return wp.status === 0;
}

/**
 * Returns true if shift is completed (not cancelled and ended in the past)
 */
function isShiftCompleted(shift: Shift): boolean {
  return !shift.cancelledAt && new Date(shift.endAt) <= new Date();
}

// ---------------------- Main Logic ----------------------

/**
 * Fetches top 3 workplaces by completed shifts
 * Only considers active workplaces and completed shifts
 */
async function fetchTopWorkplaces(): Promise<Result[]> {
  try {
    // Fetch all workplaces and shifts concurrently
    const [workplaces, shifts] = await Promise.all([
      fetchAllPages<Workplace>(`${API_BASE}/workplaces`),
      fetchAllPages<Shift>(`${API_BASE}/shifts`),
    ]);

    // Filter active workplaces and create lookup structures
    const activeWorkplaces = workplaces.filter(isWorkplaceActive);
    const activeWorkplaceIds = new Set(activeWorkplaces.map((wp) => wp.id));
    const workplaceMap = new Map(activeWorkplaces.map((wp) => [wp.id, wp]));

    // Count completed shifts for each active workplace
    const shiftCounts = new Map<number, number>();
    shifts.forEach((shift) => {
      if (activeWorkplaceIds.has(shift.workplaceId) && isShiftCompleted(shift)) {
        shiftCounts.set(shift.workplaceId, (shiftCounts.get(shift.workplaceId) || 0) + 1);
      }
    });

    // Convert counts to result objects
    const results: Result[] = [];
    workplaceMap.forEach((workplace, id) => {
      const count = shiftCounts.get(id) || 0;
      if (count > 0) {
        results.push({ name: workplace.name, shifts: count });
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
fetchTopWorkplaces()
  .then((results) => {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(() => {
    console.log(JSON.stringify([], null, 2));
    process.exit(0);
  });
