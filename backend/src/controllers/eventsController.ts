import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  toUtc,
  toLocal,
  defaultEndUtc,
  detectOverlaps,
  expandRecurringEvent,
  deleteThisInstance,
  deleteFutureInstances,
  deleteAllInstances,
  parseRecurringInstanceId,
  ExpandedEvent,
} from '../services/eventsService';

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional().nullable(),
  startUtc: z.string().min(1, 'Start time is required'),
  endUtc: z.string().optional().nullable(),
  isAllDay: z.boolean().optional().default(false),
  color: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  calendarId: z.string().min(1, 'Calendar ID is required'),
  timezone: z.string().optional().default('UTC'),
  recurrenceRule: z.string().optional().nullable(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
  startUtc: z.string().optional(),
  endUtc: z.string().optional().nullable(),
  isAllDay: z.boolean().optional(),
  color: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  calendarId: z.string().optional(),
  timezone: z.string().optional().default('UTC'),
  recurrenceRule: z.string().optional().nullable(),
  version: z.number().int().min(1),
});

// ──────────────────────────────────────────────
// Helper: serialize an Event from Prisma to JSON
// ──────────────────────────────────────────────

function serializeEvent(event: any, timezone: string = 'UTC') {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startUtc: event.startUtc instanceof Date ? event.startUtc.toISOString() : event.startUtc,
    endUtc: event.endUtc instanceof Date ? event.endUtc.toISOString() : event.endUtc,
    startLocal: event.startUtc instanceof Date ? toLocal(event.startUtc, timezone) : toLocal(new Date(event.startUtc), timezone),
    endLocal: event.endUtc instanceof Date ? toLocal(event.endUtc, timezone) : toLocal(new Date(event.endUtc), timezone),
    isAllDay: event.isAllDay,
    color: event.color,
    location: event.location,
    calendarId: event.calendarId,
    userId: event.userId,
    recurrenceRule: event.recurrenceRule,
    recurrenceId: event.recurrenceId,
    isException: event.isException,
    version: event.version,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
  };
}

// ──────────────────────────────────────────────
// POST /api/events — Create event
// ──────────────────────────────────────────────

export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { title, description, startUtc: startUtcStr, endUtc: endUtcStr, isAllDay, color, location, calendarId, timezone, recurrenceRule } = parsed.data;

    // Verify calendar belongs to user
    const calendar = await prisma.calendar.findFirst({
      where: { id: calendarId, userId: req.user.id },
    });
    if (!calendar) {
      res.status(404).json({ error: { message: 'Calendar not found or does not belong to you.' } });
      return;
    }

    // Convert strings to Dates directly since they are already UTC ISO strings from the frontend
    const startUtc = new Date(startUtcStr);
    let endUtc: Date;
    if (endUtcStr) {
      endUtc = new Date(endUtcStr);
    } else {
      endUtc = defaultEndUtc(startUtc);
    }

    if (endUtc <= startUtc) {
      res.status(400).json({ error: { message: 'End time must be after start time.' } });
      return;
    }

    // Check for overlaps (skip for all-day events or if forceOverlap is true)
    const forceOverlap = req.query.forceOverlap === 'true';
    if (!isAllDay && !forceOverlap) {
      const overlaps = await detectOverlaps(prisma, req.user.id, startUtc, endUtc);
      if (overlaps.length > 0) {
        res.status(409).json({
          warning: true,
          message: 'This event overlaps with existing events.',
          overlaps: overlaps.map((o) => serializeEvent(o, timezone)),
        });
        return;
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description ?? null,
        startUtc,
        endUtc,
        isAllDay,
        color: color ?? null,
        location: location ?? null,
        calendarId,
        userId: req.user.id,
        recurrenceRule: recurrenceRule ?? null,
      },
    });

    res.status(201).json({ event: serializeEvent(event, timezone) });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// GET /api/events — List events (with recurring expansion)
// ──────────────────────────────────────────────

