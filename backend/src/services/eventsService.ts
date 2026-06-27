import { PrismaClient, Event } from '@prisma/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addHours } from 'date-fns';
import { RRule } from 'rrule';

// ──────────────────────────────────────────────
// Timezone conversion helpers
// ──────────────────────────────────────────────

export function toUtc(localIso: string, timezone: string): Date {
  return fromZonedTime(new Date(localIso), timezone);
}

export function toLocal(utcDate: Date, timezone: string): string {
  return toZonedTime(utcDate, timezone).toISOString();
}

// ──────────────────────────────────────────────
// Default end time (start + 1 hour)
// ──────────────────────────────────────────────

export function defaultEndUtc(startUtc: Date): Date {
  return addHours(startUtc, 1);
}

// ──────────────────────────────────────────────
// Overlap detection
// ──────────────────────────────────────────────

export async function detectOverlaps(
  prisma: PrismaClient,
  userId: string,
  startUtc: Date,
  endUtc: Date,
  excludeEventId?: string
): Promise<Event[]> {
  return prisma.event.findMany({
    where: {
      userId,
      id: excludeEventId ? { not: excludeEventId } : undefined,
      isAllDay: false,
      isException: false,
      AND: [
        { startUtc: { lt: endUtc } },
        { endUtc: { gt: startUtc } },
      ],
    },
  });
}

// ──────────────────────────────────────────────
// Recurring event expansion
// ──────────────────────────────────────────────

export interface ExpandedEvent {
  id: string;
  parentId: string;
  title: string;
  description: string | null;
  startUtc: string;
  endUtc: string;
  isAllDay: boolean;
  color: string | null;
  location: string | null;
  calendarId: string;
  userId: string;
  recurrenceRule: string | null;
  recurrenceId: string | null;
  isException: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  isRecurringInstance: boolean;
}

export function expandRecurringEvent(
  event: Event,
  windowStart: Date,
  windowEnd: Date,
  exceptions: Event[]
): ExpandedEvent[] {
  if (!event.recurrenceRule) {
    return [];
  }

  const duration = event.endUtc.getTime() - event.startUtc.getTime();

  let rule: RRule;
  try {
    // Build the RRule from the stored RRULE string
    const rruleString = event.recurrenceRule.startsWith('RRULE:')
      ? event.recurrenceRule
      : `RRULE:${event.recurrenceRule}`;

    rule = RRule.fromString(rruleString);

    // Re-create with the event's actual dtstart so occurrences are anchored correctly
    rule = new RRule({
      ...rule.origOptions,
      dtstart: event.startUtc,
    });
  } catch (err) {
    console.error(`Failed to parse RRULE for event ${event.id}: ${event.recurrenceRule}`, err);
    return [];
  }

  // Get occurrences within the query window
  const occurrences = rule.between(windowStart, windowEnd, true);

  // Build a set of exception dates for quick lookup (match by date string to the minute)
  const exceptionDateSet = new Set<string>();
  for (const exc of exceptions) {
    // Use the startUtc of the exception to identify which instance it replaces
    exceptionDateSet.add(exc.startUtc.toISOString());
  }

  const expanded: ExpandedEvent[] = [];

  for (const occurrenceDate of occurrences) {
    const instanceStart = occurrenceDate;
    const instanceEnd = new Date(instanceStart.getTime() + duration);
    const instanceDateISO = instanceStart.toISOString();

    // Skip if there's an exception record for this instance
    if (exceptionDateSet.has(instanceDateISO)) {
      continue;
    }

    // Skip if the instance is the same as the parent event itself (already returned as a regular event)
    if (instanceStart.getTime() === event.startUtc.getTime()) {
      // Include the original event as a recurring instance too, with the virtual id
      expanded.push({
        id: `${event.id}_${instanceDateISO}`,
        parentId: event.id,
        title: event.title,
        description: event.description,
        startUtc: instanceStart.toISOString(),
        endUtc: instanceEnd.toISOString(),
        isAllDay: event.isAllDay,
        color: event.color,
        location: event.location,
        calendarId: event.calendarId,
        userId: event.userId,
        recurrenceRule: event.recurrenceRule,
        recurrenceId: event.recurrenceId,
        isException: false,
        version: event.version,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        isRecurringInstance: true,
      });
      continue;
    }

    expanded.push({
      id: `${event.id}_${instanceDateISO}`,
      parentId: event.id,
      title: event.title,
      description: event.description,
      startUtc: instanceStart.toISOString(),
      endUtc: instanceEnd.toISOString(),
      isAllDay: event.isAllDay,
      color: event.color,
      location: event.location,
      calendarId: event.calendarId,
      userId: event.userId,
      recurrenceRule: event.recurrenceRule,
      recurrenceId: event.recurrenceId,
      isException: false,
      version: event.version,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      isRecurringInstance: true,
    });
  }

  return expanded;
}

