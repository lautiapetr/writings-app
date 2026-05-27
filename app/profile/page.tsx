'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import Logo from '@/components/Logo';

interface HistoricalWriting {
  id: string;
  topic: string;
  format: string;
  originalText: string;
  score: number;
  generalFeedback: string;
  level: string;
  createdAt: string;
  errors: {
    original_text: string;
    correction: string;
    explanation: string;
  }[];
}

const APP_ID = 'writings-app';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userName, loadingAuth, userLevel, logout } = useApp();
  const [writings, setWritings] = useState<HistoricalWriting[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const historyCollectionRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'writings');
        const querySnapshot = await getDocs(historyCollectionRef);
        const data: HistoricalWriting[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as HistoricalWriting);
        });

        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWritings(data);
      } catch (error) {
        console.error("Error al obtener historial:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  if (loadingAuth || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const averageScore = writings.length > 0 
    ? Math.round(writings.reduce((sum, w) => sum + w.score, 0) / writings.length) 
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1F2937] font-sans pb-20">
      
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center bg-white shadow-sm border-b border-gray-100">
        <Logo />
        <button 
          onClick={logout}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl text-sm transition-colors"
        >
          Cerrar Sesión
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        
        {/* Ficha de Perfil con Nombre */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Tu perfil</span>
            <h2 className="text-2xl font-extrabold text-gray-900">{userName || 'Estudiante'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            <p className="text-gray-500 mt-2">Nivel actual de inglés: <span className="font-bold text-[#2563EB]">{userLevel || 'No asignado'}</span></p>
          </div>
          
          <div className="flex gap-4">
            <Link 
              href="/placement-test"
              className="bg-white hover:bg-gray-50 text-[#2563EB] font-bold py-3 px-6 rounded-xl border-2 border-[#2563EB] transition-colors text-sm shadow-sm"
            >
              Rehacer Test
            </Link>
            {userLevel && (
              <Link 
                href="/writing-room"
                className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm shadow-sm"
              >
                Escribir ahora
              </Link>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center sm:text-left">
            <span className="text-gray-400 text-sm font-semibold">Writings Completados</span>
            <p className="text-4xl font-black text-[#2563EB] mt-2">{writings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center sm:text-left">
            <span className="text-gray-400 text-sm font-semibold">Puntaje Promedio</span>
            <p className={`text-4xl font-black mt-2 ${averageScore >= 80 ? 'text-green-500' : averageScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {averageScore ? `${averageScore} / 100` : '-'}
            </p>
          </div>
        </div>

        {/* Historial */}
        <div>
          <h3 className="text-2xl font-extrabold text-[#1F2937] mb-6">Tu Historial de Writing</h3>

          {loadingHistory ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : writings.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-4">✍️</div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Aún no tienes escritos guardados</h4>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Selecciona tu nivel o haz el test para recibir tu primer prompt guiado por IA.</p>
              {userLevel && (
                <Link 
                  href="/writing-room"
                  className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm"
                >
                  Comenzar Primer Writing
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {writings.map((writing) => (
                <div 
                  key={writing.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300"
                >
                  <div 
                    onClick={() => setExpandedId(expandedId === writing.id ? null : writing.id)}
                    className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-50 text-[#2563EB] text-xs font-bold px-2 py-0.5 rounded">
                          {writing.format}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(writing.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-[#1F2937] line-clamp-1">{writing.topic}</h4>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`text-2xl font-black ${
                          writing.score >= 80 ? 'text-green-500' : 
                          writing.score >= 60 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {writing.score}
                        </span>
                        <span className="text-xs text-gray-400 block font-bold">/100</span>
                      </div>
                      <span className="text-gray-400 font-bold text-lg">
                        {expandedId === writing.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {expandedId === writing.id && (
                    <div className="bg-gray-50 p-6 border-t border-gray-100">
                      <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100">
                        <h5 className="text-sm font-bold text-gray-500 uppercase mb-2">Tu Texto original</h5>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{writing.originalText}</p>
                      </div>

                      <div className="mb-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h5 className="text-sm font-bold text-[#2563EB] uppercase mb-2">Feedback de la IA</h5>
                        <p className="text-gray-800 leading-relaxed font-medium">"{writing.generalFeedback}"</p>
                      </div>

                      {writing.errors && writing.errors.length > 0 ? (
                        <div>
                          <h5 className="text-sm font-bold text-red-500 uppercase mb-4">Correcciones específicas ({writing.errors.length})</h5>
                          <div className="space-y-4">
                            {writing.errors.map((error, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-red-500 line-through text-sm mb-1">{error.original_text}</p>
                                <p className="text-green-600 font-medium text-sm mb-2">→ {error.correction}</p>
                                <p className="text-gray-600 text-xs bg-gray-50 p-2.5 rounded border border-gray-100">{error.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center text-green-700 text-sm font-bold">
                          🌟 ¡Excelente escrito! La IA no detectó errores en tu envío.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}