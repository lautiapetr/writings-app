'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

// Banco extenso de preguntas (A1 a C2 mezclado)
const questionBank = [
  // A1-A2
  { text: "I ___ a student.", options: [{ text: "am", isCorrect: true }, { text: "is", isCorrect: false }, { text: "are", isCorrect: false }] },
  { text: "She ___ to the park yesterday.", options: [{ text: "go", isCorrect: false }, { text: "went", isCorrect: true }, { text: "goes", isCorrect: false }] },
  { text: "My brother ___ in London.", options: [{ text: "live", isCorrect: false }, { text: "lives", isCorrect: true }, { text: "living", isCorrect: false }] },
  { text: "___ you like coffee?", options: [{ text: "Are", isCorrect: false }, { text: "Do", isCorrect: true }, { text: "Does", isCorrect: false }] },
  { text: "They ___ playing football now.", options: [{ text: "is", isCorrect: false }, { text: "are", isCorrect: true }, { text: "am", isCorrect: false }] },
  { text: "I don't have ___ money.", options: [{ text: "some", isCorrect: false }, { text: "any", isCorrect: true }, { text: "many", isCorrect: false }] },
  // B1-B2
  { text: "I have lived here ___ 5 years.", options: [{ text: "since", isCorrect: false }, { text: "for", isCorrect: true }, { text: "during", isCorrect: false }] },
  { text: "If it rains, we ___ at home.", options: [{ text: "would stay", isCorrect: false }, { text: "stay", isCorrect: false }, { text: "will stay", isCorrect: true }] },
  { text: "By the time I arrived, they ___ already left.", options: [{ text: "have", isCorrect: false }, { text: "had", isCorrect: true }, { text: "were", isCorrect: false }] },
  { text: "I'm looking forward to ___ you.", options: [{ text: "see", isCorrect: false }, { text: "seeing", isCorrect: true }, { text: "seen", isCorrect: false }] },
  { text: "You ___ have called me!", options: [{ text: "must", isCorrect: false }, { text: "should", isCorrect: true }, { text: "ought", isCorrect: false }] },
  { text: "The house ___ built in 1990.", options: [{ text: "is", isCorrect: false }, { text: "was", isCorrect: true }, { text: "has", isCorrect: false }] },
  { text: "She asked me where ___.", options: [{ text: "I was going", isCorrect: true }, { text: "was I going", isCorrect: false }, { text: "I am going", isCorrect: false }] },
  // C1-C2
  { text: "He is believed ___ the country.", options: [{ text: "to leave", isCorrect: false }, { text: "to have left", isCorrect: true }, { text: "leaving", isCorrect: false }] },
  { text: "Scarcely ___ the door when the phone rang.", options: [{ text: "I had opened", isCorrect: false }, { text: "had I opened", isCorrect: true }, { text: "I opened", isCorrect: false }] },
  { text: "It's high time you ___ studying for the exam.", options: [{ text: "start", isCorrect: false }, { text: "started", isCorrect: true }, { text: "have started", isCorrect: false }] },
  { text: "Not only ___ late, but he also forgot his books.", options: [{ text: "did he arrive", isCorrect: true }, { text: "he arrived", isCorrect: false }, { text: "he did arrive", isCorrect: false }] },
  { text: "She was ___ tired that she went straight to bed.", options: [{ text: "such", isCorrect: false }, { text: "so", isCorrect: true }, { text: "very", isCorrect: false }] },
  { text: "___ the bad weather, they decided to go hiking.", options: [{ text: "Despite", isCorrect: true }, { text: "Although", isCorrect: false }, { text: "However", isCorrect: false }] },
  { text: "If I ___ you, I wouldn't do that.", options: [{ text: "was", isCorrect: false }, { text: "am", isCorrect: false }, { text: "were", isCorrect: true }] }
];

export default function PlacementTest() {
  const router = useRouter();
  const { saveUserLevelToFirestore, user } = useApp();
  
  // Estado para guardar las 10 preguntas seleccionadas al azar
  const [selectedQuestions, setSelectedQuestions] = useState<typeof questionBank>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [calculatedLevel, setCalculatedLevel] = useState('');
  const [saving, setSaving] = useState(false);

  // Seleccionar 10 preguntas al azar al cargar el componente
  useEffect(() => {
    const shuffled = [...questionBank].sort(() => 0.5 - Math.random());
    setSelectedQuestions(shuffled.slice(0, 10));
  }, []);

  const handleAnswer = (isCorrect: boolean) => {
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    if (currentQuestion < selectedQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest(newScore);
    }
  };

  const finishTest = async (finalScore: number) => {
    setSaving(true);
    let level = 'A1';
    if (finalScore >= 4 && finalScore <= 5) level = 'A2';
    else if (finalScore >= 6 && finalScore <= 7) level = 'B1';
    else if (finalScore >= 8 && finalScore <= 9) level = 'B2';
    else if (finalScore === 10) level = 'C1/C2';

    setCalculatedLevel(level);
    await saveUserLevelToFirestore(level); 
    setSaving(false);
    setShowResult(true);
  };

  // Prevenir renderizado hasta que las preguntas estén listas
  if (selectedQuestions.length === 0) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Cargando test...</div>;
  }

  const progressPercentage = (currentQuestion / selectedQuestions.length) * 100;

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-100">
          <h2 className="text-3xl font-extrabold text-[#1F2937] mb-2">¡Test Completado!</h2>
          <p className="text-gray-600 mb-6">Basado en tus respuestas, tu nivel estimado es:</p>
          <div className="text-6xl font-black text-[#2563EB] mb-6">{calculatedLevel}</div>
          
          {!user && (
            <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg mb-6 border border-orange-100">
              ⚠️ Al no estar conectado, este nivel no se guardará en tu perfil histórico.
            </p>
          )}

          <button 
            onClick={() => router.push('/writing-room')}
            className="w-full bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-md flex justify-center items-center"
          >
            Ir al Writing Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-20 p-4">
      <div className="max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-bold text-gray-500">Pregunta {currentQuestion + 1} de {selectedQuestions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
          <div className="bg-[#2563EB] h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 relative">
          {saving && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <h2 className="text-2xl md:text-3xl font-bold text-[#1F2937] mb-8 text-center leading-normal">
            {selectedQuestions[currentQuestion].text}
          </h2>
          <div className="flex flex-col gap-4">
            {selectedQuestions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.isCorrect)}
                className="w-full text-left p-5 rounded-xl border-2 border-gray-100 hover:border-[#2563EB] hover:bg-blue-50 transition-all font-semibold text-lg text-gray-800"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}