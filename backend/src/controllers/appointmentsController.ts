import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const createScheduleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  startUtc: z.string().min(1, 'Start time is required'),
  endUtc: z.string().min(1, 'End time is required'),
});

const updateScheduleSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  duration: z.number().int().min(1).optional(),
  startUtc: z.string().optional(),
  endUtc: z.string().optional(),
});

const createAppointmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  startUtc: z.string().min(1, 'Start time is required'),
  endUtc: z.string().min(1, 'End time is required'),
});

export async function getSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const schedules = await prisma.appointmentSchedule.findMany({
      where: { userId: req.user.id },
      include: { appointments: true },
      orderBy: { startUtc: 'asc' },
    });

    res.status(200).json({ schedules });
  } catch (error) {
    next(error);
  }
}

export async function getScheduleById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const schedule = await prisma.appointmentSchedule.findUnique({
      where: { id },
      include: { appointments: true },
    });

    if (!schedule) {
      res.status(404).json({ error: { message: 'Schedule not found.' } });
      return;
    }

    // Usually, public view should omit some details, but for now we'll just return it
    res.status(200).json({ schedule });
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { title, duration, startUtc, endUtc } = parsed.data;

    const schedule = await prisma.appointmentSchedule.create({
      data: {
        title,
        duration,
        startUtc: new Date(startUtc),
        endUtc: new Date(endUtc),
        userId: req.user.id,
      },
    });

    res.status(201).json({ schedule });
  } catch (error) {
    next(error);
  }
}

export async function updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const parsed = updateScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { title, duration, startUtc, endUtc } = parsed.data;

    const existing = await prisma.appointmentSchedule.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      res.status(404).json({ error: { message: 'Schedule not found.' } });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (duration !== undefined) updateData.duration = duration;
    if (startUtc !== undefined) updateData.startUtc = new Date(startUtc);
    if (endUtc !== undefined) updateData.endUtc = new Date(endUtc);

    const updatedSchedule = await prisma.appointmentSchedule.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ schedule: updatedSchedule });
  } catch (error) {
    next(error);
  }
}

export async function deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const existing = await prisma.appointmentSchedule.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      res.status(404).json({ error: { message: 'Schedule not found.' } });
      return;
    }

    await prisma.appointmentSchedule.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Schedule deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params; // scheduleId

    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { name, email, startUtc, endUtc } = parsed.data;

    const schedule = await prisma.appointmentSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      res.status(404).json({ error: { message: 'Schedule not found.' } });
      return;
    }

    // In a real app we'd validate the time slot fits the schedule duration and bounds
    const appointment = await prisma.appointment.create({
      data: {
        scheduleId: id,
        name,
        email,
        startUtc: new Date(startUtc),
        endUtc: new Date(endUtc),
      },
    });

    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
}

export async function getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const schedules = await prisma.appointmentSchedule.findMany({
      where: { userId: req.user.id },
      select: { id: true },
    });

    const scheduleIds = schedules.map(s => s.id);

    const appointments = await prisma.appointment.findMany({
      where: { scheduleId: { in: scheduleIds } },
      orderBy: { startUtc: 'asc' },
    });

    res.status(200).json({ appointments });
  } catch (error) {
    next(error);
  }
}
