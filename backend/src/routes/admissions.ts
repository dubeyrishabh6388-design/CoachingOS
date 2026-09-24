import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const admissionsRouter = Router();

// POST /api/v1/admissions
admissionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      leadId,
      organizationId = 'org-kota-001',
      branchId = 'br-kota-main',
      batchId,
      totalAmountPaise = 15000000,
      discountAmountPaise = 0,
      paidAmountPaise = 0,
      paymentMethod = 'UPI',
      admittedBy = 'Pooja Verma',
    } = req.body;

    if (!leadId || !batchId) {
      res.status(400).json({
        data: null,
        error: { message: 'leadId and batchId are required' },
      });
      return;
    }

    const result = await db.convertLeadToAdmission({
      leadId,
      organizationId,
      branchId,
      batchId,
      totalAmountPaise,
      discountAmountPaise,
      paidAmountPaise,
      paymentMethod,
      admittedBy,
    });

    res.status(201).json({
      data: result,
      meta: { timestamp: new Date().toISOString(), message: 'Admission successfully processed' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Failed to convert admission' },
    });
  }
});