// ──────────────────────────────────────────────
// Delete mode handlers for recurring events
// ──────────────────────────────────────────────

/**
 * deleteMode = 'this'
 * Create an exception record so this single instance is excluded from expansion.
 */
export async function deleteThisInstance(
  prisma: PrismaClient,
  parentEvent: Event,
  instanceDateISO: string,
  userId: string
): Promise<void> {
  const instanceDate = new Date(instanceDateISO);
  const duration = parentEvent.endUtc.getTime() - parentEvent.startUtc.getTime();

  await prisma.event.create({
    data: {
      title: parentEvent.title,
      description: parentEvent.description,
      startUtc: instanceDate,
      endUtc: new Date(instanceDate.getTime() + duration),
      isAllDay: parentEvent.isAllDay,
      color: parentEvent.color,
      location: parentEvent.location,
      calendarId: parentEvent.calendarId,
      userId,
      recurrenceId: parentEvent.id,
      isException: true,
    },
  });
}

/**
 * deleteMode = 'future'
 * Modify the parent event's RRULE to add an UNTIL clause set to just before the instance date.
 */
export async function deleteFutureInstances(
  prisma: PrismaClient,
  parentEvent: Event,
  instanceDateISO: string
): Promise<void> {
  if (!parentEvent.recurrenceRule) return;

  const instanceDate = new Date(instanceDateISO);
  // Set UNTIL to 1 second before the instance date
  const untilDate = new Date(instanceDate.getTime() - 1000);

  const rruleString = parentEvent.recurrenceRule.startsWith('RRULE:')
    ? parentEvent.recurrenceRule
    : `RRULE:${parentEvent.recurrenceRule}`;

  let rule: RRule;
  try {
    rule = RRule.fromString(rruleString);
  } catch (err) {
    console.error(`Failed to parse RRULE for event ${parentEvent.id}`, err);
    return;
  }

  // Build new options with UNTIL
  const newOptions = { ...rule.origOptions };
  delete newOptions.count; // Remove COUNT if present, UNTIL takes precedence
  newOptions.until = untilDate;

  const newRule = new RRule(newOptions);
  const newRuleString = newRule.toString().replace('RRULE:', '');

  await prisma.event.update({
    where: { id: parentEvent.id },
    data: {
      recurrenceRule: newRuleString,
      version: parentEvent.version + 1,
    },
  });

  // Also delete any exception records that fall on or after the instance date
  await prisma.event.deleteMany({
    where: {
      recurrenceId: parentEvent.id,
      isException: true,
      startUtc: { gte: instanceDate },
    },
  });
}

/**
 * deleteMode = 'all'
 * Delete the parent event entirely; cascade will remove exception records.
 */
export async function deleteAllInstances(
  prisma: PrismaClient,
  parentEventId: string
): Promise<void> {
  // Delete all exception records first
  await prisma.event.deleteMany({
    where: { recurrenceId: parentEventId },
  });

  // Delete the parent event
  await prisma.event.delete({
    where: { id: parentEventId },
  });
}

/**
 * Parse a virtual recurring instance ID (e.g. "clxyz123_2024-01-15T10:00:00.000Z")
 * Returns the parent ID and instance date, or null if it's a regular event ID.
 */
export function parseRecurringInstanceId(id: string): { parentId: string; instanceDate: string } | null {
  // CUID is ~25 chars, followed by underscore and ISO date
  const underscoreIdx = id.indexOf('_');
  if (underscoreIdx === -1) return null;

  const parentId = id.substring(0, underscoreIdx);
  const instanceDate = id.substring(underscoreIdx + 1);

  // Validate the instance date portion looks like an ISO date
  const parsed = new Date(instanceDate);
  if (isNaN(parsed.getTime())) return null;

  return { parentId, instanceDate };
}