export async function getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { start, end, timezone = 'UTC' } = req.query as {
      start?: string;
      end?: string;
      timezone?: string;
    };

    if (!start || !end) {
      res.status(400).json({ error: { message: 'start and end query parameters are required (ISO date strings).' } });
      return;
    }

    const windowStart = new Date(start);
    const windowEnd = new Date(end);

    if (isNaN(windowStart.getTime()) || isNaN(windowEnd.getTime())) {
      res.status(400).json({ error: { message: 'Invalid start or end date format.' } });
      return;
    }

    // 1. Get all non-recurring events in the range
    const nonRecurringEvents = await prisma.event.findMany({
      where: {
        userId: req.user.id,
        recurrenceRule: null,
        isException: false,
        AND: [
          { startUtc: { lt: windowEnd } },
          { endUtc: { gt: windowStart } },
        ],
        deletedAt: null,
      },
      orderBy: { startUtc: 'asc' },
    });

    // 2. Get all recurring parent events (they may generate instances in any window)
    const recurringEvents = await prisma.event.findMany({
      where: {
        userId: req.user.id,
        recurrenceRule: { not: null },
        isException: false,
        deletedAt: null,
      },
    });

    // 3. Get all exception records for these recurring events
    const recurringIds = recurringEvents.map((e) => e.id);
    const exceptions = await prisma.event.findMany({
      where: {
        recurrenceId: { in: recurringIds },
        isException: true,
      },
    });

    // Build a map of exceptions by parent ID
    const exceptionsByParentId = new Map<string, typeof exceptions>();
    for (const exc of exceptions) {
      if (exc.recurrenceId) {
        const existing = exceptionsByParentId.get(exc.recurrenceId) || [];
        existing.push(exc);
        exceptionsByParentId.set(exc.recurrenceId, existing);
      }
    }

    // 4. Expand recurring events
    const expandedRecurring: ExpandedEvent[] = [];
    for (const event of recurringEvents) {
      const parentExceptions = exceptionsByParentId.get(event.id) || [];
      const instances = expandRecurringEvent(event, windowStart, windowEnd, parentExceptions);
      expandedRecurring.push(...instances);
    }

    // 5. Serialize non-recurring events
    const serializedNonRecurring = nonRecurringEvents.map((e) => ({
      ...serializeEvent(e, timezone as string),
      isRecurringInstance: false,
      parentId: null,
    }));

    // 6. Add local times to expanded recurring events
    const serializedRecurring = expandedRecurring.map((e) => ({
      ...e,
      startLocal: toLocal(new Date(e.startUtc), timezone as string),
      endLocal: toLocal(new Date(e.endUtc), timezone as string),
    }));

    // 7. Merge and sort by start time
    const allEvents = [...serializedNonRecurring, ...serializedRecurring].sort((a, b) => {
      const aStart = typeof a.startUtc === 'string' ? a.startUtc : '';
      const bStart = typeof b.startUtc === 'string' ? b.startUtc : '';
      return aStart.localeCompare(bStart);
    });

    res.status(200).json({ events: allEvents });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// GET /api/events/:id — Get single event
// ──────────────────────────────────────────────

