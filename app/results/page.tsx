'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

export default function ResultsPage() {
  const router = useRouter();
  const { evaluation, userLevel, setEvaluation } = useApp();

  // Si el usuario recarga la página de resultados y se pierde el estado, lo devolvemos al inicio
  useEffect(() => {
    if (!evaluation) {
      router.push('/');
    }
  }, [evaluation, router]);

  // Mientras se comprueba el estado o si no hay evaluación, no renderizamos la UI principal
  if (!evaluation) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#1F2937]">Cargando resultados...</div>;
  }

  // Función para determinar el color del puntaje
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleTryAgain = () => {
    // Limpiamos la evaluación actual antes de volver
    setEvaluation(null);
    router.push('/writing-room');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-10 pb-20 p-4 font-sans">
      <div className="max-w-4xl w-full">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2937]">Tu Evaluación</h1>
            <p className="text-gray-500 mt-1">
              Nivel objetivo: <span className="font-bold text-[#2563EB]">{userLevel || 'Desconocido'}</span>
            </p>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-[#2563EB] underline transition-colors">
            Volver al inicio
          </Link>
        </div>

        {/* Tarjeta Superior: Puntaje y Feedback General */}
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-8 items-center">
          
          {/* Círculo de Puntaje */}
          <div className="flex-shrink-0 relative w-40 h-40 flex items-center justify-center bg-gray-50 rounded-full border-8 border-gray-100 shadow-inner">
            <div className="absolute inset-0 rounded-full border-8 border-transparent"></div>
            {/* Círculo de color dinámico simulado con borde grueso */}
            <div 
              className={`absolute inset-0 rounded-full border-8 ${
                evaluation.score >= 80 ? 'border-green-500' : 
                evaluation.score >= 60 ? 'border-yellow-500' : 'border-red-500'
              }`}
              style={{ clipPath: `polygon(0 0, 100% 0, 100% ${evaluation.score}%, 0 ${evaluation.score}%)` }}
            ></div>
            <div className="relative z-10 flex flex-col items-center">
              <span className={`text-5xl font-black ${getScoreColor(evaluation.score)}`}>
                {evaluation.score}
              </span>
              <span className="text-sm font-bold text-gray-400">/ 100</span>
            </div>
          </div>

          {/* Feedback General */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-[#1F2937] mb-3">Comentarios Generales</h3>
            <p className="text-lg text-gray-700 leading-relaxed bg-blue-50 p-6 rounded-xl border border-blue-100">
              "{evaluation.general_feedback}"
            </p>
          </div>
        </div>

        {/* Sección de Errores y Correcciones */}
        <div className="mb-10">
          <h3 className="text-2xl font-bold text-[#1F2937] mb-6 px-2">Análisis Detallado</h3>
          
          {evaluation.errors && evaluation.errors.length > 0 ? (
            <div className="space-y-4">
              {evaluation.errors.map((error, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-red-200 transition-colors">
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <span className="text-xs font-bold uppercase text-red-500 tracking-wider mb-1 block">Tu escribiste:</span>
                    <p className="text-lg text-[#1F2937] line-through decoration-red-400 decoration-2">
                      {error.original_text}
                    </p>
                  </div>
                  <div className="mb-4">
                    <span className="text-xs font-bold uppercase text-green-600 tracking-wider mb-1 block">Corrección sugerida:</span>
                    <p className="text-lg font-medium text-[#1F2937]">
                      {error.correction}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="text-sm font-bold text-gray-500 block mb-1">💡 Explicación:</span>
                    <p className="text-gray-700 text-sm">{error.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 p-8 rounded-xl border border-green-200 text-center">
              <div className="text-4xl mb-4">🌟</div>
              <h4 className="text-xl font-bold text-green-800 mb-2">¡Excelente trabajo!</h4>
              <p className="text-green-700">La IA no encontró errores significativos en tu texto acordes a tu nivel. ¡Sigue así!</p>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <button 
            onClick={handleTryAgain}
            className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md hover:shadow-lg text-lg w-full sm:w-auto text-center"
          >
            Probar otro tema
          </button>
          
          {/* Botón para subir de nivel si sacó buena nota */}
          {evaluation.score >= 80 && (
             <Link 
               href="/placement-test"
               className="bg-white hover:bg-gray-50 text-[#2563EB] font-bold py-4 px-8 rounded-xl transition-all border-2 border-[#2563EB] shadow-sm text-lg w-full sm:w-auto text-center"
             >
               Tomar Test de Nivel
             </Link>
          )}
        </div>

      </div>
    </div>
  );
}