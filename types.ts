
export interface Route {
  id: string;
  name: string; // e.g., "Russier-Varelinha"
  description?: string;
}

export interface Stop {
  id: string;
  routeId: string;
  name: string; // e.g., "Túnel que chora"
  order: number;
}

export interface Student {
  id: string;
  stopId: string;
  name: string;
  // photoUrl removed for Local-First privacy
  active: boolean;
  guardianName?: string; // Nome do Responsável
  contact?: string; // Telefone/Contato
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  UNMARKED = 'UNMARKED'
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO Date string YYYY-MM-DD
  status: AttendanceStatus;
  timestamp: number;
}

export interface Incident {
  id: string;
  studentId: string;
  type: string;
  observation: string;
  date: string; // ISO Date string
  timestamp: number;
}

export interface BackupData {
  routes: Route[];
  stops: Stop[];
  students: Student[];
  attendance: AttendanceRecord[];
  incidents: Incident[];
  generatedAt: string;
}