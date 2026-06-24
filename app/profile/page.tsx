'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import Logo from '@/components/Logo';
import NotificationBell from '@/components/NotificationBell';

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

// Interfaz local basada en el modelo de la Fase 1
interface CommunityPromptSummary {
  id: string;
  title: string;
  instructions: string;
  format: string;
  level: string;
  privacy: 'public' | 'private' | 'link';
  correctionType: 'ai' | 'manual';
  createdAt: string;
}

const APP_ID = 'writings-app';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userName, loadingAuth, userLevel, logout } = useApp();
  
  // Estados originales del Single-Player
  const [writings, setWritings] = useState<HistoricalWriting[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // NUEVOS ESTADOS: Gestión de la Comunidad (Fase 2)
  const [activeTab, setActiveTab] = useState<'writings' | 'prompts'>('writings');
  const [myPrompts, setMyPrompts] = useState<CommunityPromptSummary[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

// 1. CARGA DEL HISTORIAL (Mis Escritos Originales)
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const historyCollectionRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'writings');
        const querySnapshot = await getDocs(historyCollectionRef);
        
        // Usamos un Map para garantizar 0 duplicados
        const uniqueWritings = new Map();
        querySnapshot.forEach((doc) => {
          uniqueWritings.set(doc.id, { id: doc.id, ...doc.data() });
        });

        const data = Array.from(uniqueWritings.values()) as HistoricalWriting[];
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setWritings(data);
      } catch (error) {
        console.error("Error al obtener historial:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user]);

  // 2. CARGA DE MIS EJERCICIOS CREADOS (La Comunidad)
  useEffect(() => {
    const fetchMyPrompts = async () => {
      if (!user) return;
      try {
        const promptsCollectionRef = collection(db, 'artifacts', APP_ID, 'community_prompts');
        const q = query(promptsCollectionRef, where('creatorId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        // Usamos un Map para garantizar 0 duplicados
        const uniquePrompts = new Map();
        querySnapshot.forEach((doc) => {
          uniquePrompts.set(doc.id, { id: doc.id, ...doc.data() });
        });

        const data = Array.from(uniquePrompts.values()) as CommunityPromptSummary[];
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Asegúrate de que este estado sea el correcto (ej: setCommunityPrompts o setMyPrompts)
        setMyPrompts(data); 
      } catch (error) {
        console.error("Error al obtener prompts:", error);
      } finally {
        // Asegúrate de que el estado de carga tenga el nombre que usas (ej: setLoadingPrompts)
        setLoadingPrompts(false); 
      }
    };

    fetchMyPrompts();
  }, [user]);

  const handleDeletePrompt = async (promptId: string) => {
    const isConfirmed = window.confirm('¿Estás seguro de que deseas eliminar este ejercicio de la comunidad? Se borrará de forma permanente.');
    if (!isConfirmed) return;

    try {
      // Apuntamos al documento exacto usando tu APP_ID constante
      const promptRef = doc(db, 'artifacts', APP_ID, 'community_prompts', promptId);
      await deleteDoc(promptRef);

      // Filtramos el estado local para que desaparezca al instante sin recargar
      // NOTA: Reemplaza 'setCommunityPrompts' por el nombre exacto de tu set de estado
      setMyPrompts(prev => prev.filter(p => p.id !== promptId));
      
      alert('Ejercicio eliminado con éxito 🗑️');
    } catch (error) {
      console.error("Error al eliminar el prompt:", error);
      alert('Hubo un error al intentar eliminar el ejercicio.');
    }
  };

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
        <div className="flex items-center gap-4"> {/* Envoltura contenedora */}
          {/* NUEVO ENLACE A LA COMUNIDAD */}
          <Link 
                  href="/community" 
                  className="text-sm font-bold text-gray-500 hover:text-[#2563EB] transition-colors flex items-center gap-1"
          >
            <span className="text-lg">🌎</span> Comunidad
          </Link>
          <NotificationBell />
          <button 
            onClick={logout}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl text-sm transition-colors"
              >
                Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        
        {/* Ficha de Perfil */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Tu perfil</span>
            <h2 className="text-2xl font-extrabold text-gray-900">{userName || 'Estudiante'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            <p className="text-gray-500 mt-2">Nivel actual de inglés: <span className="font-bold text-[#2563EB]">{userLevel || 'No asignado'}</span></p>
          </div>
          
          <div className="flex gap-4 flex-wrap justify-center">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
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

        {/* NUEVO: Selectores de Pestañas (Tabs) */}
        <div className="flex border-b border-gray-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('writings')}
            className={`py-3 px-4 font-bold text-sm sm:text-base transition-all border-b-2 ${
              activeTab === 'writings'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📚 Mis Escritos
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`py-3 px-4 font-bold text-sm sm:text-base transition-all border-b-2 ${
              activeTab === 'prompts'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🛠️ Mis Ejercicios Creados
          </button>
        </div>

        {/* CONTENIDO DE PESTAÑA: MIS ESCRITOS (HISTORIAL ORIGINAL) */}
        {activeTab === 'writings' && (
          <div>
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
        )}

        {/* NUEVO CONTENIDO DE PESTAÑA: MIS PROMPTS / EJERCICIOS DE LA COMUNIDAD */}
        {activeTab === 'prompts' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-[#1F2937]">Ejercicios publicados por ti</h4>
              <Link
                href="/community/create"
                className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors shadow-sm"
              >
                + Crear Nuevo Prompt
              </Link>
            </div>

            {loadingPrompts ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : myPrompts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
                <div className="text-4xl mb-4">🧠</div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">No has creado ningún ejercicio aún</h4>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Diseña consignas personalizadas con rúbricas de IA o corrección manual y compártelas con el mundo.</p>
                <Link 
                  href="/community/create"
                  className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm"
                >
                  Diseñar Primer Ejercicio
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myPrompts.map((prompt) => (
                  <div key={prompt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-extrabold bg-blue-50 text-[#2563EB] px-2.5 py-1 rounded-md uppercase tracking-wider">
                            {prompt.level} - {prompt.format}
                          </span>
                          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">
                            🤖 {prompt.correctionType === 'ai' ? 'Corrección IA' : 'Manual'}
                          </span>
                        </div>
                        <h5 className="text-lg font-bold text-gray-900">{prompt.title}</h5>
                        
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                          "{prompt.instructions}"
                        </p>

                        {/* --- NUEVO: BOTONES DE EDICIÓN Y BORRADO --- */}
                        <div className="flex gap-4 mt-3">
                          <button 
                            onClick={() => router.push(`/community/edit/${prompt.id}`)}
                            className="text-xs font-bold text-gray-500 hover:text-[#2563EB] transition-colors flex items-center gap-1"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            onClick={() => handleDeletePrompt(prompt.id)}
                            className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                        {/* ------------------------------------------- */}
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(prompt.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        <Link
                          href={`/community/room/${prompt.id}`}
                          className="bg-white hover:bg-gray-50 text-[#2563EB] font-bold border border-gray-200 px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
                        >
                          Probar Vista ↗
                        </Link>
                      </div>

                    </div>
                  </div>
                ))}
                
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}