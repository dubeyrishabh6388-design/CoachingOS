import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const batchesRouter = Router();

// GET /api/v1/batches
batchesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || 'org-kota-001';
    const branchId = req.query.branchId as string | undefined;

    const batches = await db.getBatches(organizationId, branchId);
    res.json({
      data: batches,
      meta: { count: batches.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching batches' },
    });
  }
});

// POST /api/v1/batches
batchesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      id,
      organizationId = 'org-kota-001',
      branchId,
      courseId,
      name,
      code,
      academicYear = '2026-2027',
      maxCapacity = 40,
      currentEnrollment = 0,
      startDate = new Date().toISOString().slice(0, 10),
      endDate = '2027-04-30',
      status = 'ACTIVE',
    } = req.body;

    if (!name) {
      res.status(400).json({
        data: null,
        error: { message: 'Batch name is required' },
      });
      return;
    }

    const batch = await db.createBatch({
      id,
      organizationId,
      branchId,
      courseId,
      name,
      code: code || `${name.slice(0, 3).toUpperCase()}_01`,
      academicYear,
      maxCapacity: Number(maxCapacity) || 40,
      currentEnrollment: Number(currentEnrollment) || 0,
      startDate,
      endDate,
      status,
    });

    res.status(201).json({
      data: batch,
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error creating batch' },
    });
  }
});
