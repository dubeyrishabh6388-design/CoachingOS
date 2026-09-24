import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const studentsRouter = Router();

// GET /api/v1/students
studentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || 'org-kota-001';
    const batchId = req.query.batchId as string | undefined;

    const students = await db.getStudents(organizationId, batchId);
    res.json({
      data: students,
      meta: { count: students.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching students' },
    });
  }
});

// GET /api/v1/students/:id
studentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await db.getStudentById(id);
    if (!student) {
      res.status(404).json({
        data: null,
        error: { message: 'Student not found' },
      });
      return;
    }

    res.json({
      data: student,
      meta: {},
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching student' },
    });
  }
});

// POST /api/v1/students/bulk-import
studentsRouter.post('/bulk-import', async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      branchId,
      defaultBatchId,
      defaultBatchName,
      students,
      actorName,
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        data: null,
        error: { message: 'organizationId is required' },
      });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        data: null,
        error: { message: 'No student records provided for import' },
      });
    }

    // Resolve branchId if not provided
    let targetBranchId = branchId;
    if (!targetBranchId) {
      const branches = await db.getBranches(organizationId);
      targetBranchId = branches[0]?.id || `br-${organizationId}-main`;
    }

    const result = await db.bulkImportStudents({
      organizationId,
      branchId: targetBranchId,
      defaultBatchId,
      defaultBatchName,
      students,
      actorName,
    });

    res.status(201).json({
      data: result,
      message: `Successfully enrolled ${result.count} students into ${result.batchName}!`,
      error: null,
    });
  } catch (err: any) {
    console.error('Error during bulk student import:', err);
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Bulk student import failed' },
    });
  }
});
