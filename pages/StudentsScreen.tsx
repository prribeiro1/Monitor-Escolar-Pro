import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Stop, Student } from '../types';
import { Icon } from '../components/Icon';

interface StudentGroup {
  stopName: string;
  students: Student[];
}

const InitialsAvatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
  const colorIndex = name.length % colors.length;
  const bgClass = colors[colorIndex];

  return (
    <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center text-white font-bold text-sm border-2 border-navy-800`}>
      {initials}
    </div>
  );
};

export const StudentsScreen: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedStops, setExpandedStops] = useState<Record<string, boolean>>({});

  // Form State
  const [namesInput, setNamesInput] = useState(''); // Changed to support bulk
  const [stopId, setStopId] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [contact, setContact] = useState('');

  const fetchData = async () => {
    const [st, sp] = await Promise.all([dbService.getStudents(), dbService.getStops()]);
    setStudents(st);
    setStops(sp);

    const initialExpanded: Record<string, boolean> = {};
    sp.forEach(s => initialExpanded[s.id] = true);
    setExpandedStops(initialExpanded);

    if (sp.length > 0 && !stopId) setStopId(sp[0].id);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleStop = (id: string) => {
    setExpandedStops(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Edit Single
      const student: Student = {
        id: editingId,
        stopId,
        name: namesInput,
        active: true,
        guardianName,
        contact
      };
      await dbService.saveStudent(student);
    } else {
      // Bulk Add
      const names = namesInput.split(/[\n,]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0);

      for (const name of names) {
        const newStudent: Student = {
          id: crypto.randomUUID(),
          stopId,
          name,
          active: true,
          guardianName: '', // Bulk add starts without details
          contact: ''
        };
        await dbService.saveStudent(newStudent);
      }
    }

    setIsModalOpen(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setNamesInput('');
    setGuardianName('');
    setContact('');
    setEditingId(null);
  };

  const populateForm = (student: Student) => {
    setNamesInput(student.name);
    setStopId(student.stopId);
    setGuardianName(student.guardianName || '');
    setContact(student.contact || '');
    setEditingId(student.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover aluno?')) {
      await dbService.deleteStudent(id);
      fetchData();
    }
  };

  const groupedStudents = stops.reduce((acc, stop) => {
    acc[stop.id] = {
      stopName: stop.name,
      students: students.filter(s => s.stopId === stop.id)
    };
    return acc;
  }, {} as Record<string, StudentGroup>);

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Alunos</h2>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary-600 hover:bg-primary-500 text-white p-3 rounded-full shadow-lg"
        >
          <Icon name="plus" />
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedStudents).map(([id, grp]) => {
          const group = grp as StudentGroup;
          const isExpanded = expandedStops[id];

          if (group.students.length === 0) return null;

          return (
            <div key={id}>
              <div
                onClick={() => toggleStop(id)}
                className="flex items-center justify-between mb-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <h3 className="text-accent-500 font-bold flex items-center gap-2">
                  <Icon name="map-pin" size={16} />
                  {group.stopName} ({group.students.length})
                </h3>
                <Icon name={isExpanded ? "x" : "plus"} size={14} className="text-accent-500 rotate-45 transition-transform" />
              </div>

              {isExpanded && (
                <div className="grid gap-3">
                  {group.students.map(student => (
                    <div key={student.id} className="bg-navy-800 p-3 rounded-xl border border-navy-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={student.name} />
                        <div>
                          <span className="text-white font-medium block">{student.name}</span>
                          {(student.guardianName || student.contact) && (
                            <span className="text-[10px] text-gray-400 block">
                              Resp: {student.guardianName} {student.contact && `• ${student.contact}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        {student.contact && (
                          <a href={`tel:${student.contact}`} className="p-2 bg-green-500/20 text-green-400 rounded-full mr-2 hover:bg-green-500/40">
                            <Icon name="phone" size={16} />
                          </a>
                        )}
                        <button onClick={() => populateForm(student)} className="p-2 text-gray-400 hover:text-white">
                          <Icon name="edit" size={18} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-red-400 hover:text-red-300">
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {students.length === 0 && <p className="text-center text-gray-500 mt-10">Nenhum aluno cadastrado.</p>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 p-6 rounded-2xl w-full max-w-md border border-navy-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">{editingId ? 'Editar Aluno' : 'Novos Alunos'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {editingId ? 'Nome Completo *' : 'Nomes (Cole uma lista ou digite um por linha)'}
                </label>
                {editingId ? (
                  <input type="text" value={namesInput} onChange={e => setNamesInput(e.target.value)} className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg" required />
                ) : (
                  <textarea
                    value={namesInput}
                    onChange={e => setNamesInput(e.target.value)}
                    placeholder="João Silva&#10;Maria Souza&#10;Pedro Santos"
                    className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg h-32"
                    required
                  />
                )}
              </div>

              {/* Esconde detalhes ao adicionar em massa para simplificar */}
              {editingId && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome do Responsável</label>
                    <input type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Opcional" className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Contato (Tel/Cel)</label>
                    <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="Opcional" className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Ponto de Embarque *</label>
                <select value={stopId} onChange={e => setStopId(e.target.value)} className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg">
                  {stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};