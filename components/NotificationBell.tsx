'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const APP_ID = 'writings-app';

interface InAppNotification {
  id: string;
  type: 'new_submission' | 'corrected';
  title: string;
  message: string;
  read: boolean;
  relatedId: string;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const { user } = useApp();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Escuchar notificaciones en tiempo real (Firestore OnSnapshot)
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    // Suscripción en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: InAppNotification[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as InAppNotification);
      });
      setNotifications(fetched);
    }, (error) => {
      console.error("Error en el listener de notificaciones:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Cuentas las notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Cerrar el dropdown si se hace click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar el click en una notificación
  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!user) return;

    setIsOpen(false);

    // 1. Marcar como leída en Firestore
    try {
      const notifDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'notifications', notif.id);
      await updateDoc(notifDocRef, { read: true });
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }

    // 2. Redirección inteligente basada en el tipo de alerta
    if (notif.type === 'new_submission') {
      // Si eres profesor/creador, te lleva directo a corregir el texto recibido
      router.push(`/community/evaluate/${notif.relatedId}`);
    } else if (notif.type === 'corrected') {
      // Si eres alumno, te lleva a la pantalla de corrección manual
      router.push(`/community/evaluate/${notif.relatedId}`);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icono de la Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600 transition-colors focus:outline-none"
        aria-label="Notificaciones"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>

        {/* Badge Rojo Flotante */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Menú Desplegable (Dropdown) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
            <h4 className="font-bold text-gray-900 text-sm">Notificaciones</h4>
            <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">
              {unreadCount} nuevas
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-medium">
                📭 No tienes alertas por el momento.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 text-left ${
                    !notif.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="text-xl mt-0.5">
                    {notif.type === 'new_submission' ? '📥' : '✨'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs text-gray-900 ${!notif.read ? 'font-bold' : 'font-medium'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-gray-400 block mt-1 font-semibold">
                      {new Date(notif.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-[#2563EB] rounded-full self-center"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}