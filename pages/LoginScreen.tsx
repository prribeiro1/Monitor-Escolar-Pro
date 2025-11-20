import React from 'react';
import { Icon } from '../components/Icon';

interface Props {
  onLogin: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-navy-900 p-6">
      <div className="w-full max-w-sm bg-navy-800 p-8 rounded-2xl shadow-2xl border border-navy-700 text-center">
        <div className="bg-navy-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary-500 shadow-lg shadow-primary-500/20">
          <Icon name="bus" size={40} className="text-primary-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Monitor Escolar</h2>
        <p className="text-gray-400 mb-8">Gestão de transporte inteligente</p>

        <button 
          onClick={onLogin}
          className="w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
        >
          <Icon name="google" size={20} className="text-red-600" />
          Entrar com Google
        </button>

        <p className="mt-6 text-xs text-gray-500">
          Ao entrar, seus dados serão sincronizados com o Google Drive para backup.
        </p>
      </div>
    </div>
  );
};