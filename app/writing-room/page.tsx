'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// Base de datos de Prompts EXTENDIDA
const promptsData: Record<string, { topic: string, minWords: number, format: string }[]> = {
  'A1': [
    { topic: "Introduce yourself. Write about your name, age, where you live, and your hobbies.", minWords: 30, format: "Descripción Personal" },
    { topic: "Describe your daily routine. What do you do in the morning, afternoon, and evening?", minWords: 30, format: "Párrafo Descriptivo" },
    { topic: "Write about your favorite food and why you like it.", minWords: 30, format: "Opinión Corta" },
    { topic: "Describe your house or apartment. How many rooms does it have?", minWords: 30, format: "Descripción de Lugar" },
    { topic: "Write an email to a friend about your plans for the weekend.", minWords: 30, format: "Email Informal" },
    { topic: "Describe your family members.", minWords: 30, format: "Descripción Personal" }
  ],
  'A2': [
    { topic: "Describe your last holiday. Where did you go and what did you do?", minWords: 50, format: "Texto Narrativo" },
    { topic: "Write an email to a friend inviting them to a party at your house.", minWords: 50, format: "Email Informal" },
    { topic: "Describe your best friend. What do they look like and what is their personality?", minWords: 50, format: "Texto Descriptivo" },
    { topic: "What is your favorite movie? Explain the story briefly and why you like it.", minWords: 50, format: "Reseña Corta" },
    { topic: "Write a short paragraph about a typical festival or celebration in your country.", minWords: 50, format: "Texto Informativo" },
    { topic: "You lost your bag. Write an email to the train station lost and found department.", minWords: 50, format: "Email Formal" }
  ],
  'B1': [
    { topic: "Write a short story about a time you traveled to a new city.", minWords: 80, format: "Historia Corta" },
    { topic: "What are the advantages and disadvantages of living in a big city?", minWords: 80, format: "Ensayo de Pros y Contras" },
    { topic: "Describe a movie you recently watched. Would you recommend it?", minWords: 80, format: "Reseña / Review" },
    { topic: "Write an article for a school magazine about the importance of sports.", minWords: 80, format: "Artículo de Revista" },
    { topic: "You bought a phone online, but it arrived broken. Write an email to customer service.", minWords: 80, format: "Email de Queja" },
    { topic: "Some people prefer to eat at restaurants, others prefer home cooking. Which do you prefer and why?", minWords: 80, format: "Ensayo de Opinión" }
  ],
  'B2': [
    { topic: "Discuss the impact of social media on young people today.", minWords: 120, format: "Ensayo Analítico" },
    { topic: "Write a formal letter to a company complaining about a product you bought.", minWords: 120, format: "Carta Formal" },
    { topic: "Some people believe that university education should be free for everyone. Do you agree?", minWords: 120, format: "Ensayo Argumentativo" },
    { topic: "Write a review of a restaurant you visited recently for a travel blog.", minWords: 120, format: "Reseña Detallada" },
    { topic: "Technology is making communication easier but relationships weaker. Do you agree or disagree?", minWords: 120, format: "Ensayo de Opinión" },
    { topic: "Write a report for your manager on how to improve the office environment.", minWords: 120, format: "Reporte Formal" }
  ],
  'C1/C2': [
    { topic: "Analyze the ethical implications of artificial intelligence in the modern workforce.", minWords: 150, format: "Ensayo Analítico" },
    { topic: "To what extent do you agree that globalization has led to a loss of cultural identity?", minWords: 150, format: "Ensayo Académico" },
    { topic: "Evaluate the effectiveness of current environmental policies in combating climate change.", minWords: 150, format: "Reporte de Evaluación" },
    { topic: "Write an editorial piece discussing the balance between freedom of speech and censorship on the internet.", minWords: 150, format: "Artículo Editorial" },
    { topic: "Some argue that space exploration is a waste of resources that should be spent on Earth. Discuss both views.", minWords: 150, format: "Ensayo Discursivo" },
    { topic: "Write a formal proposal to the local government suggesting a new public transportation scheme.", minWords: 150, format: "Propuesta Formal" }
  ]
};

const APP_ID = 'writings-app';

export default function WritingRoom() {
  const router = useRouter();
  const { user, userLevel, setEvaluation } = useApp();
  
  const [text, setText] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState<{topic: string, minWords: number, format: string} | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (!userLevel) {
      router.push('/');
      return;
    }

    const availablePrompts = promptsData[userLevel];
    if (availablePrompts) {
      const randomIndex = Math.floor(Math.random() * availablePrompts.length);
      setCurrentPrompt(availablePrompts[randomIndex]);
    }
  }, [userLevel, router]);

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const minWordsRequired = currentPrompt ? currentPrompt.minWords : 0;
  const isButtonDisabled = wordCount < minWordsRequired || isEvaluating;

  const handleSubmit = async () => {
    if (isButtonDisabled || !currentPrompt) return;

    setIsEvaluating(true);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          level: userLevel,
          topic: currentPrompt.topic
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falló la evaluación');
      }

      const data = await response.json();
      
      if (user) {
        try {
          const historyCollectionRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'writings');
          await addDoc(historyCollectionRef, {
            topic: currentPrompt.topic,
            format: currentPrompt.format,
            originalText: text,
            score: data.score,
            generalFeedback: data.general_feedback,
            errors: data.errors || [],
            level: userLevel,
            createdAt: new Date().toISOString()
          });
        } catch (dbError) {
          console.error("Error persistiendo la corrección en Firestore:", dbError);
        }
      }

      setEvaluation(data); 
      router.push('/results'); 

    } catch (error: any) {
      console.error(error);
      alert('Hubo un problema al conectar con la Inteligencia Artificial. Por favor, inténtalo de nuevo.');
      setIsEvaluating(false);
    }
  };

  if (!currentPrompt) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando sala de escritura...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-10 p-4">
      <div className="max-w-4xl w-full">
        
        <div className="flex justify-between items-end mb-6 px-2">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1F2937]">Writing Room</h1>
            <p className="text-gray-500 mt-1">Nivel detectado: <span className="font-bold text-[#2563EB]">{userLevel}</span></p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-[#2563EB] underline transition-colors"
          >
            Volver al inicio
          </button>
        </div>

        <div className="bg-white p-6 rounded-t-2xl shadow-sm border border-gray-200 border-b-0">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-sm font-bold text-[#2563EB] uppercase tracking-wider">Tema Asignado</h3>
            <span className="bg-blue-50 text-[#2563EB] text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
              📝 Formato: {currentPrompt.format}
            </span>
          </div>
          <p className="text-xl text-[#1F2937] font-semibold leading-relaxed">
            {currentPrompt.topic}
          </p>
        </div>

        <div className="bg-white p-6 rounded-b-2xl shadow-sm border border-gray-200 flex flex-col relative">
          
          {isEvaluating && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-b-2xl">
              <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-bold text-[#1F2937]">Analizando tu gramática...</p>
              <p className="text-sm text-gray-500">Esto puede tardar unos segundos</p>
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isEvaluating}
            placeholder="Escribe tu texto aquí en inglés..."
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
              {isEvaluating ? 'Evaluando...' : 'Enviar para Corrección'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}