export async function getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const timezone = (req.query.timezone as string) || 'UTC';

    // Check if this is a virtual recurring instance ID
    const recurringParsed = parseRecurringInstanceId(id);
    if (recurringParsed) {
      const parentEvent = await prisma.event.findFirst({
        where: { id: recurringParsed.parentId, userId: req.user.id },
      });

      if (!parentEvent) {
        res.status(404).json({ error: { message: 'Event not found.' } });
        return;
      }

      const duration = parentEvent.endUtc.getTime() - parentEvent.startUtc.getTime();
      const instanceStart = new Date(recurringParsed.instanceDate);
      const instanceEnd = new Date(instanceStart.getTime() + duration);

      res.status(200).json({
        event: {
          id,
          parentId: parentEvent.id,
          title: parentEvent.title,
          description: parentEvent.description,
          startUtc: instanceStart.toISOString(),
          endUtc: instanceEnd.toISOString(),
          startLocal: toLocal(instanceStart, timezone),
          endLocal: toLocal(instanceEnd, timezone),
          isAllDay: parentEvent.isAllDay,
          color: parentEvent.color,
          location: parentEvent.location,
          calendarId: parentEvent.calendarId,
          userId: parentEvent.userId,
          recurrenceRule: parentEvent.recurrenceRule,
          recurrenceId: parentEvent.recurrenceId,
          isException: false,
          version: parentEvent.version,
          createdAt: parentEvent.createdAt.toISOString(),
          updatedAt: parentEvent.updatedAt.toISOString(),
          isRecurringInstance: true,
        },
      });
      return;
    }

    // Regular event lookup
    const event = await prisma.event.findFirst({
      where: { id, userId: req.user.id, deletedAt: null },
    });

    if (!event) {
      res.status(404).json({ error: { message: 'Event not found.' } });
      return;
    }

    res.status(200).json({
      event: {
        ...serializeEvent(event, timezone),
        isRecurringInstance: false,
        parentId: null,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// PUT /api/events/:id — Update event
// ──────────────────────────────────────────────

export async function updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const timezone = (req.query.timezone as string) || 'UTC';

    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { title, description, startUtc: startUtcStr, endUtc: endUtcStr, isAllDay, color, location, calendarId, recurrenceRule, version } = parsed.data;

    // Find existing event
    const existing = await prisma.event.findFirst({
      where: { id, userId: req.user.id, deletedAt: null },
    });

    if (!existing) {
      res.status(404).json({ error: { message: 'Event not found.' } });
      return;
    }

    // Optimistic locking: check version
    if (existing.version !== version) {
      res.status(409).json({
        error: {
          message: 'Event has been modified by another request. Please refresh and try again.',
          currentVersion: existing.version,
        },
      });
      return;
    }

    // If calendarId is being changed, verify ownership
    if (calendarId && calendarId !== existing.calendarId) {
      const calendar = await prisma.calendar.findFirst({
        where: { id: calendarId, userId: req.user.id },
      });
      if (!calendar) {
        res.status(404).json({ error: { message: 'Target calendar not found or does not belong to you.' } });
        return;
      }
    }

    // Build update data
    const updateData: any = { version: existing.version + 1 };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isAllDay !== undefined) updateData.isAllDay = isAllDay;
    if (color !== undefined) updateData.color = color;
    if (location !== undefined) updateData.location = location;
    if (calendarId !== undefined) updateData.calendarId = calendarId;
    if (recurrenceRule !== undefined) updateData.recurrenceRule = recurrenceRule;

    if (startUtcStr) {
      updateData.startUtc = new Date(startUtcStr);
    }
    if (endUtcStr) {
      updateData.endUtc = new Date(endUtcStr);
    } else if (startUtcStr && !endUtcStr) {
      // If start changed but no end provided, set end to start + 1 hour
      updateData.endUtc = defaultEndUtc(updateData.startUtc);
    }

    // Determine final start/end for overlap check
    const finalStartUtc = updateData.startUtc || existing.startUtc;
    const finalEndUtc = updateData.endUtc || existing.endUtc;
    const finalIsAllDay = isAllDay !== undefined ? isAllDay : existing.isAllDay;

    if (finalEndUtc <= finalStartUtc) {
      res.status(400).json({ error: { message: 'End time must be after start time.' } });
      return;
    }

    // Overlap check
    const forceOverlap = req.query.forceOverlap === 'true';
    if (!finalIsAllDay && !forceOverlap) {
      const overlaps = await detectOverlaps(prisma, req.user.id, finalStartUtc, finalEndUtc, id);
      if (overlaps.length > 0) {
        res.status(409).json({
          warning: true,
          message: 'This event overlaps with existing events.',
          overlaps: overlaps.map((o) => serializeEvent(o, timezone)),
        });
        return;
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ event: serializeEvent(updatedEvent, timezone) });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// DELETE /api/events/:id — Delete event
// ──────────────────────────────────────────────

export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const deleteMode = (req.query.deleteMode as string) || 'all';

    // Check if this is a virtual recurring instance ID
    const recurringParsed = parseRecurringInstanceId(id);

    if (recurringParsed) {
      // This is a recurring instance
      const parentEvent = await prisma.event.findFirst({
        where: { id: recurringParsed.parentId, userId: req.user.id },
      });

      if (!parentEvent) {
        res.status(404).json({ error: { message: 'Event not found.' } });
        return;
      }

      switch (deleteMode) {
        case 'this':
          await deleteThisInstance(prisma, parentEvent, recurringParsed.instanceDate, req.user.id);
          break;
        case 'future':
          await deleteFutureInstances(prisma, parentEvent, recurringParsed.instanceDate);
          break;
        case 'all':
          await deleteAllInstances(prisma, parentEvent.id);
          break;
        default:
          res.status(400).json({ error: { message: 'Invalid deleteMode. Use "this", "future", or "all".' } });
          return;
      }

      res.status(200).json({ message: `Recurring event deleted (mode: ${deleteMode}).` });
      return;
    }

    // Regular (non-recurring-instance) event
    const event = await prisma.event.findFirst({
      where: { id, userId: req.user.id, deletedAt: null },
    });

    if (!event) {
      res.status(404).json({ error: { message: 'Event not found.' } });
      return;
    }

    // If the event itself is a recurring parent
    if (event.recurrenceRule && deleteMode !== 'all') {
      switch (deleteMode) {
        case 'this':
          // For the parent event itself being deleted as 'this', we create an exception for the first occurrence
          await deleteThisInstance(prisma, event, event.startUtc.toISOString(), req.user.id);
          break;
        case 'future':
          // Deleting future from the parent start effectively deletes everything
          await deleteAllInstances(prisma, event.id);
          break;
        default:
          res.status(400).json({ error: { message: 'Invalid deleteMode. Use "this", "future", or "all".' } });
          return;
      }

      res.status(200).json({ message: `Recurring event deleted (mode: ${deleteMode}).` });
      return;
    }

    // Simple non-recurring event or deleteMode=all for recurring parent
    if (event.recurrenceRule) {
      // Delete all exception records for this recurring event first
      await prisma.event.deleteMany({
        where: { recurrenceId: event.id },
      });
    }

    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// GET /api/events/search — Search events
// ──────────────────────────────────────────────

export async function searchEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const q = req.query.q as string;
    const what = req.query.what as string;
    const who = req.query.who as string;
    const whereQuery = req.query.where as string;
    const notQuery = req.query.not as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const timezone = (req.query.timezone as string) || 'UTC';

    const conditions: any[] = [];
    conditions.push({ userId: req.user.id });
    conditions.push({ isException: false });
    conditions.push({ deletedAt: null });

    if (q) {
      conditions.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      });
    }

    if (what) {
      conditions.push({
        OR: [
          { title: { contains: what } },
          { description: { contains: what } },
        ],
      });
    }

    if (who) {
      conditions.push({
        OR: [
          { title: { contains: who } },
          { description: { contains: who } },
        ],
      });
    }

    if (whereQuery) {
      conditions.push({ location: { contains: whereQuery } });
    }

    if (notQuery) {
      const notWords = notQuery.split(' ').filter(w => w.trim().length > 0);
      for (const word of notWords) {
        conditions.push({
          AND: [
            { title: { not: { contains: word } } },
            { description: { not: { contains: word } } },
          ]
        });
      }
    }

    if (from) {
      conditions.push({ startUtc: { gte: new Date(from) } });
    }

    if (to) {
      conditions.push({ endUtc: { lte: new Date(to) } });
    }

    const events = await prisma.event.findMany({
      where: {
        AND: conditions,
      },
      orderBy: { startUtc: 'desc' },
      take: 20,
    });

    res.status(200).json({
      events: events.map((e) => ({
        ...serializeEvent(e, timezone),
        isRecurringInstance: false,
        parentId: null,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// Trash Endpoints
// ──────────────────────────────────────────────

export async function getDeletedEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    
    const timezone = (req.query.timezone as string) || 'UTC';
    
    const events = await prisma.event.findMany({
      where: { userId: req.user.id, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' }
    });
    
    res.status(200).json({
      events: events.map(e => ({
        ...serializeEvent(e, timezone),
        isRecurringInstance: false,
        parentId: null
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { id } = req.params;
    
    await prisma.event.update({
      where: { id, userId: req.user.id },
      data: { deletedAt: null }
    });
    
    res.status(200).json({ message: 'Event restored.' });
  } catch (error) {
    next(error);
  }
}

export async function permanentDeleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { id } = req.params;
    
    await prisma.event.delete({
      where: { id, userId: req.user.id }
    });
    
    res.status(200).json({ message: 'Event permanently deleted.' });
  } catch (error) {
    next(error);
  }
}

