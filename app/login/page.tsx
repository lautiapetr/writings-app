'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const APP_ID = 'writings-app';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  
  // Campos del Formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Checkbox de Términos
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Flujo de Verificación
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [userEnteredCode, setUserEnteredCode] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!name.trim()) {
      setErrorMsg('Por favor, ingresa tu nombre completo.');
      return;
    }

    // Validación estricta de Términos y Condiciones
    if (!acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones para poder registrarte.');
      return;
    }

    setLoading(true);

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar el correo de verificación.');
      }

      if (data.simulated) {
        console.log("ℹ️ [Modo Simulación Activo]: El código de verificación no pudo enviarse por Resend real. Usa el código impreso en tu terminal.");
      }

      setShowVerificationStep(true);
    } catch (error: any) {
      console.error("Error iniciando registro:", error);
      setErrorMsg(error.message || 'No pudimos procesar el código de verificación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (userEnteredCode !== generatedCode) {
      setErrorMsg('El código de verificación ingresado es incorrecto.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      const profileDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'data');
      await setDoc(profileDocRef, { 
        name: name,
        email: email,
        termsAccepted: true, // Guardamos la aceptación en la BD
        createdAt: new Date().toISOString()
      }, { merge: true });

      router.push('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado.');
      } else {
        setErrorMsg('Error al registrar la cuenta. Por favor, intenta de nuevo.');
      }
      setShowVerificationStep(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      console.error(error);
      setErrorMsg('El correo o la contraseña son incorrectos. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    
    // Si está intentando crear cuenta con Google, debe aceptar los términos
    if (!isLogin && !acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones para poder registrarte con Google.');
      return;
    }

    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const profileDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'data');
      await setDoc(profileDocRef, { 
        name: user.displayName || 'Usuario de Google',
        email: user.email,
        termsAccepted: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      router.push('/');
    } catch (error: any) {
      console.error(error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('No se pudo iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-6 left-6">
        <Logo size={36} />
      </div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg max-w-md w-full border border-gray-100">
        
        {showVerificationStep ? (
          <div>
            <h2 className="text-3xl font-extrabold text-[#1F2937] mb-2 text-center">Verifica tu Correo</h2>
            <p className="text-gray-500 text-center mb-6 text-sm">
              Hemos enviado un código a <span className="font-semibold text-gray-800">{email}</span>.
            </p>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-xl text-xs mb-6 text-center font-medium leading-relaxed">
              💡 <span className="font-bold">Modo Desarrollo:</span> Revisa la terminal donde corre tu servidor de Next.js para copiar el código generado.
            </div>

            <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-5">
              <div>
                <input 
                  type="text" 
                  maxLength={6}
                  value={userEnteredCode}
                  onChange={(e) => setUserEnteredCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full p-4 text-center rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-2xl font-black tracking-widest text-gray-900 placeholder-gray-300"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Confirmar y Crear Cuenta'}
              </button>

              <button 
                type="button"
                onClick={() => setShowVerificationStep(false)}
                className="text-center text-sm text-gray-400 hover:text-gray-600 transition-colors mt-2"
              >
                Atrás / Modificar datos
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-extrabold text-[#1F2937] mb-2 text-center">
              {isLogin ? '¡Hola de nuevo!' : 'Crea tu cuenta'}
            </h2>
            <p className="text-gray-500 text-center mb-6">
              {isLogin 
                ? 'Ingresa para continuar practicando tu nivel.' 
                : 'Únete para guardar tu progreso y correcciones.'}
            </p>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 text-center font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterInit} className="flex flex-col gap-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    required={!isLogin}
                    disabled={loading}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder-gray-500 font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  disabled={loading}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder-gray-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  disabled={loading}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder-gray-500 font-medium"
                />
              </div>

              {/* Casilla de Términos y Condiciones (Solo en Registro) */}
              {!isLogin && (
                <div className="flex items-start gap-2 mt-1">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#2563EB] rounded border-gray-300 focus:ring-[#2563EB] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                    He leído y acepto los <Link href="/terms" className="text-[#2563EB] hover:underline font-semibold" target="_blank">Términos y Condiciones</Link> sobre el uso de la Inteligencia Artificial.
                  </label>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className={`w-full bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 flex justify-center items-center ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? 'Iniciar Sesión' : 'Continuar')}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-px bg-gray-200 w-full"></div>
              <span className="text-sm text-gray-400">o</span>
              <div className="h-px bg-gray-200 w-full"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mt-6 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </button>

            <p className="text-center text-sm text-gray-500 mt-8">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#2563EB] font-bold ml-1 hover:underline focus:outline-none"
              >
                {isLogin ? 'Regístrate' : 'Inicia Sesión'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}