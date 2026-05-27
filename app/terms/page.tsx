"use client";

import Link from 'next/link';
import Logo from '@/components/Logo';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1F2937] font-sans pb-20">
      <header className="w-full p-6 flex justify-between items-center bg-white shadow-sm border-b border-gray-100">
        <Logo />
        <Link href="/" className="text-gray-500 hover:text-[#2563EB] transition-colors">Volver al inicio</Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-16">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Términos y Condiciones</h1>
          
          <div className="space-y-8 text-gray-600 leading-relaxed">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Naturaleza del Servicio</h2>
              <p>
                WriteMaster AI es una herramienta educativa experimental diseñada para ayudar a los usuarios a practicar la escritura en inglés mediante el uso de modelos de lenguaje de Inteligencia Artificial (LLMs). Nuestro objetivo es proporcionar retroalimentación constructiva y sugerencias de mejora gramatical y de vocabulario.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Precisión y Limitaciones de la IA</h2>
              <p className="mb-4">
                El usuario reconoce y acepta explícitamente que:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Las evaluaciones de nivel de inglés (Placement Test) son orientativas y <strong>no representan una certificación oficial</strong>, académica ni profesional de su nivel de idioma real.</li>
                <li>La Inteligencia Artificial utilizada puede cometer errores, ofrecer sugerencias inexactas (alucinaciones) o correcciones estilísticas con las que un hablante nativo podría no estar de acuerdo.</li>
                <li>WriteMaster AI no se hace responsable de las decisiones académicas, profesionales o personales tomadas con base en las correcciones o puntuaciones proporcionadas por la plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Uso Consciente de la Plataforma</h2>
              <p>
                El usuario se compromete a utilizar la plataforma bajo su propio criterio y conciencia. La retroalimentación proporcionada debe ser tomada como una guía de estudio y no como una verdad absoluta. Recomendamos siempre contrastar la información con fuentes oficiales, diccionarios reconocidos o profesores de inglés titulados ante cualquier duda significativa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Privacidad de los Escritos</h2>
              <p>
                Los textos ingresados en la plataforma (Writings) son procesados a través de las APIs de los proveedores de Inteligencia Artificial (ej. Google Gemini). Aunque los textos se guardan en el historial personal del usuario para fines de progreso, el usuario no debe ingresar información personal sensible, contraseñas, o datos confidenciales de terceros en sus redacciones.
              </p>
            </section>

          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
