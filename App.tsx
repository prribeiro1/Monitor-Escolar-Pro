import React, { useState, useEffect, PropsWithChildren, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Icon, IconName } from './components/Icon';
import { LoginScreen } from './pages/LoginScreen';
import { RoutesScreen } from './pages/RoutesScreen';
import { StopsScreen } from './pages/StopsScreen';
import { StudentsScreen } from './pages/StudentsScreen';
import { AttendanceScreen } from './pages/AttendanceScreen';
import { IncidentsScreen } from './pages/IncidentsScreen';
import { ReportsScreen } from './pages/ReportsScreen';
import { backupRepository } from './services/BackupRepository';

// Declare google property on window object to fix TypeScript errors
declare global {
  interface Window {
    google: any;
  }
}

// *** CONFIGURAÇÃO DO GOOGLE ***
// 👇👇👇 COLE O SEU "ID DO CLIENTE" ABAIXO (Mantenha as aspas) 👇👇👇
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'; 
// 👆👆👆 Exemplo: '123456789-abcdefgh.apps.googleusercontent.com'

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenClient, setTokenClient] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('school_monitor_user');
    if (stored) setUser(JSON.parse(stored));
    
    // Inicializar Google Identity Services
    const initializeGoogle = () => {
        if (window.google && GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID')) {
            try {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: SCOPES,
                    callback: (tokenResponse: any) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            handleGoogleSuccess(tokenResponse.access_token);
                        }
                    },
                });
                setTokenClient(client);
            } catch (err) {
                console.error("Erro ao inicializar Google Client:", err);
            }
        }
    };

    // Tenta inicializar imediatamente ou espera o script carregar
    if (window.google) {
        initializeGoogle();
    } else {
        const interval = setInterval(() => {
            if (window.google) {
                initializeGoogle();
                clearInterval(interval);
            }
        }, 500);
    }
    
    setLoading(false);
  }, []);

  const handleGoogleSuccess = async (accessToken: string) => {
      // Buscar perfil do usuário com o token
      try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
          });
          const profile = await res.json();
          
          const userData = {
              name: profile.name,
              email: profile.email,
              picture: profile.picture,
              accessToken: accessToken // Guardar token para usar no Drive
          };

          localStorage.setItem('school_monitor_user', JSON.stringify(userData));
          setUser(userData);
      } catch (error) {
          console.error("Erro ao buscar perfil Google", error);
          alert("Erro ao validar login Google.");
      }
  };

  const login = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID')) {
        alert("CONFIGURAÇÃO NECESSÁRIA:\n\nAbra o arquivo App.tsx e coloque seu GOOGLE_CLIENT_ID real na linha 23.");
        return;
    }

    if (tokenClient) {
        tokenClient.requestAccessToken();
    } else {
        alert("Serviço de Login Google ainda não carregou. Verifique sua conexão ou recarregue a página.");
    }
  };

  const logout = () => {
    const stored = localStorage.getItem('school_monitor_user');
    if (stored) {
        const u = JSON.parse(stored);
        if (window.google && u.accessToken) {
            // Revogar permissão (opcional, mas bom para segurança)
            try {
                window.google.accounts.oauth2.revoke(u.accessToken, () => {});
            } catch (e) {
                console.warn("Erro ao revogar token", e);
            }
        }
    }
    localStorage.removeItem('school_monitor_user');
    setUser(null);
  };

  return { user, loading, login, logout };
};

// --- Layout Components ---
interface BottomNavItemProps {
  to: string;
  icon: IconName;
  label: string;
  active: boolean;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ to, icon, label, active }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(to)}
      className={`flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors ${active ? 'text-primary-500' : 'text-gray-400'}`}
    >
      <Icon name={icon} size={20} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </div>
  );
};

interface LayoutProps {
  onLogout: () => void;
  onBackup: () => void;
  isBackupLoading: boolean;
}

