'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/Logo';

export default function Home() {
  const { user, userName, loadingAuth, userLevel, logout } = useApp();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1F2937] font-sans flex flex-col">
      
      {/* Navegación Superior */}
      <header className="w-full p-6 flex justify-between items-center bg-white shadow-sm border-b border-gray-100 flex-shrink-0">
        <Logo />
        <nav className="flex items-center gap-4">
          {loadingAuth ? (
            <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 hidden sm:block">
                Hola, <span className="font-semibold text-gray-900">{userName || user.email}</span>
                {userLevel && (
                  <span className="ml-2 bg-blue-100 text-[#2563EB] text-xs font-bold px-2.5 py-1 rounded">
                    Nivel: {userLevel}
                  </span>
                )}
              </div>
              {/* NUEVO ENLACE A LA COMUNIDAD */}
              <Link 
                href="/community" 
                className="text-sm font-bold text-gray-500 hover:text-[#2563EB] transition-colors flex items-center gap-1"
              >
                <span className="text-lg">🌎</span> Comunidad
              </Link>
              <Link 
                href="/profile" 
                className="bg-gray-100 hover:bg-gray-200 text-[#1F2937] font-semibold py-2 px-4 rounded-xl text-sm transition-colors"
              >
                Mi Perfil
              </Link>
              <button 
                onClick={logout}
                className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors shadow-sm"
            >
              Iniciar Sesión
            </Link>
          )}
        </nav>
      </header>

      {/* Sección Principal */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-16 pb-20">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-gray-900">
          Mejora tu Inglés con <span className="text-[#2563EB]">Inteligencia Artificial</span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mb-10 text-gray-600 leading-relaxed">
          Practica tu writing, recibe correcciones instantáneas y descubre tu nivel real. 
          Desde A1 hasta C2, nuestra IA te guiará paso a paso.
        </p>
        
        {/* Botón Principal Adaptativo */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link 
            href="/placement-test" 
            className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-4 px-8 rounded-full text-lg transition duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            {userLevel ? 'Rehacer Test de Nivel' : 'Hacer Prueba de Nivel'}
          </Link>
          
          {userLevel && (
            <Link 
              href="/writing-room" 
              className="bg-white hover:bg-gray-50 text-[#2563EB] border-2 border-[#2563EB] font-bold py-3.5 px-8 rounded-full text-lg transition duration-300 shadow-sm w-full sm:w-auto"
            >
              Ir al Writing Room
            </Link>
          )}
        </div>

        {/* Tarjetas Informativas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="text-[#2563EB] text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Evaluación Precisa</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Descubre tu nivel exacto con nuestro test adaptativo de 10 preguntas diseñado por expertos.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="text-[#2563EB] text-4xl mb-4">✍️</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Desafíos Personalizados</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Escribe sobre temas adaptados a tu vocabulario y nivel de inglés actual.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="text-[#2563EB] text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Feedback de Gemini</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Recibe corrección detallada en tiempo real de errores gramaticales y sugerencias de mejora.</p>
          </div>
        </div>
      </main>

      {/* Footer Simple */}
      <footer className="w-full bg-white border-t border-gray-100 py-8 mt-auto flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} WriteMaster AI. Todos los derechos reservados.</p>
          <div className="mt-4 md:mt-0 flex gap-6">
            <Link href="/terms" className="hover:text-[#2563EB] transition-colors font-medium">
              Términos y Condiciones (Aviso Legal)
            </Link>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-[#2563EB] transition-colors font-medium">
              Privacidad
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}