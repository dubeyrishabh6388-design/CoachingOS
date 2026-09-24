/**
 * CoachingOS — Parent Absence Notification Service
 *
 * Sends an **email** to the parent when a student is marked Absent.
 * Uses Gmail SMTP (nodemailer) — completely free, no paid token needed.
 *
 * ── Quick Setup (5 minutes) ────────────────────────────────────────────────
 *  1. Open https://myaccount.google.com/security
 *  2. Enable "2-Step Verification" if not already on
 *  3. Search for "App passwords" → Create one → Copy the 16-char password
 *  4. Add to your .env file:
 *       NOTIFY_FROM_EMAIL=yourname@gmail.com
 *       NOTIFY_FROM_APP_PASS=xxxx xxxx xxxx xxxx   ← 16-char App Password
 *       NOTIFY_TO_EMAIL=6388248689@test.com          ← static override for now
 *
 * When NOTIFY_FROM_EMAIL is not set, alerts are printed to the console
 * (SIMULATED mode) so development works with zero config.
 * ──────────────────────────────────────────────────────────────────────────
 */

import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ── Types ─────────────────────────────────────────────────────────────────

export interface AbsenceNotificationPayload {
  studentName: string;
  guardianName: string;
  guardianPhone: string;   // used as fallback ref only — email is the channel
  guardianEmail?: string;  // actual parent email (optional, uses override if missing)
  batchName: string;
  sessionDate: string;
  instituteName: string;
}

export interface NotificationResult {
  to: string;              // email address the message was sent to
  studentName: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  messageId?: string;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** The static override email — change once a real parent email is known */
const STATIC_TO_EMAIL = process.env.NOTIFY_TO_EMAIL || 'parent-test@gmail.com';

function resolveEmail(guardianEmail?: string): string {
  const override = process.env.NOTIFY_TO_EMAIL;
  // If a static override is set (for testing), use it
  if (override && override !== '' && override !== 'false') return override;
  // Otherwise use actual guardian email
  return guardianEmail || STATIC_TO_EMAIL;
}

function buildEmailHtml(p: AbsenceNotificationPayload): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Absence Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:24px; }
    .card { background:#fff; border-radius:12px; max-width:520px; margin:0 auto; padding:32px; border:1px solid #e2e8f0; }
    .header { background:#0b3b36; border-radius:8px; padding:20px 24px; margin-bottom:24px; }
    .header h1 { color:#fff; font-size:18px; margin:0 0 4px; }
    .header p  { color:#a7f3d0; font-size:13px; margin:0; }
    .badge { display:inline-block; background:#fef2f2; color:#dc2626; border:1px solid #fecaca; border-radius:20px; padding:4px 14px; font-size:13px; font-weight:600; margin-bottom:20px; }
    .row { display:flex; gap:12px; margin-bottom:12px; }
    .label { color:#64748b; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; min-width:80px; padding-top:2px; }
    .value { color:#1e293b; font-size:14px; }
    .footer { margin-top:24px; padding-top:16px; border-top:1px solid #f1f5f9; font-size:12px; color:#94a3b8; }
    .cta { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:14px 16px; margin-top:20px; font-size:13px; color:#166534; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🏫 ${p.instituteName}</h1>
      <p>Automated Attendance Alert</p>
    </div>

    <div class="badge">⚠️ Student Marked Absent</div>

    <div class="row">
      <div class="label">Dear</div>
      <div class="value">${p.guardianName}</div>
    </div>
    <div class="row">
      <div class="label">Student</div>
      <div class="value"><strong>${p.studentName}</strong></div>
    </div>
    <div class="row">
      <div class="label">Batch</div>
      <div class="value">${p.batchName}</div>
    </div>
    <div class="row">
      <div class="label">Date</div>
      <div class="value">${p.sessionDate}</div>
    </div>
    <div class="row">
      <div class="label">Status</div>
      <div class="value" style="color:#dc2626;font-weight:600;">ABSENT</div>
    </div>

    <div class="cta">
      📞 Please ensure regular attendance. If there was a valid reason for absence,
      kindly inform the institute so it can be marked accordingly.
    </div>

    <div class="footer">
      This is an automated message from <strong>${p.instituteName}</strong>.<br/>
      Please do not reply to this email.
    </div>
  </div>
</body>
</html>
`;
}

function buildEmailText(p: AbsenceNotificationPayload): string {
  return (
    `ABSENCE ALERT — ${p.instituteName}\n\n` +
    `Dear ${p.guardianName},\n\n` +
    `Your ward ${p.studentName} was marked ABSENT in today's class.\n\n` +
    `Date: ${p.sessionDate}\n` +
    `Batch: ${p.batchName}\n\n` +
    `Please ensure regular attendance. Contact the institute for any queries.\n\n` +
    `— ${p.instituteName} Team`
  );
}

// ── Core sender ───────────────────────────────────────────────────────────

let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const user = process.env.NOTIFY_FROM_EMAIL;
  const pass = process.env.NOTIFY_FROM_APP_PASS;

  if (!user || !pass || user.includes('your') || pass.includes('xxxx')) {
    return null; // no creds configured → simulate
  }

  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return _transporter;
}

async function sendAbsenceEmail(
  to: string,
  payload: AbsenceNotificationPayload
): Promise<{ messageId?: string; error?: string; simulated?: boolean }> {
  const transporter = getTransporter();
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || 'noreply@coachingos.app';
  const subject = `[Absence Alert] ${payload.studentName} — ${payload.sessionDate} | ${payload.instituteName}`;

  if (!transporter) {
    // ── SIMULATED: log to console ───────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║   📧 SIMULATED ABSENCE EMAIL (no Gmail creds in .env)    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  TO:      ${to}`);
    console.log(`║  SUBJECT: ${subject}`);
    console.log(`║  BODY:\n${buildEmailText(payload)}`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    return { messageId: `sim_${Date.now()}`, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${payload.instituteName}" <${fromEmail}>`,
      to,
      subject,
      text: buildEmailText(payload),
      html: buildEmailHtml(payload),
    });
    console.log(`[NOTIFY][SENT] Email → ${to} | id: ${info.messageId}`);
    return { messageId: info.messageId };
  } catch (err: any) {
    console.error(`[NOTIFY][ERROR] Email → ${to}: ${err.message}`);
    return { error: err.message };
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export async function notifyAbsence(
  payload: AbsenceNotificationPayload
): Promise<NotificationResult> {
  const to = resolveEmail(payload.guardianEmail);
  const result = await sendAbsenceEmail(to, payload);

  const isConfigured = !!getTransporter();

  return {
    to,
    studentName: payload.studentName,
    status: result.error ? 'FAILED' : result.simulated ? 'SIMULATED' : 'SENT',
    messageId: result.messageId,
    error: result.error,
  };
}

export async function notifyAbsenceBatch(
  payloads: AbsenceNotificationPayload[]
): Promise<NotificationResult[]> {
  return Promise.all(payloads.map(notifyAbsence));
}
