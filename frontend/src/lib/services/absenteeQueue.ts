/**
 * Absentee Communication Queue Service
 * Bridges Classroom Attendance Kiosk -> Parent & Student WhatsApp Messages
 * Allows 1-Click transfer and multi-number WhatsApp dispatch for all absent students.
 */

export interface AbsenteeItem {
  id: string; // studentId
  studentName: string;
  rollNumber: string;
  batchId: string;
  batchName: string;
  guardianName: string;
  guardianPhone: string;
  markedAt: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sessionTime?: string;
  notes?: string;
}

const STORAGE_KEY_PREFIX = 'coachingos_absentee_queue_';

// Default initial mock absentees for demonstration so new users see immediate data
const DEFAULT_ABSENTEES: Record<string, AbsenteeItem[]> = {
  'org-kota-001': [
    {
      id: 'stu-003',
      studentName: 'Rohan Sharma',
      rollNumber: 'KOTA-JEE-27-03',
      batchId: 'batch-jee-a',
      batchName: 'Target JEE 2027 (Alpha)',
      guardianName: 'Dr. Alok Sharma',
      guardianPhone: '9810011223',
      markedAt: new Date().toISOString(),
      status: 'PENDING',
      sessionTime: '09:00 AM Physics Mechanics',
    },
    {
      id: 'stu-005',
      studentName: 'Kavita Reddy',
      rollNumber: 'KOTA-NEET-27-02',
      batchId: 'batch-neet-pinnacle',
      batchName: 'NEET Pinnacle Rankers',
      guardianName: 'Suresh Reddy',
      guardianPhone: '9820033445',
      markedAt: new Date().toISOString(),
      status: 'PENDING',
      sessionTime: '10:30 AM Organic Chemistry',
    },
    {
      id: 'stu-008',
      studentName: 'Aditya Gupta',
      rollNumber: 'KOTA-JEE-27-08',
      batchId: 'batch-jee-a',
      batchName: 'Target JEE 2027 (Alpha)',
      guardianName: 'Sunita Gupta',
      guardianPhone: '9830055667',
      markedAt: new Date().toISOString(),
      status: 'PENDING',
      sessionTime: '09:00 AM Physics Mechanics',
    },
  ],
};

export const absenteeQueueService = {
  getTodayAbsentees(organizationId: string): AbsenteeItem[] {
    if (typeof window === 'undefined') {
      return DEFAULT_ABSENTEES[organizationId] || [];
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${organizationId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading absentee queue from localStorage', e);
    }

    // Fallback to default absentees
    const fallback = DEFAULT_ABSENTEES[organizationId] || DEFAULT_ABSENTEES['org-kota-001'] || [];
    this.saveTodayAbsentees(organizationId, fallback);
    return fallback;
  },

  saveTodayAbsentees(organizationId: string, absentees: AbsenteeItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${organizationId}`, JSON.stringify(absentees));
      // Dispatch custom browser event for instant live-sync across open tabs/pages
      window.dispatchEvent(new CustomEvent('coachingos_absentee_updated', { detail: { organizationId } }));
    } catch (e) {
      console.error('Error saving absentee queue to localStorage', e);
    }
  },

  syncFromAttendanceKiosk(
    organizationId: string,
    batchId: string,
    batchName: string,
    absentStudents: Array<{
      id: string;
      fullName: string;
      rollNumber?: string;
      guardianName?: string;
      guardianPhone?: string;
      phone?: string;
    }>
  ): AbsenteeItem[] {
    const existing = this.getTodayAbsentees(organizationId);
    const existingIds = new Set(existing.map((e) => e.id));

    const newItems: AbsenteeItem[] = absentStudents.map((s) => ({
      id: s.id,
      studentName: s.fullName,
      rollNumber: s.rollNumber || `ROLL-${s.id.slice(-4).toUpperCase()}`,
      batchId,
      batchName,
      guardianName: s.guardianName || `Parent of ${s.fullName}`,
      guardianPhone: s.guardianPhone || s.phone || '9876543210',
      markedAt: new Date().toISOString(),
      status: 'PENDING',
      sessionTime: "Today's Lecture",
    }));

    // Merge: retain existing status if already in queue, add new ones
    const merged = [
      ...existing.filter((item) => !newItems.some((n) => n.id === item.id)),
      ...newItems.map((n) => {
        const found = existing.find((e) => e.id === n.id);
        return found ? { ...found, batchName, markedAt: n.markedAt } : n;
      }),
    ];

    this.saveTodayAbsentees(organizationId, merged);
    return merged;
  },

  markAbsenteeStatus(organizationId: string, studentId: string, status: 'PENDING' | 'SENT' | 'FAILED'): void {
    const current = this.getTodayAbsentees(organizationId);
    const updated = current.map((item) => (item.id === studentId ? { ...item, status } : item));
    this.saveTodayAbsentees(organizationId, updated);
  },

  markAllSent(organizationId: string): void {
    const current = this.getTodayAbsentees(organizationId);
    const updated = current.map((item) => ({ ...item, status: 'SENT' as const }));
    this.saveTodayAbsentees(organizationId, updated);
  },

  clearQueue(organizationId: string): void {
    this.saveTodayAbsentees(organizationId, []);
  },
};
