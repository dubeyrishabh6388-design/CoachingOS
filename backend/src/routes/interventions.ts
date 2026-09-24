import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const interventionsRouter = Router();

// GET /api/v1/interventions
interventionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || 'org-kota-001';

    const interventions = await db.getInterventions(organizationId);
    res.json({
      data: interventions,
      meta: { count: interventions.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching interventions' },
    });
  }
});

// PATCH /api/v1/interventions
interventionsRouter.patch('/', async (req: Request, res: Response) => {
  try {
    const { id, status, outcomeNotes } = req.body;

    if (!id || !status) {
      res.status(400).json({
        data: null,
        error: { message: 'id and status are required' },
      });
      return;
    }

    const updated = await db.updateInterventionStatus(id, status, outcomeNotes);
    if (!updated) {
      res.status(404).json({
        data: null,
        error: { message: 'Intervention not found' },
      });
      return;
    }

    res.json({
      data: updated,
      meta: { message: 'Intervention case updated' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error updating intervention' },
    });
  }
});
