import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  isCompleted: z.boolean().optional().default(false),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  isCompleted: z.boolean().optional(),
});

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { title, description, date, isCompleted } = parsed.data;

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        date: date ? new Date(date) : null,
        isCompleted,
        userId: req.user.id,
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { title, description, date, isCompleted } = parsed.data;

    const existing = await prisma.task.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      res.status(404).json({ error: { message: 'Task not found.' } });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date ? new Date(date) : null;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const existing = await prisma.task.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      res.status(404).json({ error: { message: 'Task not found.' } });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
