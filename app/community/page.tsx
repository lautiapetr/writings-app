'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';
import Logo from '@/components/Logo';
import NotificationBell from '@/components/NotificationBell';

interface CommunityPromptItem {
  id: string;
  title: string;
  instructions: string;
  format: string;
  level: string;
  creatorName: string;
  correctionType: 'ai' | 'manual';
  minWords: number;
}

const APP_ID = 'writings-app';

export default function CommunityFeedPage() {
  const router = useRouter();
  const { user } = useApp();
  const [prompts, setPrompts] = useState<CommunityPromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  useEffect(() => {
    const fetchPublicPrompts = async () => {
      setLoading(true);
      try {
        const promptsRef = collection(db, 'artifacts', APP_ID, 'community_prompts');
        // Filtramos solo los prompts marcados como públicos (Regla de seguridad Fase 1)
        const q = query(promptsRef, where('privacy', '==', 'public'));
        const querySnapshot = await getDocs(q);
        
        const fetchedPrompts: CommunityPromptItem[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPrompts.push({ id: doc.id, ...doc.data() } as CommunityPromptItem);
        });

        setPrompts(fetchedPrompts);
      } catch (error) {
        console.error("Error cargando el feed de la comunidad:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPrompts();
  }, []);

  // Filtrado en el cliente por nivel
  const filteredPrompts = selectedLevel === 'ALL' 
    ? prompts 
    : prompts.filter(p => p.level === selectedLevel);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1F2937] pb-20">
      {/* Header unificado */}
      <header className="w-full p-6 flex justify-between items-center bg-white shadow-sm border-b border-gray-100">
        <Logo />
        <div className="flex gap-4">
          <NotificationBell />
          <Link href="/profile" className="text-sm font-bold text-gray-500 hover:text-[#2563EB] self-center transition-colors">
            Mi Perfil
          </Link>
          <Link href="/community/create" className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm">
            + Crear Ejercicio
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Comunidad WriteMaster</h1>
            <p className="text-gray-500 mt-1">Explora y resuelve desafíos de escritura creados por estudiantes de todo el mundo.</p>
          </div>

          {/* Filtros por nivel */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-gray-400 uppercase mr-1">Filtrar nivel:</span>
            {['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedLevel === lvl 
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {lvl === 'ALL' ? 'Todos' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Listado de Ejercicios */}
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
            <p className="text-gray-500 text-lg font-medium">No se encontraron ejercicios públicos para este nivel.</p>
            <p className="text-sm text-gray-400 mt-1">¡Sé el primero en diseñar uno!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex gap-2">
                      <span className="bg-blue-50 text-[#2563EB] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                        {prompt.level}
                      </span>
                      <span className="bg-gray-50 text-gray-500 text-xs font-medium px-2 py-0.5 rounded border border-gray-100">
                        {prompt.format}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">By {prompt.creatorName}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2">{prompt.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
                    "{prompt.instructions}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="text-xs text-gray-400 font-semibold">
                    ⏱️ Mín. {prompt.minWords} palabras | {prompt.correctionType === 'ai' ? '🤖 Corrección IA' : '✍️ Corrección Manual'}
                  </div>
                  <button
                    onClick={() => router.push(`/community/room/${prompt.id}`)}
                    className="bg-white hover:bg-gray-50 text-[#2563EB] font-bold border border-gray-200 py-2 px-4 rounded-xl text-xs shadow-sm transition-all"
                  >
                    Resolver →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}