export interface CommunityPrompt {
  id?: string;
  title: string;
  instructions: string; // La consigna que lee el alumno
  customRubric?: string; // Instrucciones adicionales opcionales para Gemini
  minWords: number;
  format: string; // Ej: "Essay", "Informal Email", "Story"
  creatorId: string; // UID del usuario que lo creó
  creatorName: string; // Nombre para mostrar en el feed
  level: string; // A1, A2, B1, B2, C1/C2
  privacy: 'public' | 'private' | 'link'; // Control de visibilidad
  correctionType: 'ai' | 'manual'; // Quién corrige el ejercicio
  createdAt: string; // ISO String (new Date().toISOString())
}

export interface CommunityWriting {
  id?: string;
  promptId: string; // Referencia al CommunityPrompt de origen
  promptTitle: string; // Denormalizado para evitar lecturas extra en listados
  studentId: string; // UID del alumno que resuelve
  studentName: string; // Nombre del alumno para el creador del prompt
  originalText: string; // Texto escrito por el alumno
  status: 'pending' | 'corrected'; // Control de flujo (especialmente para corrección manual)
  score?: number; // 0 - 100
  generalFeedback?: string;
  errors?: {
    original_text: string;
    correction: string;
    explanation: string;
  }[]; // Mismo formato que el framework actual
  correctedById?: string; // UID de quien corrigió si fue 'manual'
  createdAt: string; // ISO String
}

export interface CommunityNotification {
  id?: string;
  type: 'new_submission' | 'corrected'; // Nueva entrega para el profesor / Ejercicio corregido para el alumno
  title: string;
  message: string;
  read: boolean;
  relatedId: string; // ID del CommunityWriting implicado para redirigir directamente
  createdAt: string; // ISO String
}