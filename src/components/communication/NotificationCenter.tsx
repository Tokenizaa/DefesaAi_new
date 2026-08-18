import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Bell,
  CheckCircle2,
  X,
  Shield,
  Loading,
  Error,
  Text,
} from 'lucide-react';
import { useRouter } from '../../core/router/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { CaseDomain } from '../../types';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  caseId?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentCaseId?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  currentCaseId,
}) => {
  const { user, unreadNotifications } = useAuth();
  const { navigate } = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  
  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch notifications from an API
        // For now, we'll simulate with some data
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'status_update',
            message: 'Seu recurso foi protocolado com sucesso na JARI.',
            timestamp: new Date().toISOString(),
            read: false,
            caseId: currentCaseId,
          },
          {
            id: '2',
            type: 'defense_ready',
            message: 'A minuta defensiva está pronta para protocolo.',
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            read: true,
            caseId: currentCaseId,
          },
          {
            id: '3',
            type: 'deadline_reminder',
            message: 'Prazo de 48 horas para protocolar a defesa.',
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            read: false,
            caseId: currentCaseId,
          },
        ];
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNotifications();
  }, [currentCaseId]);
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    // Navigate to case detail if caseId is provided
    if (notification.caseId) {
      navigate(`/cases/${notification.caseId}`);
    }
  };
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const handleClose = () => {
    onClose();
  };
  
  if (!isOpen) return null;
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Centro de Notificações</h3>
                <p className="text-[10px] text-slate-500 font-mono">Evolution API • Webhook Seguro</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 p-6">
              <Loading className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-sm text-slate-500">Carregando notificações...</p>
            </div>
          ) : (
            <div className="space-y-3 p-4 max-h-[600px] overflow-y-auto">
              {notifications
                .filter(notification => 
                  filter === 'all' || 
                  notification.type === filter
                )
                .map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer ${
                      notification.read ? 'bg-slate-50' : 'bg-slate-100'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">{notification.message}</h4>
                          <p className="text-[9px] text-slate-500">
                            {new Date(notification.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] ${
                          notification.read ? 'text-gray-400' : 'text-orange-600'
                        }`}>
                          {notification.type === 'status_update' ? 'Atualização' :
                           notification.type === 'defense_ready' ? 'Minuta Pronta' :
                           notification.type === 'deadline_reminder' ? 'Lembrete de Prazo' :
                           notification.type === 'deferimento' ? 'Resultado' : 'Outro'}
                        </span>
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      </div>
                    </div>
                  </div>
                ))
              
              {notifications.length === 0 ? (
                <div className="text-center p-4">
                  <Text className="text-slate-400">
                    Nenhuma notificação encontrada.
                  </Text>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Text className="text-slate-500">Filtrar por:</Text>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs"
                      >
                        <option value="all">Todas</option>
                        <option value="status_update">Atualização de Julgamento</option>
                        <option value="defense_ready">Minuta Pronta</option>
                        <option value="deadline_reminder">Lembrete de Prazo</option>
                        <option value="deferimento">Resultado</option>
                      </select>
                    </div>
                    <button
                      onClick={handleClose}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  );
};