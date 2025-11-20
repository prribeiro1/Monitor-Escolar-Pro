
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Student, AttendanceRecord, Route, Stop, Incident } from '../types';
import { Icon } from '../components/Icon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentStats {
    student: Student;
    presentCount: number;
    absentCount: number;
    presentDates: number[];
    absentDates: number[];
    incidentCount: number;
}

interface RouteReportGroup {
    routeName: string;
    students: StudentStats[];
}

// Helper: Initials Avatar for Modal (Larger)
const InitialsAvatarLarge: React.FC<{ name: string }> = ({ name }) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    const colorIndex = name.length % colors.length;
    return (
      <div className={`w-16 h-16 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-xl border-4 border-navy-700 mx-auto mb-2`}>
        {initials}
      </div>
    );
};

export const ReportsScreen: React.FC = () => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reportData, setReportData] = useState<Record<string, RouteReportGroup>>({});
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});
  
  // Details Modal
  const [selectedStudentStats, setSelectedStudentStats] = useState<StudentStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    const [students, routes, stops, attendance, allIncidents] = await Promise.all([
        dbService.getStudents(),
        dbService.getRoutes(),
        dbService.getStops(),
        dbService.getAttendance(),
        dbService.getIncidents()
    ]);

    setIncidents(allIncidents);

    // Group Logic
    const grouped: Record<string, RouteReportGroup> = {};

    // Initialize groups
    routes.forEach(r => {
        grouped[r.id] = { routeName: r.name, students: [] };
    });

    const stopMap = stops.reduce((acc, s) => ({...acc, [s.id]: s}), {} as Record<string, Stop>);

    students.forEach(student => {
        const stop = stopMap[student.stopId];
        if (!stop) return;
        const routeId = stop.routeId;
        if (!grouped[routeId]) return; 

        // Filter attendance for selected month
        const studentRecords = attendance.filter(a => 
            a.studentId === student.id && a.date.startsWith(month)
        );
        
        const presentRecs = studentRecords.filter(a => a.status === 'PRESENT');
        const absentRecs = studentRecords.filter(a => a.status === 'ABSENT');

        // Count incidents in month
        const studentIncidents = allIncidents.filter(i => 
            i.studentId === student.id && i.date.startsWith(month)
        );

        grouped[routeId].students.push({
            student,
            presentCount: presentRecs.length,
            absentCount: absentRecs.length,
            presentDates: presentRecs.map(r => parseInt(r.date.split('-')[2])),
            absentDates: absentRecs.map(r => parseInt(r.date.split('-')[2])),
            incidentCount: studentIncidents.length
        });
    });

    setReportData(grouped);
    
    // Auto expand logic (optional)
    const initialExpanded: Record<string, boolean> = {};
    routes.forEach(r => initialExpanded[r.id] = false); 
    setExpandedRoutes(initialExpanded);
  };

  const toggleRoute = (id: string) => {
    setExpandedRoutes(prev => ({...prev, [id]: !prev[id]}));
  };

  const openDetails = (stats: StudentStats) => {
    setSelectedStudentStats(stats);
    setIsModalOpen(true);
  };

  // --- PDF Export Logic ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Relatório Mensal: ${month}`, 14, 20);
    
    // Table Data
    const bodyData: any[] = [];
    
    Object.values(reportData).forEach((groupItem) => {
        const group = groupItem as RouteReportGroup;
        if(group.students.length === 0) return;
        // Group Header Row
        bodyData.push([{ content: group.routeName.toUpperCase(), colSpan: 5, styles: { fillColor: [26, 28, 53], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
        
        group.students.forEach(stat => {
            const pDates = stat.presentDates.sort((a,b)=>a-b).join(', ');
            const aDates = stat.absentDates.sort((a,b)=>a-b).join(', ');
            
            bodyData.push([
                stat.student.name,
                `${stat.presentCount} (${pDates})`,
                `${stat.absentCount} (${aDates})`,
                stat.incidentCount,
                `${((stat.presentCount / ((stat.presentCount + stat.absentCount) || 1)) * 100).toFixed(0)}%`
            ]);
        });
    });

    autoTable(doc, {
        head: [['Aluno', 'Presenças (Dias)', 'Faltas (Dias)', 'Ocorr.', 'Freq.']],
        body: bodyData,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
    });

    // Incidents Summary
    const monthIncidents = incidents.filter(i => i.date.startsWith(month));
    if (monthIncidents.length > 0) {
        doc.addPage();
        doc.text("Detalhamento de Ocorrências", 14, 20);
        
        const incidentBody = monthIncidents.map(inc => {
             let sName = "Desconhecido";
             Object.values(reportData).forEach((gItem) => {
                const g = gItem as RouteReportGroup;
                const s = g.students.find(st => st.student.id === inc.studentId);
                if (s) sName = s.student.name;
             });
             
             return [
                 new Date(inc.timestamp).toLocaleDateString(),
                 sName,
                 inc.type,
                 inc.observation
             ];
        });

        autoTable(doc, {
            head: [['Data', 'Aluno', 'Tipo', 'Observação']],
            body: incidentBody,
            startY: 30,
            styles: { fontSize: 8 },
            columnStyles: { 3: { cellWidth: 80 } } // Wrap observation
        });
    }

    doc.save(`relatorio_${month}.pdf`);
  };

  // --- Calendar Generation Helper ---
  const renderCalendar = (stats: StudentStats) => {
    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-7 gap-2 mt-4">
            {['D','S','T','Q','Q','S','S'].map((d,i) => <div key={i} className="text-center text-gray-500 text-xs font-bold">{d}</div>)}
            {days.map(day => {
                let bgClass = "bg-navy-700 text-gray-400"; // Default
                if (stats.presentDates.includes(day)) bgClass = "bg-green-500 text-white";
                if (stats.absentDates.includes(day)) bgClass = "bg-red-500 text-white";
                
                return (
                    <div key={day} className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${bgClass}`}>
                        {day}
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold text-white mb-4">Relatórios</h2>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)} 
            className="bg-navy-800 text-white p-3 rounded-xl border border-navy-700 w-full"
        />
      </div>

      {/* List */}
      <div className="space-y-4 mb-20">
        {Object.entries(reportData).map(([routeId, groupItem]) => {
            const group = groupItem as RouteReportGroup;
            if (group.students.length === 0) return null;
            const isExpanded = expandedRoutes[routeId];

            return (
                <div key={routeId} className="border border-navy-700 rounded-xl overflow-hidden">
                    <div 
                        onClick={() => toggleRoute(routeId)}
                        className="bg-navy-800 p-4 flex justify-between items-center cursor-pointer hover:bg-navy-700 transition"
                    >
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Icon name="bus" className="text-primary-500" /> 
                            {group.routeName}
                        </h3>
                        <Icon name={isExpanded ? "x" : "plus"} className="text-gray-400 rotate-45" size={16} />
                    </div>

                    {isExpanded && (
                        <div className="bg-navy-900/50 p-2 space-y-2">
                            {group.students.map(stats => (
                                <div key={stats.student.id} className="flex items-center justify-between p-3 bg-navy-800 rounded-lg border border-navy-700">
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{stats.student.name}</div>
                                        <div className="text-xs text-gray-400 flex gap-3 mt-1">
                                            <span className="text-green-400">Presenças: {stats.presentCount}</span>
                                            <span className="text-red-400">Faltas: {stats.absentCount}</span>
                                            {stats.incidentCount > 0 && <span className="text-yellow-500 font-bold">⚠️ {stats.incidentCount} Ocorr.</span>}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openDetails(stats); }}
                                        className="p-2 bg-navy-700 hover:bg-primary-600 text-primary-200 hover:text-white rounded-full transition"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* Floating Action Button for PDF */}
      <button 
        onClick={exportPDF}
        className="fixed bottom-20 right-4 bg-primary-600 hover:bg-primary-500 text-white p-4 rounded-full shadow-xl shadow-primary-600/30 flex items-center justify-center z-30"
      >
        <Icon name="save" size={24} />
      </button>

      {/* Details Modal */}
      {isModalOpen && selectedStudentStats && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-navy-800 p-6 rounded-2xl w-full max-w-sm border border-navy-600 relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <Icon name="x" />
                </button>
                
                <div className="text-center mb-4">
                    <InitialsAvatarLarge name={selectedStudentStats.student.name} />
                    <h3 className="text-xl font-bold text-white">{selectedStudentStats.student.name}</h3>
                    <p className="text-primary-400 text-sm">{month}</p>
                </div>

                <div className="bg-navy-900 p-4 rounded-xl">
                    {renderCalendar(selectedStudentStats)}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-green-500/20 p-2 rounded-lg text-center border border-green-500/30">
                        <div className="text-2xl font-bold text-green-500">{selectedStudentStats.presentCount}</div>
                        <div className="text-[10px] uppercase text-green-200">Presenças</div>
                    </div>
                    <div className="bg-red-500/20 p-2 rounded-lg text-center border border-red-500/30">
                        <div className="text-2xl font-bold text-red-500">{selectedStudentStats.absentCount}</div>
                        <div className="text-[10px] uppercase text-red-200">Faltas</div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};