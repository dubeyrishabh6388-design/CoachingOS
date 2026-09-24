import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';
import { notifyAbsenceBatch, AbsenceNotificationPayload } from '../lib/notify.js';

export const classSessionsRouter = Router();

// GET /api/v1/class-sessions/:id/attendance
classSessionsRouter.get('/:id/attendance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const attendance = await db.getAttendanceForSession(id);
    res.json({
      data: attendance,
      meta: { sessionId: id, count: attendance.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching attendance' },
    });
  }
});

// POST / PUT /api/v1/class-sessions/:id/attendance
async function handleSaveAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { organizationId = 'org-kota-001', records } = req.body;

    if (!Array.isArray(records)) {
      res.status(400).json({
        data: null,
        error: { message: 'records array is required' },
      });
      return;
    }

    // Save attendance records to MySQL DB
    const updated = await db.saveBulkAttendance(id, organizationId, records);

    // ── Absence Notification ──────────────────────────────────────────────
    const absentRecords = records.filter((r: any) => r.status === 'ABSENT');

    const notifications: Array<{
      studentName: string;
      to: string;
      status: string;
      messageId?: string;
      error?: string;
    }> = [];

    if (absentRecords.length > 0) {
      const org = await db.getOrganizationById(organizationId);
      const instituteName = org?.tradeName || 'CoachingOS Institute';

      const sessions = await db.getClassSessions(organizationId);
      const session = sessions.find((s) => s.id === id);

      const payloads: AbsenceNotificationPayload[] = [];

      for (const r of absentRecords) {
        const student = await db.getStudentById(r.studentId);

        // Fallback if student not in DB
        const studentName = student?.fullName || `Student #${r.studentId}`;
        const guardianName = student?.guardianName || 'Parent/Guardian';
        const guardianPhone = student?.guardianPhone || '6388248689';
        const guardianEmail = student?.guardianEmail || undefined;

        const batches = await db.getBatches(organizationId);
        const batch = batches.find((b) => b.id === (session?.batchId || student?.batchId));
        const batchName = batch?.name || 'Your Batch';

        const sessionDate = new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        payloads.push({
          studentName,
          guardianName,
          guardianPhone,
          guardianEmail,
          batchName,
          sessionDate,
          instituteName,
        });
      }

      if (payloads.length > 0) {
        const results = await notifyAbsenceBatch(payloads);
        results.forEach((r) => {
          notifications.push({
            studentName: r.studentName,
            to: r.to,
            status: r.status,
            messageId: r.messageId,
            error: r.error,
          });
        });
      }
    }

    const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;
    const sentCount = notifications.filter(
      (n) => n.status === 'SENT' || n.status === 'SIMULATED'
    ).length;

    res.json({
      data: updated,
      meta: {
        message:
          absentCount > 0
            ? `Attendance saved. ${sentCount}/${absentCount} parent absence alerts sent.`
            : 'Attendance saved. All students present.',
        presentCount: records.filter((r: any) => r.status === 'PRESENT').length,
        absentCount,
        lateCount: records.filter((r: any) => r.status === 'LATE').length,
        smsAlertCount: sentCount, // backward compatibility
        notifications,
      },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error updating attendance' },
    });
  }
}

classSessionsRouter.post('/:id/attendance', handleSaveAttendance);
classSessionsRouter.put('/:id/attendance', handleSaveAttendance);