const Layout: React.FC<PropsWithChildren<LayoutProps>> = ({ children, onLogout, onBackup, isBackupLoading }) => {
  const location = useLocation();
  const [appTitle, setAppTitle] = useState(() => localStorage.getItem('app_title') || 'Monitor Escolar');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTitleSave = () => {
    localStorage.setItem('app_title', appTitle);
    setIsEditingTitle(false);
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);
  
  const tabs = [
    { path: '/routes', icon: 'road' as IconName, label: 'Rotas' },
    { path: '/stops', icon: 'map-pin' as IconName, label: 'Pontos' },
    { path: '/students', icon: 'users' as IconName, label: 'Alunos' },
    { path: '/attendance', icon: 'check' as IconName, label: 'Chamada' },
    { path: '/incidents', icon: 'alert-triangle' as IconName, label: 'Ocor.' },
    { path: '/reports', icon: 'bar-chart' as IconName, label: 'Relat.' },
  ];

  return (
    <div className="flex flex-col h-screen bg-navy-900 text-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-navy-800 p-4 shadow-lg flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Icon name="face" className="text-primary-500" size={28} />
          {isEditingTitle ? (
            <input 
              ref={titleInputRef}
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="bg-navy-900 border border-primary-500 rounded px-2 py-1 text-white text-lg font-bold outline-none w-48"
            />
          ) : (
            <h1 className="text-xl font-bold text-white flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              {appTitle}
              <Icon name="pencil" size={14} className="text-gray-500 opacity-50" />
            </h1>
          )}
        </div>
        <div className="flex gap-3">
            <button onClick={onBackup} disabled={isBackupLoading} className={`p-2 bg-accent-500/20 text-accent-500 rounded-full hover:bg-accent-500/30 transition ${isBackupLoading ? 'opacity-50 animate-pulse' : ''}`}>
                <Icon name={isBackupLoading ? "save" : "cloud-upload"} size={20} />
            </button>
            <button onClick={onLogout} className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition">
                <Icon name="log-out" size={20} />
            </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-navy-900 relative">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-navy-800 h-16 flex items-center justify-around shadow-inner border-t border-navy-700 z-20 shrink-0 pb-safe">
        {tabs.map(tab => (
          <BottomNavItem 
            key={tab.path} 
            to={tab.path} 
            icon={tab.icon} 
            label={tab.label} 
            active={location.pathname === tab.path} 
          />
        ))}
      </nav>
    </div>
  );
};

interface ProtectedRouteProps {
  user: any;
}

const ProtectedRoute: React.FC<PropsWithChildren<ProtectedRouteProps>> = ({ children, user }) => {
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [backupLoading, setBackupLoading] = useState(false);

  const performBackup = async () => {
    if (backupLoading) return;
    setBackupLoading(true);
    try {
        // 1. Backup Local
        await backupRepository.exportDataLocal();
        
        // 2. Backup Drive
        if (user && user.accessToken) {
            await backupRepository.uploadToDrive(user.accessToken);
            alert("Sucesso!\n1. Arquivo salvo na pasta Downloads (Dispositivo).\n2. Arquivo enviado para seu Google Drive.");
        } else {
            alert("Backup local salvo!\n\nAviso: Não foi possível salvar no Google Drive pois o login não forneceu um token de acesso válido. Tente sair e logar novamente.");
        }
    } catch (e: any) {
        console.error(e);
        alert(`Erro no backup: ${e.message || 'Erro desconhecido'}`);
    } finally {
        setBackupLoading(false);
    }
  };

  if (loading) return <div className="h-screen bg-navy-900 flex items-center justify-center text-white">Carregando...</div>;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginScreen onLogin={login} /> : <Navigate to="/attendance" />} />
        
        <Route path="/*" element={
          <ProtectedRoute user={user}>
            <Layout onLogout={logout} onBackup={performBackup} isBackupLoading={backupLoading}>
              <Routes>
                <Route path="/routes" element={<RoutesScreen />} />
                <Route path="/stops" element={<StopsScreen />} />
                <Route path="/students" element={<StudentsScreen />} />
                <Route path="/attendance" element={<AttendanceScreen />} />
                <Route path="/incidents" element={<IncidentsScreen />} />
                <Route path="/reports" element={<ReportsScreen />} />
                <Route path="*" element={<Navigate to="/attendance" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
}