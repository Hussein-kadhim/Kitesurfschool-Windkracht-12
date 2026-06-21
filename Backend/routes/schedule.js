import express from 'express';
import { protect } from '../middleware/auth.js';
import { createSchedule } from '../controllers/schedule/create.js';
import { getSchedules } from '../controllers/schedule/read.js';
import { deleteSchedule } from '../controllers/schedule/delete.js';
import { updateSchedule } from '../controllers/schedule/update.js';

const router = express.Router();

router.post('/', protect, createSchedule);
router.get('/', protect, getSchedules);
router.put('/:id', protect, updateSchedule);
router.delete('/:id', protect, deleteSchedule);

export default router;
