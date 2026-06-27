import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const createCalendarSchema = z.object({
  name: z.string().min(1, 'Calendar name is required').max(200),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #4285F4)').optional().default('#4285F4'),
});

const updateCalendarSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #4285F4)').optional(),
});

// ──────────────────────────────────────────────
// GET /api/calendars — List all calendars
// ──────────────────────────────────────────────

export async function getCalendars(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const calendars = await prisma.calendar.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { events: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({
      calendars: calendars.map((cal) => ({
        id: cal.id,
        name: cal.name,
        color: cal.color,
        userId: cal.userId,
        eventCount: cal._count.events,
        createdAt: cal.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// POST /api/calendars — Create calendar
// ──────────────────────────────────────────────

export async function createCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const parsed = createCalendarSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { name, color } = parsed.data;

    const calendar = await prisma.calendar.create({
      data: {
        name,
        color,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      calendar: {
        id: calendar.id,
        name: calendar.name,
        color: calendar.color,
        userId: calendar.userId,
        createdAt: calendar.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// PUT /api/calendars/:id — Update calendar
// ──────────────────────────────────────────────

export async function updateCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const parsed = updateCalendarSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    // Verify ownership
    const existing = await prisma.calendar.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      res.status(404).json({ error: { message: 'Calendar not found or does not belong to you.' } });
      return;
    }

    const { name, color } = parsed.data;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;

    const updated = await prisma.calendar.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      calendar: {
        id: updated.id,
        name: updated.name,
        color: updated.color,
        userId: updated.userId,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// DELETE /api/calendars/:id — Delete calendar
// ──────────────────────────────────────────────

export async function deleteCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.calendar.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      res.status(404).json({ error: { message: 'Calendar not found or does not belong to you.' } });
      return;
    }

    // Delete calendar (cascade will delete associated events)
    await prisma.calendar.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Calendar deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
