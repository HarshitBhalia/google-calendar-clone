import { Router } from 'express';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  createAppointment,
  getAppointments,
} from '../controllers/appointmentsController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public routes for appointments
router.get('/schedules/:id', getScheduleById);
router.post('/schedules/:id/appointments', createAppointment);

// Protected routes
router.use(requireAuth);

router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.put('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', deleteSchedule);
router.get('/', getAppointments); // /api/appointments

export default router;
