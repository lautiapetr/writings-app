'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const APP_ID = 'writings-app';

export default function EditPromptPage({ params }: { params: Promise<{ ID: string }> }) {
  const { ID } = use(params);
  const router = useRouter();
  const { user } = useApp();
  
  // Estados mapeados con tu interfaz exacta
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [format, setFormat] = useState('Párrafo Descriptivo');
  const [level, setLevel] = useState('A1');
  const [privacy, setPrivacy] = useState('public');
  const [correctionType, setCorrectionType] = useState('ai');
  
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Cargar los datos actuales del ejercicio
  useEffect(() => {
    const fetchCurrentPrompt = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'artifacts', APP_ID, 'community_prompts', ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Validación de seguridad por si intentan entrar alterando la URL manualmente
          if (data.creatorId !== user.uid) {
            alert("No tienes permisos para editar este ejercicio.");
            router.push('/profile');
            return;
          }

          // Precargar los datos reales en los estados
          setTitle(data.title || '');
          setInstructions(data.instructions || '');
          setFormat(data.format || 'Párrafo Descriptivo');
          setLevel(data.level || 'A1');
          setPrivacy(data.privacy || 'public');
          setCorrectionType(data.correctionType || 'ai');
        } else {
          alert("El ejercicio no existe.");
          router.push('/profile');
        }
      } catch (error) {
        console.error("Error obteniendo el prompt:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchCurrentPrompt();
  }, [ID, user, router]);

  // 2. Procesar los cambios guardados
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'community_prompts', ID);
      
      // updateDoc solo actualiza las llaves que le envíes, manteniendo lo demás intacto
      await updateDoc(docRef, {
        title,
        instructions,
        format,
        level,
        privacy,
        correctionType,
        updatedAt: new Date().toISOString()
      });

      alert("¡Ejercicio actualizado correctamente! ✨");
      router.push('/profile');
      
    } catch (error) {
      console.error("Error actualizando el documento:", error);
      alert("Hubo un error al intentar guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-gray-500 font-medium">Cargando datos del ejercicio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 mb-6">✏️ Editar Ejercicio Comunitario</h1>
        
        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Título del Ejercicio</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: My last summer vacation"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none transition-all text-gray-900 font-medium"
            />
          </div>

          {/* Instrucciones */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Instrucciones / Prompt para el alumno</label>
            <textarea
              required
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe lo que debe escribir el estudiante..."
              className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none resize-none transition-all text-gray-900"
            />
          </div>

          {/* Nivel y Formato */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nivel Objetivo</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl outline-none bg-white text-gray-900 font-medium"
              >
                <option value="A1">A1 - Principiante</option>
                <option value="A2">A2 - Elemental</option>
                <option value="B1">B1 - Intermedio</option>
                <option value="B2">B2 - Intermedio Alto</option>
                <option value="C1">C1 - Avanzado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Formato de Texto</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl outline-none bg-white text-gray-900 font-medium"
              >
                <option value="Párrafo Descriptivo">Párrafo Descriptivo</option>
                <option value="Email Informal">Email Informal</option>
                <option value="Email Formal">Email Formal</option>
                <option value="Ensayo de Opinión">Ensayo de Opinión</option>
                <option value="Texto Narrativo">Texto Narrativo</option>
              </select>
            </div>
          </div>

          {/* Privacidad y Tipo de Corrección */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Privacidad</label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl outline-none bg-white text-gray-900 font-medium"
              >
                <option value="public">🌎 Público (Aparece en el Feed)</option>
                <option value="link">🔗 Oculto (Solo por enlace directo)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Método de Evaluación</label>
              <select
                value={correctionType}
                onChange={(e) => setCorrectionType(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl outline-none bg-white text-gray-900 font-medium"
              >
                <option value="ai">🤖 Corrección por Inteligencia Artificial</option>
                <option value="manual">✍️ Corrección Manual (Tú calificas)</option>
              </select>
            </div>
          </div>

          {/* Acciones del formulario */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3.5 bg-[#2563EB] hover:bg-[#1E3A8A] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}