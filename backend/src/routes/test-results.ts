import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const testResultsRouter = Router();

// GET /api/v1/test-results
testResultsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || 'org-kota-001';
    const testId = req.query.testId as string | undefined;
    const studentId = req.query.studentId as string | undefined;

    const results = await db.getTestResults(organizationId, testId, studentId);
    res.json({
      data: results,
      meta: { count: results.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching test results' },
    });
  }
});

// POST /api/v1/test-results
testResultsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      testId,
      studentId,
      batchId,
      scoreObtained,
      totalMarks,
      rankInBatch = 1,
      physicsScore,
      chemistryScore,
      mathsScore,
      weakTopics = [],
      strongTopics = [],
      recommendedAction = 'Practice weak topics',
      takenAt = new Date().toISOString().split('T')[0],
    } = req.body;

    if (!testId || !studentId || scoreObtained === undefined || !totalMarks) {
      res.status(400).json({
        data: null,
        error: { message: 'testId, studentId, scoreObtained, and totalMarks are required' },
      });
      return;
    }

    const percentage = Number(((scoreObtained / totalMarks) * 100).toFixed(2));

    const result = await db.createTestResult({
      organizationId,
      testId,
      studentId,
      batchId: batchId || 'batch-01',
      scoreObtained,
      totalMarks,
      percentage,
      rankInBatch,
      physicsScore,
      chemistryScore,
      mathsScore,
      weakTopics,
      strongTopics,
      recommendedAction,
      takenAt,
    });

    res.status(201).json({
      data: result,
      meta: { message: 'Test score and topic diagnostics recorded' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error recording test result' },
    });
  }
});
