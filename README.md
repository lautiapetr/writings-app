# **WriteMaster AI ✍️🤖**

#### Español

**WriteMaster AI** es una plataforma web moderna e interactiva diseñada para la autoevaluación y práctica de la escritura (*writing*) en inglés. A través de la integración de Inteligencia Artificial de vanguardia, los usuarios pueden conocer su nivel de inglés, enfrentarse a desafíos de escritura específicos para su nivel, recibir retroalimentación instantánea y hacer un seguimiento exhaustivo de su progreso.

La interfaz está diseñada con un enfoque educativo, limpio y minimalista, utilizando una paleta de colores basada en blancos y azules que transmiten confianza y facilitan el aprendizaje.

## **🚀 Características Clave**

* **Test de Nivel Adaptativo (Placement Test):** Un banco de preguntas de dificultad mixta (A1 a C2) seleccionadas dinámicamente al azar. Evalúa y calcula de forma inmediata el nivel inicial del estudiante.  
* **Sala de Escritura Inteligente (Writing Room):** Desafíos dinámicos de redacción adaptados al nivel del usuario con diferentes formatos (emails informales, cartas formales, ensayos argumentativos, etc.) y control de palabras requeridas en tiempo real.  
* **Motor de Evaluación con IA (Gemini 3.1 Flash Lite):** Envío seguro de textos a través de una API en el backend para obtener puntuaciones (0-100), retroalimentación general constructiva y correcciones detalladas con explicaciones gramaticales.  
* **Autenticación Segura y Control de Bots:**  
  * Registro tradicional por correo y contraseña protegido por un sistema de verificación de doble factor con un código de seguridad de 6 dígitos enviado por correo electrónico real utilizando **Resend**.  
  * Inicio de sesión rápido y seguro con **Google Sign-In**.  
  * Casilla obligatoria de aceptación de términos de uso de Inteligencia Artificial para el cumplimiento legal y ético.  
* **Perfil y Dashboard de Progreso:** Historial de redacciones del usuario almacenadas de forma persistente en **Firebase Firestore**, permitiendo expandir los envíos antiguos para repasar las correcciones y ver el promedio histórico de calificaciones.

## **🛠️ Stack Tecnológico**

