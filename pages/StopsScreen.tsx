import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Route, Stop } from '../types';
import { Icon } from '../components/Icon';

export const StopsScreen: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});

  // Form State
  const [namesInput, setNamesInput] = useState(''); // Changed to support bulk text
  const [routeId, setRouteId] = useState('');

  const fetchData = async () => {
    const [s, r] = await Promise.all([dbService.getStops(), dbService.getRoutes()]);
    setStops(s);
    setRoutes(r);
    const initialExpanded: Record<string, boolean> = {};
    r.forEach(route => initialExpanded[route.id] = true);
    setExpandedRoutes(initialExpanded);

    if (r.length > 0 && !routeId) setRouteId(r[0].id);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleRoute = (id: string) => {
    setExpandedRoutes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Edição Única
      const stop: Stop = {
        id: editingId,
        routeId,
        name: namesInput,
        order: stops.find(s => s.id === editingId)?.order || 0
      };
      await dbService.saveStop(stop);
    } else {
      // Criação em Massa (Bulk Add)
      // Divide por quebra de linha ou vírgula
      const names = namesInput.split(/[\n,]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0);

      let currentCount = stops.length;

      for (const name of names) {
        const newStop: Stop = {
          id: crypto.randomUUID(),
          routeId,
          name,
          order: currentCount++
        };
        await dbService.saveStop(newStop);
      }
    }

    setIsModalOpen(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setNamesInput('');
    setEditingId(null);
    if (routes.length > 0) setRouteId(routes[0].id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir ponto?')) {
      await dbService.deleteStop(id);
      fetchData();
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Pontos de Embarque</h2>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary-600 hover:bg-primary-500 text-white p-3 rounded-full shadow-lg shadow-primary-600/30"
        >
          <Icon name="plus" />
        </button>
      </div>

      <div className="space-y-4">
        {routes.map(route => {
          const routeStops = stops.filter(s => s.routeId === route.id);
          const isExpanded = expandedRoutes[route.id];

          return (
            <div key={route.id} className="space-y-2">
              <div
                onClick={() => toggleRoute(route.id)}
                className="flex items-center justify-between bg-navy-800/50 p-3 rounded-lg cursor-pointer hover:bg-navy-800 transition-colors border border-navy-700"
              >
                <h3 className="text-accent-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Icon name="bus" size={16} />
                  {route.name} ({routeStops.length})
                </h3>
                <Icon name={isExpanded ? "x" : "plus"} size={14} className="text-gray-400 rotate-45 transition-transform" />
              </div>

              {isExpanded && (
                <div className="pl-2 space-y-2">
                  {routeStops.length === 0 && <p className="text-xs text-gray-500 ml-2 py-2">Nenhum ponto cadastrado.</p>}
                  {routeStops.map(stop => (
                    <div key={stop.id} className="bg-navy-800 p-4 rounded-xl border border-navy-700 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-navy-700 p-2 rounded-full text-gray-300">
                          <Icon name="map-pin" size={18} />
                        </div>
                        <span className="text-white font-medium">{stop.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setNamesInput(stop.name); setRouteId(stop.routeId); setEditingId(stop.id); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-white">
                          <Icon name="edit" size={16} />
                        </button>
                        <button onClick={() => handleDelete(stop.id)} className="p-2 text-red-400 hover:text-red-300">
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {routes.length === 0 && <p className="text-center text-gray-500 mt-10">Crie uma rota primeiro.</p>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 p-6 rounded-2xl w-full max-w-md border border-navy-700">
            <h3 className="text-xl font-bold text-white mb-4">{editingId ? 'Editar Ponto' : 'Novos Pontos'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rota</label>
                <select value={routeId} onChange={e => setRouteId(e.target.value)} className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg">
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {editingId ? 'Nome do Ponto' : 'Nomes (Cole uma lista ou digite um por linha)'}
                </label>
                {editingId ? (
                  <input type="text" value={namesInput} onChange={e => setNamesInput(e.target.value)} className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg" required />
                ) : (
                  <textarea
                    value={namesInput}
                    onChange={e => setNamesInput(e.target.value)}
                    placeholder="Ex: Padaria Central&#10;Praça da Matriz&#10;Rua das Flores"
                    className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg h-32"
                    required
                  />
                )}
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