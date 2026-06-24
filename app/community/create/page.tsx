'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function CreateCommunityPromptPage() {
  const router = useRouter();
  const { user, userName } = useApp();
  
  // Estados del formulario
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [customRubric, setCustomRubric] = useState('');
  const [minWords, setMinWords] = useState(30);
  const [format, setFormat] = useState('Essay');
  const [level, setLevel] = useState('B1');
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'link'>('public');
  const [correctionType, setCorrectionType] = useState<'ai' | 'manual'>('ai');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Debes estar autenticado para crear un ejercicio.');
      return;
    }

    if (!title.trim() || !instructions.trim()) {
      setError('Por favor, completa el título y las instrucciones obligatorias.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const promptData = {
        title: title.trim(),
        instructions: instructions.trim(),
        customRubric: correctionType === 'ai' ? customRubric.trim() : '',
        minWords: Number(minWords),
        format,
        level,
        privacy,
        correctionType,
        creatorId: user.uid,
        creatorName: userName || user.email || 'Anonymous',
        createdAt: new Date().toISOString(),
      };

      // Guardado en la nueva colección raíz definida en la Fase 1
      await addDoc(collection(db, 'artifacts', 'writings-app', 'community_prompts'), promptData);
      
      // Redirigir al perfil para ver sus prompts creados
      router.push('/profile');
    } catch (err: any) {
      console.error('Error al guardar el prompt:', err);
      setError('Hubo un error al guardar el ejercicio. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <p className="text-gray-600 mb-4 font-medium">Inicia sesión para poder diseñar y compartir ejercicios con la comunidad.</p>
          <button onClick={() => router.push('/login')} className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#1E3A8A] transition-colors">
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crear Ejercicio de Comunidad</h1>
          <p className="text-gray-500 mt-1">Diseña un prompt personalizado para que otros alumnos o tú mismo puedan resolverlo.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Título del Ejercicio *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: My Last Summer Vacation"
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 transition-all text-base"
              maxLength={100}
            />
          </div>

          {/* Fila Configuración Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nivel Objetivo</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 transition-all text-base"
              >
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Indefinido'].map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Formato de Texto</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 transition-all text-base"
              >
                {['Essay', 'Informal Email', 'Formal Letter', 'Story', 'Article', 'Review', 'Cualquiera'].map((fmt) => (
                  <option key={fmt} value={fmt}>{fmt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Mínimo de Palabras</label>
              <input
                type="number"
                value={minWords}
                onChange={(e) => setMinWords(Math.max(10, Number(e.target.value)))}
                min={10}
                max={500}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 transition-all text-base"
              />
            </div>
          </div>

          {/* Instrucciones / Consigna */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Consigna / Instrucciones del Ejercicio *</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Escribe detalladamente qué debe redactar el estudiante..."
              rows={4}
              className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 resize-none leading-relaxed transition-all text-base"
            />
          </div>

          {/* Configuración de Corrección y Privacidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Método de Corrección</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-800 font-medium text-sm">
                  <input type="radio" checked={correctionType === 'ai'} onChange={() => setCorrectionType('ai')} className="w-4 h-4 text-[#2563EB]" />
                  Inteligencia Artificial
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-800 font-medium text-sm">
                  <input type="radio" checked={correctionType === 'manual'} onChange={() => setCorrectionType('manual')} className="w-4 h-4 text-[#2563EB]" />
                  Manual (Por ti)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Privacidad</label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                className="w-full p-2.5 bg-white rounded-lg border border-gray-200 focus:border-[#2563EB] outline-none text-gray-900 text-sm font-medium"
              >
                <option value="public">Público (Aparece en el Feed)</option>
                <option value="link">Por Enlace (Solo quien tenga la URL)</option>
                <option value="private">Privado (Solo tú)</option>
              </select>
            </div>
          </div>

          {/* Rúbrica Personalizada de IA (Condicional) */}
          {correctionType === 'ai' && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-bold text-gray-700 mb-1">Rúbrica o Directivas de Corrección para la IA (Opcional)</label>
              <p className="text-xs text-gray-400 mb-2">Indícale a Gemini criterios especiales. Ej: "Penaliza severamente si no usa conectores de contraste como 'however' o 'although'".</p>
              <textarea
                value={customRubric}
                onChange={(e) => setCustomRubric(e.target.value)}
                placeholder="Instrucciones del evaluador para Gemini..."
                rows={3}
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 resize-none leading-relaxed transition-all text-base"
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all ${
                isSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#2563EB] hover:bg-[#1E3A8A] shadow-sm'
              }`}
            >
              {isSubmitting ? 'Guardando...' : 'Crear Ejercicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}