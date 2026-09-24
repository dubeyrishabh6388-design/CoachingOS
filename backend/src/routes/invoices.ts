import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const invoicesRouter = Router();

// GET /api/v1/invoices
invoicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || 'org-kota-001';
    const branchId = req.query.branchId as string | undefined;
    const studentId = req.query.studentId as string | undefined;

    const invoices = await db.getInvoices(organizationId, branchId, studentId);

    res.json({
      data: invoices,
      meta: { count: invoices.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching invoices' },
    });
  }
});

// GET /api/v1/invoices/:id/installments
invoicesRouter.get('/:id/installments', async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id;
    const installments = await db.getInvoiceInstallments(invoiceId);

    res.json({
      data: installments,
      meta: { count: installments.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching invoice installments' },
    });
  }
});