* **Framework:** [Next.js](https://nextjs.org/) (React, App Router, Route Handlers).  
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) para una UI limpia, moderna y totalmente responsiva.  
* **Base de Datos y Auth:** [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore).  
* **Motor de IA:** API de [Google Gemini](https://ai.google.dev/) (Modelo gemini-3.1-flash-lite vía endpoint de desarrollo v1beta).  
* **Gestor de Correos:** [Resend](https://resend.com/) (Para el envío del código de verificación OTP).

## **📦 Instalación y Configuración Local**

Sigue estos pasos para ejecutar el proyecto en tu máquina local:

### **1\. Clonar el repositorio**

git clone \[https://github.com/TU-USUARIO/writingsapp.git\](https://github.com/TU-USUARIO/writingsapp.git)  
cd writingsapp

### **2\. Instalar dependencias**

npm install

### **3\. Configurar variables de entorno**

Crea un archivo .env.local en la raíz del proyecto y completa las siguientes credenciales:

\# API de Inteligencia Artificial  
GEMINI\_API\_KEY=tu\_api\_key\_de\_gemini

\# Proveedor de Correos (OTP de registro)  
RESEND\_API\_KEY=tu\_api\_key\_de\_resend

\# Configuración de Firebase (SDK de Cliente)  
NEXT\_PUBLIC\_FIREBASE\_API\_KEY=tu\_api\_key\_de\_firebase  
NEXT\_PUBLIC\_FIREBASE\_AUTH\_DOMAIN=tu-proyecto.firebaseapp.com  
NEXT\_PUBLIC\_FIREBASE\_PROJECT\_ID=tu-proyecto  
NEXT\_PUBLIC\_FIREBASE\_STORAGE\_BUCKET=tu-proyecto.appspot.com  
NEXT\_PUBLIC\_FIREBASE\_MESSAGING\_SENDER\_ID=tu\_sender\_id  
NEXT\_PUBLIC\_FIREBASE\_APP\_ID=tu\_app\_id

### **4\. Ejecutar el servidor de desarrollo**

npm run dev

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación funcionando.

## **🛡️ Reglas de Seguridad de Firestore**

Para proteger los datos de tus usuarios y permitir que el SDK de cliente pueda guardar los escritos, asegúrate de añadir las siguientes reglas en la sección **Rules** de tu base de datos Firestore en la consola de Firebase:

rules\_version \= '2';  
service cloud.firestore {  
  match /databases/{database}/documents {  
      
    // El usuario solo puede leer y escribir su propia información en "artifacts"  
    match /artifacts/{appId}/users/{userId}/{document=\*\*} {  
      allow read, write: if request.auth \!= null && request.auth.uid \== userId;  
    }  
      
  }  
}

## **📄 Licencia**

Este proyecto está bajo la licencia **GNU GPLv3**. Esto significa que el código es abierto y libre de modificarse, pero se deben conservar los créditos de autoría de manera obligatoria y cualquier derivado público de este proyecto deberá heredar la misma filosofía de código abierto.

Desarrollado con ❤️ y con Inteligencia Artificial por **\Lautaro Agustín Petroni**.

# --------------------------------------------------------------------
#### English

**WriteMaster AI** is a modern and interactive web platform designed for self-assessment and English writing practice. Integrated with cutting-edge Artificial Intelligence, it allows users to determine their current English proficiency, tackle level-specific writing challenges, receive instant detailed feedback, and track their progress over time.

The user interface is designed with a clean, educational, and minimalist aesthetic, leveraging a sophisticated white-and-blue color palette that inspires trust and facilitates focused learning.

## **🚀 Key Features**

* **Adaptive Placement Test:** A dynamic test drawing from a randomized, mixed-difficulty pool of questions (ranging from A1 to C2). It instantly evaluates and calculates the student's initial proficiency level.  
* **Smart Writing Room:** Level-appropriate, dynamic writing prompts spanning various formats (informal emails, formal letters, argumentative essays, etc.) with real-time word count monitoring.  
* **AI Evaluation Engine (Gemini 3.1 Flash Lite):** Secure text processing via a robust backend API to deliver instant scores (0-100), encouraging general feedback, and precise corrections coupled with grammar explanations.  
* **Secure Authentication & Bot Protection:**  
  * Traditional email and password registration fortified by a two-factor verification system (OTP), sending 6-digit security codes via real emails using **Resend**.  
  * Quick and secure authentication using **Google Sign-In**.  
  * Mandatory Artificial Intelligence terms of use checkbox to ensure legal and ethical compliance.  
* **Profile & Progress Dashboard:** Persistent storage of user writings in **Firebase Firestore**, allowing users to expand past submissions, study AI corrections, and monitor their historical average score.

## **🛠️ Tech Stack**

* **Framework:** [Next.js](https://nextjs.org/) (React, App Router, Route Handlers).  
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) for a modern, sleek, and fully responsive UI.  
* **Database & Auth:** [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore).  
* **AI Engine:** [Google Gemini](https://ai.google.dev/) API (gemini-3.1-flash-lite model via the v1beta development endpoint).  
* **Email Service:** [Resend](https://resend.com/) (For dispatching OTP verification codes during registration).

## **📦 Local Installation & Setup**

Follow these steps to run the project locally on your machine:

### **1\. Clone the repository**

git clone \[https://github.com/lautiapetr/writingsapp.git\](https://github.com/lautiapetr/writingsapp.git)  
cd writingsapp

### **2\. Install dependencies**

npm install

### **3\. Configure environment variables**

Create a .env.local file in the root directory and populate it with the following credentials:

\# AI Engine API Key  
GEMINI\_API\_KEY=your\_gemini\_api\_key\_here

\# Email Provider API Key (OTP registration)  
RESEND\_API\_KEY=your\_resend\_api\_key\_here

\# Firebase Configuration (Client SDK)  
NEXT\_PUBLIC\_FIREBASE\_API\_KEY=your\_firebase\_api\_key  
NEXT\_PUBLIC\_FIREBASE\_AUTH\_DOMAIN=your-project.firebaseapp.com  
NEXT\_PUBLIC\_FIREBASE\_PROJECT\_ID=your-project  
NEXT\_PUBLIC\_FIREBASE\_STORAGE\_BUCKET=your-project.appspot.com  
NEXT\_PUBLIC\_FIREBASE\_MESSAGING\_SENDER\_ID=your\_sender\_id  
NEXT\_PUBLIC\_FIREBASE\_APP\_ID=your\_app\_id

### **4\. Run the development server**

npm run dev

Open [http://localhost:3000](http://localhost:3000) in your browser to see the live application.

## **🛡️ Firestore Security Rules**

To safeguard your users' data and allow the client SDK to successfully persist their writing assessments, apply the following security rules under the **Rules** tab of your Firestore Database console:

rules\_version \= '2';  
service cloud.firestore {  
  match /databases/{database}/documents {  
      
    // Users can only read and write their own data inside the "artifacts" scope  
    match /artifacts/{appId}/users/{userId}/{document=\*\*} {  
      allow read, write: if request.auth \!= null && request.auth.uid \== userId;  
    }  
      
  }  
}

## **📄 License**

This project is licensed under the **GNU GPLv3** (or alternatively **Apache 2.0**). This means that the codebase is open-source and free to modify, provided that original authorship credits are strictly maintained. Any publicly distributed derivative of this project must also inherit this open-source philosophy.

Developed with ❤️ and Artificial Intelligence by **\Lautaro Agustín Petroni**.
