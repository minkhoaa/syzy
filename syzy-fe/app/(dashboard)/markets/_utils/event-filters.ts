import { Event } from "@/app/(dashboard)/markets/_types";

export type StatusFilter = "active" | "ending-soon" | "ended";
export type SortOption = "volume" | "newest" | "trending";

const ENDING_SOON_DAYS = 7;

export function isEventEnded(event: Event): boolean {
  if (event.status === "resolved") return true;

  if (!event.markets?.length) return false;

  // For group events: ended only if ALL markets are resolved
  if (event.markets.length > 1) {
    return event.markets.every((m) => m.is_resolved);
  }

  if (event.markets[0]?.is_resolved) return true;

  if (event.end_date) {
    return new Date(event.end_date).getTime() <= Date.now();
  }

  return false;
}

export function isEventEndingSoon(event: Event): boolean {
  if (isEventEnded(event)) return false;

  const endDate = event.end_date || event.markets?.[0]?.end_time;
  if (!endDate) return false;

  const end = new Date(endDate);
  if (isNaN(end.getTime())) return false;

  const diffMs = end.getTime() - Date.now();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= ENDING_SOON_DAYS;
}

export function filterByStatus(events: Event[], status: StatusFilter): Event[] {
  switch (status) {
    case "active":
      // "Active" includes everything that hasn't ended (including "ending soon")
      return events.filter((e) => !isEventEnded(e));
    case "ending-soon": {
      const filtered = events.filter((e) => isEventEndingSoon(e));
      // Pre-sort by soonest end date
      return filtered.sort((a, b) => {
        const aEnd = a.end_date || a.markets?.[0]?.end_time || "";
        const bEnd = b.end_date || b.markets?.[0]?.end_time || "";
        return new Date(aEnd).getTime() - new Date(bEnd).getTime();
      });
    }
    case "ended":
      return events.filter((e) => isEventEnded(e));
    default:
      return events;
  }
}

export function sortEvents(events: Event[], sort: SortOption): Event[] {
  const sorted = [...events];
  switch (sort) {
    case "volume":
      return sorted.sort((a, b) => b.volume - a.volume);
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "trending":
      return sorted.sort(
        (a, b) => (b.is_trending ? 1 : 0) - (a.is_trending ? 1 : 0)
      );
    default:
      return sorted;
  }
}

export function computeStatusCounts(events: Event[]): {
  active: number;
  endingSoon: number;
  ended: number;
} {
  let active = 0;
  let endingSoon = 0;
  let ended = 0;

  for (const event of events) {
    if (isEventEnded(event)) {
      ended++;
    } else {
      active++; // Include all active events, even those ending soon
      if (isEventEndingSoon(event)) {
        endingSoon++;
      }
    }
  }

  return { active, endingSoon, ended };
}
