'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface EvaluationResult {
  score: number;
  general_feedback: string;
  errors: {
    original_text: string;
    correction: string;
    explanation: string;
  }[];
}

interface AppContextType {
  user: User | null;
  userName: string | null;
  loadingAuth: boolean;
  userLevel: string | null;
  setUserLevel: (level: string | null) => void;
  evaluation: EvaluationResult | null;
  setEvaluation: (evalData: EvaluationResult | null) => void;
  saveUserLevelToFirestore: (level: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const APP_ID = 'writings-app';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Escuchar el estado de autenticación en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Establecer primeramente el nombre desde el objeto Auth
        setUserName(currentUser.displayName);

        try {
          const profileDocRef = doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'profile', 'data');
          const docSnap = await getDoc(profileDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.level) setUserLevel(data.level);
            if (data.name) setUserName(data.name);
          } else {
            setUserLevel(null);
          }
        } catch (error) {
          console.error("Error cargando perfil desde Firestore:", error);
        }
      } else {
        setUserLevel(null);
        setUserName(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const saveUserLevelToFirestore = async (level: string) => {
    setUserLevel(level);
    if (user) {
      try {
        const profileDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'data');
        await setDoc(profileDocRef, { 
          level: level, 
          email: user.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Error guardando el nivel en Firestore:", error);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserLevel(null);
    setUserName(null);
    setEvaluation(null);
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      userName,
      loadingAuth, 
      userLevel, 
      setUserLevel, 
      evaluation, 
      setEvaluation,
      saveUserLevelToFirestore,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
}