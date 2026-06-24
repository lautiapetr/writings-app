'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import Logo from '@/components/Logo';

const APP_ID = 'writings-app';

interface ErrorItem {
  original_text: string;
  correction: string;
  explanation: string;
}

interface WritingData {
  promptId: string;
  promptTitle: string;
  studentId: string;
  studentName: string;
  originalText: string;
  status: 'pending' | 'corrected';
  createdAt: string;
}

interface PromptData {
  creatorId: string;
  instructions: string;
}

export default function EvaluateWritingPage({ params }: { params: Promise<{ ID: string }> }) {
  const router = useRouter();
  const { ID } = use(params);
  const { user } = useApp();

  // Estados de datos
  const [writing, setWriting] = useState<WritingData | null>(null);
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados del formulario de corrección
  const [score, setScore] = useState<number>(80);
  const [generalFeedback, setGeneralFeedback] = useState<string>('');
  const [errorsList, setErrorsList] = useState<ErrorItem[]>([]);

  // Estado para el mini-formulario de añadir un error específico
  const [currentOriginal, setCurrentOriginal] = useState('');
  const [currentCorrection, setCurrentCorrection] = useState('');
  const [currentExplanation, setCurrentExplanation] = useState('');

  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (!user) return;
      try {
        // 1. Obtener el escrito entregado por el alumno
        const writingRef = doc(db, 'artifacts', APP_ID, 'community_writings', ID);
        const writingSnap = await getDoc(writingRef);

        if (!writingSnap.exists()) {
          alert('La entrega no existe.');
          router.push('/profile');
          return;
        }

        const wData = writingSnap.data() as WritingData;

        // 2. Obtener el prompt de origen para validar que el usuario actual sea el creador
        const promptRef = doc(db, 'artifacts', APP_ID, 'community_prompts', wData.promptId);
        const promptSnap = await getDoc(promptRef);

        if (!promptSnap.exists()) {
          alert('El ejercicio padre no existe.');
          router.push('/profile');
          return;
        }

        const pData = promptSnap.data() as PromptData;

        // Validación de Seguridad: Solo el dueño del prompt puede corregir
        if (pData.creatorId !== user.uid) {
          alert('No tienes permisos de creador para evaluar esta entrega.');
          router.push('/profile');
          return;
        }

        setWriting(wData);
        setPrompt(pData);

        // Si ya fue corregido previamente, precargamos el formulario
        if (writingSnap.data().status === 'corrected') {
          setScore(writingSnap.data().score || 80);
          setGeneralFeedback(writingSnap.data().generalFeedback || '');
          setErrorsList(writingSnap.data().errors || []);
        }

      } catch (error) {
        console.error('Error cargando la entrega:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationData();
  }, [ID, user, router]);

  // Manejador para añadir errores al listado dinámico
  const handleAddError = () => {
    if (!currentOriginal.trim() || !currentCorrection.trim()) {
      alert('La oración original y su corrección son campos obligatorios.');
      return;
    }

    const newError: ErrorItem = {
      original_text: currentOriginal.trim(),
      correction: currentCorrection.trim(),
      explanation: currentExplanation.trim() || 'Corrección gramatical/estilística aplicada por el profesor.'
    };

    setErrorsList([...errorsList, newError]);
    
    // Resetear campos del mini-formulario
    setCurrentOriginal('');
    setCurrentCorrection('');
    setCurrentExplanation('');
  };

  // Eliminar un error de la lista antes de guardar
  const handleRemoveError = (indexToRemove: number) => {
    setErrorsList(errorsList.filter((_, idx) => idx !== indexToRemove));
  };

  // Guardado definitivo en Firestore
  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !writing) return;

    if (!generalFeedback.trim()) {
      alert('Por favor, escribe una devolución general para el estudiante.');
      return;
    }

    setIsSaving(true);

    try {
      const writingRef = doc(db, 'artifacts', APP_ID, 'community_writings', ID);
      
      // 1. Actualizamos el escrito del alumno
      await updateDoc(writingRef, {
        status: 'corrected',
        score: Number(score),
        generalFeedback: generalFeedback.trim(),
        errors: errorsList,
        correctedById: user.uid,
        updatedAt: new Date().toISOString()
      });

      // 2. Notificamos al alumno de forma inmediata (Subcolección privada)
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', writing.studentId, 'notifications'), {
        type: 'corrected',
        title: '¡Tu escrito ha sido corregido!',
        message: `El profesor evaluó tu entrega para el ejercicio "${writing.promptTitle}".`,
        read: false,
        relatedId: ID,
        createdAt: new Date().toISOString()
      });

      alert('Evaluación guardada y enviada al alumno exitosamente.');
      router.push('/profile');
    } catch (error) {
      console.error('Error al guardar la evaluación:', error);
      alert('Ocurrió un error al procesar el envío.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 font-semibold">Por favor, inicia sesión.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!writing || !prompt) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1F2937] pb-20">
      <header className="w-full p-6 flex justify-between items-center bg-white shadow-sm border-b border-gray-100">
        <Logo />
        <button onClick={() => router.push('/profile')} className="text-sm font-bold text-[#2563EB] hover:underline">
          Volver a mi Perfil
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUNA IZQUIERDA: TRABAJO DEL ESTUDIANTE */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Ejercicio dictado</span>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">{writing.promptTitle}</h2>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm italic text-gray-600 whitespace-pre-wrap">
              "{prompt.instructions}"
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block">Alumno</span>
                <h3 className="text-lg font-bold text-gray-900">{writing.studentName}</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Enviado el {new Date(writing.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Redacción del Estudiante</label>
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/60 text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-medium select-text selection:bg-yellow-200">
              {writing.originalText}
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">Tip: Puedes seleccionar fragmentos del texto de arriba para copiarlos directamente abajo.</p>
          </div>
        </div>

        {/* COLUNA DERECHA: FORMULARIO DEL EVALUADOR */}
        <form onSubmit={handleSubmitEvaluation} className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Formulario de Calificación</h3>
            <p className="text-sm text-gray-400">Corrige y retroalimenta el trabajo de forma manual.</p>
          </div>

          {/* Calificación Numérica */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Puntuación General (0 - 100): <span className="text-lg font-black text-[#2563EB]">{score}</span></label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={score} 
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full accent-[#2563EB] cursor-pointer"
            />
            <div className="flex justify-between text-xs font-bold text-gray-400 px-1 mt-1">
              <span>0 (Insuficiente)</span>
              <span>60 (Aprobado)</span>
              <span>100 (Excelente)</span>
            </div>
          </div>

          {/* Feedback Cualitativo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Feedback General *</label>
            <textarea
              value={generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              placeholder="Escribe comentarios sobre la estructura, vocabulario y coherencia general..."
              rows={4}
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 transition-all text-sm leading-relaxed"
            />
          </div>

          {/* REPEATER: ERRORES ESPECÍFICOS */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Marcar Errores Específicos (Opcional)</label>
            
            {/* Listado temporal de errores añadidos */}
            {errorsList.length > 0 && (
              <div className="mb-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                {errorsList.map((err, index) => (
                  <div key={index} className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-xs flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-red-500 line-through font-medium">{err.original_text}</p>
                      <p className="text-green-600 font-bold mt-0.5">→ {err.correction}</p>
                      <p className="text-gray-500 mt-1 italic">"{err.explanation}"</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveError(index)}
                      className="text-red-400 hover:text-red-600 font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Mini Formulario de captura de error */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <input 
                type="text"
                placeholder="Fragmento u oración con error..."
                value={currentOriginal}
                onChange={(e) => setCurrentOriginal(e.target.value)}
                className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400"
              />
              <input 
                type="text"
                placeholder="Corrección propuesta..."
                value={currentCorrection}
                onChange={(e) => setCurrentCorrection(e.target.value)}
                className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400"
              />
              <input 
                type="text"
                placeholder="Explicación breve de la regla (Opcional)..."
                value={currentExplanation}
                onChange={(e) => setCurrentExplanation(e.target.value)}
                className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={handleAddError}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors"
              >
                + Registrar este error específico
              </button>
            </div>
          </div>

          {/* Enviar Formulario */}
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all text-center ${
              isSaving ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-md'
            }`}
          >
            {isSaving ? 'Procesando Corrección...' : 'Finalizar y Notificar Alumno'}
          </button>
        </form>

      </main>
    </div>
  );
}