import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const leadsRouter = Router();

// GET /api/v1/leads
leadsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || 'org-kota-001';
    const branchId = req.query.branchId as string | undefined;

    const leads = await db.getLeads(organizationId, branchId);
    res.json({
      data: leads,
      meta: { count: leads.length, timestamp: new Date().toISOString() },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching leads' },
    });
  }
});

// POST /api/v1/leads
leadsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      branchId = 'br-kota-main',
      studentName,
      phone,
      email,
      guardianName,
      guardianPhone,
      interestedCourseId = 'crs-jee-adv',
      source = 'WALK_IN',
      notes,
    } = req.body;

    if (!studentName || !phone) {
      res.status(400).json({
        data: null,
        error: { message: 'studentName and phone are required' },
      });
      return;
    }

    // Deduplication check
    const existingLeads = await db.getLeads(organizationId);
    const existing = existingLeads.find((l) => l.phone === phone);
    if (existing) {
      res.status(200).json({
        data: existing,
        meta: { isDuplicate: true, warning: 'A lead with this phone number already exists.' },
        error: null,
      });
      return;
    }

    const lead = await db.createLead({
      organizationId,
      branchId,
      source,
      studentName,
      phone,
      email,
      guardianName,
      guardianPhone,
      interestedCourseId,
      stage: 'NEW',
      notes,
    });

    res.status(201).json({
      data: lead,
      meta: { timestamp: new Date().toISOString() },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Internal error' },
    });
  }
});
