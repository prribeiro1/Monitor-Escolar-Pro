import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Route } from '../types';
import { Icon } from '../components/Icon';

export const RoutesScreen: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');

  const loadRoutes = async () => {
    const data = await dbService.getRoutes();
    setRoutes(data);
  };

  useEffect(() => { loadRoutes(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRoute: Route = {
      id: editingId || crypto.randomUUID(),
      name: formName
    };
    await dbService.saveRoute(newRoute);
    setIsModalOpen(false);
    setFormName('');
    setEditingId(null);
    loadRoutes();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir rota? Isso não exclui os alunos vinculados, mas pode afetar os relatórios.')) {
      await dbService.deleteRoute(id);
      loadRoutes();
    }
  };

  const openEdit = (route: Route) => {
    setFormName(route.name);
    setEditingId(route.id);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Rotas</h2>
        <button 
          onClick={() => { setEditingId(null); setFormName(''); setIsModalOpen(true); }}
          className="bg-primary-600 hover:bg-primary-500 text-white p-3 rounded-full shadow-lg shadow-primary-600/30"
        >
          <Icon name="plus" />
        </button>
      </div>

      <div className="space-y-3">
        {routes.length === 0 && <p className="text-gray-500 text-center mt-10">Nenhuma rota cadastrada.</p>}
        {routes.map(route => (
          <div key={route.id} className="bg-navy-800 p-4 rounded-xl border border-navy-700 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-4">
              <div className="bg-navy-700 p-2 rounded-lg text-primary-500">
                <Icon name="road" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{route.name}</h3>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(route)} className="p-2 text-gray-400 hover:text-white bg-navy-900/50 rounded-lg">
                <Icon name="edit" size={18} />
              </button>
              <button onClick={() => handleDelete(route.id)} className="p-2 text-red-400 hover:text-red-300 bg-navy-900/50 rounded-lg">
                <Icon name="trash" size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 p-6 rounded-2xl w-full max-w-md border border-navy-700">
            <h3 className="text-xl font-bold text-white mb-4">{editingId ? 'Editar Rota' : 'Nova Rota'}</h3>
            <form onSubmit={handleSubmit}>
              <label className="block text-sm text-gray-400 mb-1">Nome da Rota</label>
              <input 
                type="text" 
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ex: Centro - Bairro Alto"
                className="w-full bg-navy-900 border border-navy-700 text-white p-3 rounded-lg focus:border-primary-500 outline-none mb-6"
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-white">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
