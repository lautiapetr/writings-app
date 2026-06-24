'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';

const APP_ID = 'writings-app';

interface CommunityPromptData {
  title: string;
  instructions: string;
  customRubric?: string;
  minWords: number;
  format: string;
  creatorId: string;
  level: string;
  correctionType: 'ai' | 'manual';
}

export default function CommunityWritingRoom({ params }: { params: Promise<{ ID: string }> }) {
  const router = useRouter();
  const { ID } = use(params); // Desenvuelve los parámetros dinámicos de la ruta
  const { user, userName, setEvaluation } = useApp();


  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState<CommunityPromptData | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Carga del ejercicio específico desde Firestore
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const docRef = doc(db, 'artifacts', APP_ID, 'community_prompts', ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPrompt(docSnap.data() as CommunityPromptData);
        } else {
          alert('El ejercicio solicitado no existe o fue eliminado.');
          router.push('/community');
        }
      } catch (error) {
        console.error("Error obteniendo el prompt comunitario:", error);
      } finally {
        setLoadingPrompt(false);
      }
    };

    fetchPrompt();
  }, [ID, router]);

  // Contador de palabras exacto idéntico al original
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const minWordsRequired = prompt ? prompt.minWords : 0;
  const isButtonDisabled = wordCount < minWordsRequired || isEvaluating;

  const handleSubmit = async () => {
    if (isButtonDisabled || !prompt) return;

    setIsEvaluating(true);

    try {
      if (prompt.correctionType === 'ai') {
        // --- FLUJO IA (Usa el endpoint modificado en la Fase 1) ---
        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            level: prompt.level,
            topic: prompt.title,
            customRubric: prompt.customRubric || ''
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falló la evaluación automatizada.');
        }

        const data = await response.json();

        // Persistimos en la colección global de escritos comunitarios corregidos
        await addDoc(collection(db, 'artifacts', APP_ID, 'community_writings'), {
          promptId: ID,
          promptTitle: prompt.title,
          studentId: user?.uid || 'anonymous',
          studentName: userName || user?.email || 'Anonymous Student',
          originalText: text,
          status: 'corrected',
          score: data.score,
          generalFeedback: data.general_feedback,
          errors: data.errors || [],
          createdAt: new Date().toISOString()
        });

        setEvaluation(data); // Reutiliza el pipeline original para renderizar resultados
        router.push('/results');

      } else {
        // --- FLUJO MANUAL ---
        if (!user) {
          alert('Debes iniciar sesión para enviar tareas a corrección manual.');
          setIsEvaluating(false);
          return;
        }

        // 1. Guardar escrito con estado 'pending'
        const writingDoc = await addDoc(collection(db, 'artifacts', APP_ID, 'community_writings'), {
          promptId: ID,
          promptTitle: prompt.title,
          studentId: user.uid,
          studentName: userName || user.email || 'Anonymous Student',
          originalText: text,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

        // 2. Generar notificación en tiempo real para el tutor/creador (Modelo Fase 1)
        await addDoc(collection(db, 'artifacts', APP_ID, 'users', prompt.creatorId, 'notifications'), {
          type: 'new_submission',
          title: 'Nueva entrega recibida',
          message: `${userName || user.email} ha resuelto tu ejercicio "${prompt.title}".`,
          read: false,
          relatedId: writingDoc.id,
          createdAt: new Date().toISOString()
        });

        alert('¡Ejercicio enviado con éxito! El creador ha sido notificado y corregirá tu texto manualmente.');
        router.push('/profile');
      }

    } catch (error: any) {
      console.error(error);
      alert('Hubo un problema al procesar tu entrega. Inténtalo de nuevo.');
      setIsEvaluating(false);
    }
  };

  if (loadingPrompt) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando ejercicio de la comunidad...</div>;
  }

  if (!prompt) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-10 p-4">
      <div className="max-w-4xl w-full">
        
        {/* Cabecera idéntica */}
        <div className="flex justify-between items-end mb-6 px-2">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1F2937]">Community Room</h1>
            <p className="text-sm text-gray-400 mt-1">
              Nivel sugerido: <span className="font-bold text-[#2563EB]">{prompt.level}</span> | 
              Modo: <span className="font-bold text-indigo-600">{prompt.correctionType === 'ai' ? 'IA ✨' : 'Manual ✍️'}</span>
            </p>
          </div>
          <button 
            onClick={() => router.push('/community')}
            className="text-sm text-gray-500 hover:text-[#2563EB] underline transition-colors"
          >
            Volver a la Comunidad
          </button>
        </div>

        {/* Panel superior con consigna */}
        <div className="bg-white p-6 rounded-t-2xl shadow-sm border border-gray-200 border-b-0">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-sm font-bold text-[#2563EB] uppercase tracking-wider">{prompt.title}</h3>
            <span className="bg-blue-50 text-[#2563EB] text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
              📝 Formato: {prompt.format}
            </span>
          </div>
          <p className="text-xl text-[#1F2937] font-semibold leading-relaxed whitespace-pre-wrap">
            {prompt.instructions}
          </p>
        </div>

        {/* Textarea y procesamiento */}
        <div className="bg-white p-6 rounded-b-2xl shadow-sm border border-gray-200 flex flex-col relative">
          
          {isEvaluating && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-b-2xl">
              <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-bold text-[#1F2937]">
                {prompt.correctionType === 'ai' ? 'Analizando tu gramática con IA...' : 'Enviando borrador al profesor...'}
              </p>
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isEvaluating}
            placeholder="Escribe tu redacción aquí en inglés..."
            className="w-full h-80 p-4 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 resize-none outline-none text-gray-900 placeholder-gray-400 text-lg leading-relaxed transition-all disabled:bg-gray-50"
            spellCheck="false"
          />
          
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${wordCount >= minWordsRequired ? 'text-green-600' : 'text-gray-500'}`}>
                {wordCount} / {minWordsRequired} palabras
              </span>
              {wordCount < minWordsRequired && (
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                  Faltan {minWordsRequired - wordCount} palabras
                </span>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isButtonDisabled}
              className={`w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold transition-all flex items-center justify-center ${
                isButtonDisabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#2563EB] hover:bg-[#1E3A8A] text-white shadow-md'
              }`}
            >
              {prompt.correctionType === 'ai' ? 'Enviar a Evaluación IA' : 'Entregar Ejercicio'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}