// workforceStorage.js - Shared state and persistence for Clock In/Out, Attendance, and Requests

const DEFAULT_ATTENDANCE_HISTORY = [
  { id: 'att-1', date: '2026-10-23', day: 'Friday', clockIn: '09:02 AM', lunchOut: '12:00 PM', lunchIn: '01:00 PM', clockOut: '06:05 PM', totalHours: 8.05, status: 'Completed', notes: 'On-time shift' },
  { id: 'att-2', date: '2026-10-22', day: 'Thursday', clockIn: '08:58 AM', lunchOut: '12:05 PM', lunchIn: '01:05 PM', clockOut: '06:00 PM', totalHours: 8.03, status: 'Completed', notes: 'On-time shift' },
  { id: 'att-3', date: '2026-10-21', day: 'Wednesday', clockIn: '09:05 AM', lunchOut: '12:15 PM', lunchIn: '01:10 PM', clockOut: '06:12 PM', totalHours: 8.12, status: 'Completed', notes: 'Completed regular shift' },
  { id: 'att-4', date: '2026-10-20', day: 'Tuesday', clockIn: '08:55 AM', lunchOut: '12:00 PM', lunchIn: '01:00 PM', clockOut: '07:30 PM', totalHours: 9.58, status: 'Completed (OT)', notes: 'Overtime approved (1.5h)' },
  { id: 'att-5', date: '2026-10-19', day: 'Monday', clockIn: '09:00 AM', lunchOut: '12:00 PM', lunchIn: '01:00 PM', clockOut: '06:00 PM', totalHours: 8.00, status: 'Completed', notes: 'On-time shift' },
  { id: 'att-6', date: '2026-10-16', day: 'Friday', clockIn: '09:04 AM', lunchOut: '12:00 PM', lunchIn: '01:00 PM', clockOut: '06:08 PM', totalHours: 8.07, status: 'Completed', notes: 'On-time shift' },
  { id: 'att-7', date: '2026-10-15', day: 'Thursday', clockIn: '08:57 AM', lunchOut: '12:30 PM', lunchIn: '01:30 PM', clockOut: '06:02 PM', totalHours: 8.08, status: 'Completed', notes: 'Cut-off day recorded' },
  { id: 'att-8', date: '2026-10-14', day: 'Wednesday', clockIn: '09:15 AM', lunchOut: '12:00 PM', lunchIn: '01:00 PM', clockOut: '06:15 PM', totalHours: 8.00, status: 'Grace Period', notes: 'Late arrival (+15m)' },
  { id: 'att-9', date: '2026-10-13', day: 'Tuesday', clockIn: '08:52 AM', lunchOut: '12:00 PM', lunchIn: '01:00 PM', clockOut: '06:01 PM', totalHours: 8.15, status: 'Completed', notes: 'On-time shift' },
  { id: 'att-10', date: '2026-10-12', day: 'Monday', clockIn: '09:00 AM', lunchOut: '12:00 PM', lunchIn: '01:00 PM', clockOut: '06:00 PM', totalHours: 8.00, status: 'Completed', notes: 'On-time shift' },
];

const DEFAULT_REQUESTS = [
  {
    id: 'REQ-1042',
    type: 'Overtime Pre-Approval',
    incidentDate: '2026-10-24',
    hours: '2.0 hrs',
    manager: 'Danilo Navarro (DevOps Director)',
    reason: 'Database migration and Kubernetes ingress routing patch release',
    submittedAt: '2026-10-22',
    status: 'Approved'
  },
  {
    id: 'REQ-1038',
    type: 'Time Correction / Missed Log',
    incidentDate: '2026-10-14',
    hours: '15 mins',
    manager: 'Maria Santos (HR Manager)',
    reason: 'Network disconnect during morning biometric bridge sync',
    submittedAt: '2026-10-15',
    status: 'Pending'
  },
  {
    id: 'REQ-1025',
    type: 'Official Business / Shift Adjustment',
    incidentDate: '2026-10-09',
    hours: 'Full Day',
    manager: 'Danilo Navarro (DevOps Director)',
    reason: 'Client technical discovery workshop with Danish engineering leads',
    submittedAt: '2026-10-07',
    status: 'Approved'
  }
];

export function getAttendanceState(userId = 'default') {
  try {
    const raw = localStorage.getItem(`ops_attendance_v3_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    currentStatus: 'Clocked Out', // Starts with Clock In first
    todayLogs: {
      clockIn: null,
      breakStart: null,
      breakEnd: null,
      lunchOut: null,
      lunchIn: null,
      clockOut: null,
      elapsedHours: '0h 00m',
    },
    history: DEFAULT_ATTENDANCE_HISTORY
  };
}

export function saveAttendanceState(state, userId = 'default') {
  try {
    localStorage.setItem(`ops_attendance_v3_${userId}`, JSON.stringify(state));
    localStorage.setItem(`ops_attendance_${userId}`, JSON.stringify(state));
  } catch (e) {}
}

export function getTimeRequests(userId = 'default') {
  try {
    const raw = localStorage.getItem(`ops_requests_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return DEFAULT_REQUESTS;
}

export function saveTimeRequests(requests, userId = 'default') {
  try {
    localStorage.setItem(`ops_requests_${userId}`, JSON.stringify(requests));
  } catch (e) {}
}
