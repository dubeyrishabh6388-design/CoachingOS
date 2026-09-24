import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const materialsRouter = Router();

// GET /api/v1/materials
materialsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || 'org-kota-001';
    const subject = req.query.subject as string | undefined;
    const batchId = req.query.batchId as string | undefined;

    const materials = await db.getStudyMaterials(organizationId, subject, batchId);
    res.json({
      data: materials,
      meta: { count: materials.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching study materials' },
    });
  }
});

// POST /api/v1/materials
materialsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      courseId = 'crs-jee-adv',
      batchId,
      subject,
      title,
      description = '',
      fileType = 'PDF',
      fileUrl = '/materials/placeholder.pdf',
      fileSizeKb = 1024,
      uploadedBy = 'Faculty Member',
    } = req.body;

    if (!subject || !title) {
      res.status(400).json({
        data: null,
        error: { message: 'subject and title are required' },
      });
      return;
    }

    const material = await db.createStudyMaterial({
      organizationId,
      courseId,
      batchId,
      subject,
      title,
      description,
      fileType,
      fileUrl,
      fileSizeKb,
      uploadedBy,
    });

    res.status(201).json({
      data: material,
      meta: { message: 'Study material uploaded successfully' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error creating study material' },
    });
  }
});
