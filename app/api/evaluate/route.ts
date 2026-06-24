import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, level, topic, customRubric } = body;

    if (!text || !level || !topic) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Falta GEMINI_API_KEY en las variables de entorno");
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    // Usando el modelo especificado por el usuario en v1beta
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

    const systemPrompt = `Eres un examinador experto de inglés. Evalúa el siguiente texto escrito por un estudiante de nivel ${level}. El tema solicitado era: '${topic}'.
Tu tarea es:
1. Identificar errores gramaticales, ortográficos y de vocabulario de acuerdo a su nivel.
2. Reescribir las oraciones con errores de forma natural.
3. Dar una puntuación general (0-100).
4. Si el texto está en otro idioma que no sea inglés, o es texto sin sentido, devuelve un score de 0 y explica el problema.

${customRubric ? `REGLAS DE EVALUACIÓN ADICIONALES DEL CREADOR (SÍGUELAS ESTRICTAMENTE):\n${customRubric}\n` : ''}
Devuelve la respuesta ESTRICTAMENTE en formato JSON, sin Markdown, sin bloques de código, solo el objeto JSON crudo con esta estructura exacta:
{
  "score": número,
  "general_feedback": "string con tu opinión general",
  "errors": [
    {
      "original_text": "oración con error",
      "correction": "oración corregida",
      "explanation": "explicación breve del error"
    }
  ]
}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `Texto del estudiante:\n\n${text}` }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Error de Google API:", errorText);
        throw new Error(`Error de la API de Gemini: ${response.status}`);
    }

    const data = await response.json();
    let aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponseText) {
        throw new Error("No se pudo extraer la respuesta de la IA.");
    }

    // Limpiamos la respuesta
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const evaluationResult = JSON.parse(aiResponseText);

    return NextResponse.json(evaluationResult);

  } catch (error) {
    console.error("Error en la evaluación:", error);
    return NextResponse.json({ error: "Error procesando la evaluación con la IA" }, { status: 500 });
  }
}