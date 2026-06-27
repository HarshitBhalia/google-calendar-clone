import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  searchEvents,
  getDeletedEvents,
  restoreEvent,
  permanentDeleteEvent,
} from '../controllers/eventsController';

const router = Router();

// All event routes require authentication
router.use(requireAuth);

router.get('/search', searchEvents);
router.get('/trash', getDeletedEvents);
router.post('/:id/restore', restoreEvent);
router.delete('/:id/permanent', permanentDeleteEvent);

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
