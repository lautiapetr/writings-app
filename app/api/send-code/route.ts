import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email, code, name } = await req.json();

    if (!email || !code || !name) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // Impresión preventiva siempre en la terminal local del desarrollador
    console.log("==========================================");
    console.log(`✉️ [WriteMaster local] CÓDIGO GENERADO`);
    console.log(`Para: ${name} (${email})`);
    console.log(`Código de acceso: [ ${code} ]`);
    console.log("==========================================");

    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn("⚠️ [Resend Warning]: RESEND_API_KEY no encontrada en .env.local.");
      return NextResponse.json({ 
        success: true, 
        message: "Modo simulación: Código generado en consola local.",
        simulated: true 
      });
    }

    try {
      const resend = new Resend(apiKey);
      
      const { data, error } = await resend.emails.send({
        from: 'WriteMaster AI <onboarding@resend.dev>',
        to: email,
        subject: `${code} es tu código de verificación de WriteMaster AI`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-corners: 12px;">
            <h2 style="color: #2563eb; text-align: center;">WriteMaster AI</h2>
            <p>Hola <strong>${name}</strong>,</p>
            <p>Gracias por unirte a nuestra plataforma de práctica de inglés. Para completar tu registro y verificar que no eres un robot, por favor ingresa el siguiente código de seguridad en la aplicación:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e3a8a; margin: 20px 0; border-radius: 8px;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
              Si no solicitaste este código, puedes ignorar este correo pacíficamente.
            </p>
          </div>
        `
      });

      if (error) {
        console.error("❌ Error devuelto por la API de Resend:", error);
        
        // Si el error es debido al modo Sandbox gratuito (enviar a correos no verificados)
        if (error.message && error.message.includes("can only send to your own email")) {
          console.warn("⚠️ [Resend Sandbox]: Estás intentando registrarte con un correo no verificado en tu cuenta gratuita de Resend. Permitiendo bypass de desarrollo...");
          return NextResponse.json({ 
            success: true, 
            message: "Sandbox limitado: El código fue enviado a tu consola local.",
            simulated: true
          });
        }
        
        throw new Error(error.message);
      }

      return NextResponse.json({ success: true, message: "Código de verificación enviado por correo real.", data });

    } catch (resendError: any) {
      console.error("❌ Excepción al intentar enviar correo vía Resend:", resendError);
      
      // Fallback de desarrollo para que nunca te quedes bloqueado si la API Key falla o está caída
      return NextResponse.json({ 
        success: true, 
        message: "Fallback: Ocurrió un problema con Resend, el código está en tu consola local.",
        simulated: true 
      });
    }

  } catch (error) {
    console.error("Error crítico general en el Route Handler de envío de código:", error);
    return NextResponse.json({ error: "Error interno al procesar el código de seguridad" }, { status: 500 });
  }
}