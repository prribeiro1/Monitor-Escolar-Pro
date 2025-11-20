
import { Route, Stop, Student, AttendanceRecord, Incident, BackupData } from '../types';

const DB_NAME = 'SchoolMonitorDB';
const DB_VERSION = 1;

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('routes')) db.createObjectStore('routes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('stops')) db.createObjectStore('stops', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('students')) db.createObjectStore('students', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('attendance')) {
        const store = db.createObjectStore('attendance', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('studentId', 'studentId', { unique: false });
      }
      if (!db.objectStoreNames.contains('incidents')) db.createObjectStore('incidents', { keyPath: 'id' });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic GetAll
const getAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic Put
const putItem = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Generic Delete
const deleteItem = async (storeName: string, id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const dbService = {
  // Routes
  getRoutes: () => getAll<Route>('routes'),
  saveRoute: (route: Route) => putItem('routes', route),
  deleteRoute: (id: string) => deleteItem('routes', id),

  // Stops
  getStops: () => getAll<Stop>('stops'),
  saveStop: (stop: Stop) => putItem('stops', stop),
  deleteStop: (id: string) => deleteItem('stops', id),

  // Students
  getStudents: () => getAll<Student>('students'),
  saveStudent: (student: Student) => putItem('students', student),
  deleteStudent: (id: string) => deleteItem('students', id),

  // Attendance
  getAttendance: () => getAll<AttendanceRecord>('attendance'),
  saveAttendance: (record: AttendanceRecord) => putItem('attendance', record),
  
  // Incidents
  getIncidents: () => getAll<Incident>('incidents'),
  saveIncident: (incident: Incident) => putItem('incidents', incident),

  // Full Backup Export
  exportAllData: async (): Promise<BackupData> => {
    const routes = await getAll<Route>('routes');
    const stops = await getAll<Stop>('stops');
    const students = await getAll<Student>('students');
    const attendance = await getAll<AttendanceRecord>('attendance');
    const incidents = await getAll<Incident>('incidents');

    return {
      routes,
      stops,
      students,
      attendance,
      incidents,
      generatedAt: new Date().toISOString(),
    };
  },

  // Clear DB (for restore)
  clearDatabase: async (): Promise<void> => {
    const db = await openDB();
    const stores = ['routes', 'stops', 'students', 'attendance', 'incidents'];
    const tx = db.transaction(stores, 'readwrite');
    stores.forEach(store => tx.objectStore(store).clear());
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  }
};