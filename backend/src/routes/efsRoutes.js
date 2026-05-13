/**
 * EFS Routes
 * W5 MH3 — EFS file storage evidence endpoints
 *
 * GET  /api/efs/health          — check EFS mount accessibility
 * POST /api/efs/write           — write a file to /mnt/efs/app-data/
 * GET  /api/efs/read/:filename  — read a file from /mnt/efs/app-data/
 * GET  /api/efs/list            — list files in /mnt/efs/app-data/
 */

import express from 'express';
import { efsHealth, efsWrite, efsRead, efsList } from '../controllers/efsController.js';

const router = express.Router();

router.get('/health', efsHealth);
router.post('/write', efsWrite);
router.get('/read/:filename', efsRead);
router.get('/list', efsList);

export default router;
