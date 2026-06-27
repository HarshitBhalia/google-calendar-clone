import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
} from '../controllers/calendarsController';

const router = Router();

// All calendar routes require authentication
router.use(requireAuth);

router.get('/', getCalendars);
router.post('/', createCalendar);
router.put('/:id', updateCalendar);
router.delete('/:id', deleteCalendar);

export default router;
