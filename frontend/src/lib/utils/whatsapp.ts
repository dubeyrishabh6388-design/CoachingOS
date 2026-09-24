/**
 * Zero-Cost Direct WhatsApp Engine for Indian Coaching Institutes
 * 100% Free - Requires NO Meta API keys, NO Twilio subscription, and NO credit card.
 */

/**
 * Robust Indian Mobile Number Normalizer
 * Strips whitespace, dashes, leading 0s, and handles existing +91 or 91 prefixes
 * to ensure WhatsApp Web / App never rejects the number as invalid.
 */
export function normalizeIndianPhone(phone?: string | null): string {
  if (!phone) return '919876543210';
  let digits = phone.replace(/\D/g, '');

  // Strip leading zero if present (e.g. 09876543210 -> 9876543210)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // If already prefixed with 91 and has 12 digits, it's perfect
  if (digits.startsWith('91') && digits.length === 12) {
    return digits;
  }

  // If standard 10-digit Indian mobile number, prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // If more than 10 digits, extract the last 10 digits and prepend 91
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    return `91${last10}`;
  }

  // Fallback
  return `91${digits}`;
}

/**
 * Builds universal WhatsApp link compatible with both WhatsApp Web and Mobile Apps
 */
export function buildWhatsAppUniversalUrl(phone: string, messageText: string): string {
  const normalizedPhone = normalizeIndianPhone(phone);
  const encodedText = encodeURIComponent(messageText);
  // api.whatsapp.com/send directly triggers WhatsApp Web or WhatsApp Desktop without redirect errors
  return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
}

export interface WhatsAppFeeReminderParams {
  parentPhone: string;
  parentName: string;
  studentName: string;
  batchName: string;
  dueAmountRupees: number;
  dueDate: string;
  instituteName: string;
  institutePhone: string;
  upiVpa?: string;
}

export function buildFeeReminderWhatsAppUrl({
  parentPhone,
  parentName,
  studentName,
  batchName,
  dueAmountRupees,
  dueDate,
  instituteName,
  institutePhone,
  upiVpa = 'coachingos@upi'
}: WhatsAppFeeReminderParams): string {
  const upiLink = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(instituteName)}&am=${dueAmountRupees}&cu=INR`;

  const message = 
    `*Fee Installment Reminder from ${instituteName}*\n\n` +
    `Namaste ${parentName || 'Parent'},\n` +
    `This is a gentle reminder that the tuition fee installment for *${studentName}* (${batchName}) is due.\n\n` +
    `📌 *Due Amount:* ₹${dueAmountRupees.toLocaleString('en-IN')}\n` +
    `📅 *Due Date:* ${dueDate}\n\n` +
    `💡 *Instant 1-Click UPI Payment:*\n` +
    `UPI VPA: *${upiVpa}*\n` +
    `Direct Link: ${upiLink}\n\n` +
    `If already paid via counter cash/cheque, please ignore this notice.\n` +
    `For queries, contact Accounts Desk: ${institutePhone}\n\n` +
    `Thank you,\n*${instituteName}*`;

  return buildWhatsAppUniversalUrl(parentPhone, message);
}

export interface WhatsAppAbsentAlertParams {
  parentPhone: string;
  parentName: string;
  studentName: string;
  batchName: string;
  classTime: string;
  instituteName: string;
  directorPhone: string;
}

export function buildAbsentAlertWhatsAppUrl({
  parentPhone,
  parentName,
  studentName,
  batchName,
  classTime,
  instituteName,
  directorPhone
}: WhatsAppAbsentAlertParams): string {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const message = 
    `🚨 *IMPORTANT: Student Absent Notice*\n\n` +
    `Dear ${parentName || 'Parent'},\n` +
    `Your child *${studentName}* was marked *ABSENT* today (${today}) in *${batchName}* at *${classTime}*.\n\n` +
    `⚠️ If you were not aware of this absence, please contact the Director's Desk immediately at *${directorPhone}* to verify their safety.\n\n` +
    `Regards,\n*Director, ${instituteName}*`;

  return buildWhatsAppUniversalUrl(parentPhone, message);
}

export interface WhatsAppDemoInviteParams {
  parentPhone: string;
  studentName: string;
  targetCourse: string;
  demoDate: string;
  demoTime: string;
  instituteName: string;
  campusAddress: string;
}

export function buildDemoInviteWhatsAppUrl({
  parentPhone,
  studentName,
  targetCourse,
  demoDate,
  demoTime,
  instituteName,
  campusAddress
}: WhatsAppDemoInviteParams): string {
  const message = 
    `🌟 *Welcome to ${instituteName}! Free Demo Class Invitation*\n\n` +
    `Dear ${studentName},\n` +
    `Thank you for visiting our campus. We are pleased to invite you to an exclusive *Free Expert Faculty Demo Class* for *${targetCourse}*.\n\n` +
    `📅 *Date:* ${demoDate}\n` +
    `⏰ *Time:* ${demoTime}\n` +
    `📍 *Venue:* ${campusAddress}\n\n` +
    `Experience our Kota-curated study material, high-yield DPPs, and personalized doubt clearance.\n\n` +
    `Seats are limited per batch. Kindly reply "CONFIRMED" to reserve your seat.\n\n` +
    `*Admissions Team, ${instituteName}*`;

  return buildWhatsAppUniversalUrl(parentPhone, message);
}
