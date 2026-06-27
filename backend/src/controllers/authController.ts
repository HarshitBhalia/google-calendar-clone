import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateToken } from '../services/authService';
import { AppError } from '../middleware/errorHandler';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { email, password, name } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: { message: 'An account with this email already exists.' } });
      return;
    }

    const hashedPassword = await hashPassword(password);

    // Create user and default calendar in a transaction
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        calendars: {
          create: {
            name: 'My Calendar',
            color: '#4285F4',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      res.status(400).json({ error: { message: `Validation error: ${errors}` } });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: { message: 'Invalid email or password.' } });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: { message: 'Invalid email or password.' } });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}
