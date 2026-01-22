export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://exemptive-bernice-experiencedly.ngrok-free.dev";

type EvaluateBusinessProfileResponse = {
    status: "next" | "decline";
    percentage: number;
    criteriaMet: number;
    criteriaPartial: number;
    criteriaNotMet: number;
    message?: string;
    emailMessageId?: string;
};

type GenerateProposalResponse = {
    message: string;
    url: string;
    s3Url: string;
    fileName: string;
    client: string;
    mappedModules: string[];
    inferredModules: string[];
    mergedModules: string[];
};

type EmailPayload = {
    to: string;
    subject: string;
    html: string;
    text: string;
    cc?: string;
    bcc?: string;
};

export async function sendAccessRequestEmail(data: {
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
}) {
    const subject = "Solicitud de Códigos de Acceso Alaiza Onboarding";

    // Destinatario fijo por ahora, o podría ser dinámico
    const recipient = "vicente.narvaez@zwippe.com";

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
          color: #333333;
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          background-color: #7c3aed;
          padding: 32px 40px;
          border-bottom: 3px solid #6d28d9;
        }
        .email-header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .email-body {
          padding: 40px;
        }
        .info-section {
          margin-bottom: 32px;
        }
        .info-item {
          padding: 16px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-item:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .info-value {
          color: #111827;
          font-size: 16px;
          word-break: break-word;
        }
        .info-value a {
          color: #7c3aed;
          text-decoration: none;
        }
        .info-value a:hover {
          text-decoration: underline;
        }
        .profile-badge {
          display: inline-block;
          background-color: #f3f4f6;
          color: #374151;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          margin-left: 8px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 40px;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          color: #6b7280;
          font-size: 12px;
          margin: 0;
          line-height: 1.5;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 20px;
            border-radius: 0;
          }
          .email-header,
          .email-body,
          .footer {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Nueva Solicitud de Acceso</h1>
        </div>
        <div class="email-body">
          <div class="info-section">
            <div class="info-item">
              <div class="info-label">Nombre</div>
              <div class="info-value">${data.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">
                <a href="mailto:${data.email}">${data.email}</a>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Teléfono</div>
              <div class="info-value">
                <a href="tel:${data.phone}">${data.phone}</a>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Empresa</div>
              <div class="info-value">${data.company}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Perfil</div>
              <div class="info-value">
                ${data.role === 'commercial' ? 'Perfil Comercial' : 'Perfil Técnico'}
                <span class="profile-badge">${data.role === 'commercial' ? 'Negocio' : 'Tecnológico'}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="footer">
          <p class="footer-text">
            Solicitud generada desde el formulario de onboarding de Alaiza<br>
            <span style="color: #9ca3af;">${new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    const textContent = `
NUEVA SOLICITUD DE ACCESO - ALAIZA ONBOARDING

Nombre: ${data.name}
Email: ${data.email}
Teléfono: ${data.phone}
Empresa: ${data.company}
Perfil: ${data.role === 'commercial' ? 'Perfil Comercial (Negocio)' : 'Perfil Técnico (Tecnológico)'}

───────────────────────────────────────────────────────
Solicitud generada desde el formulario de onboarding de Alaiza
Fecha: ${new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
───────────────────────────────────────────────────────
  `;

    const payload: EmailPayload = {
        to: recipient,
        subject: subject,
        html: htmlContent,
        text: textContent,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/email/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error sending email:", response.status, errorText);
            throw new Error(`Error al enviar el correo: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
}

export async function evaluateBusinessProfile(answers: string[], questions: string[]) {
    try {
        const payload = {
            questions: questions.map((question, index) => ({
                questionNumber: index + 1,
                question: question,
                answer: answers[index] || "",
            })),
            submittedAt: new Date().toISOString(),
        };

        console.log("📤 [API] evaluateBusinessProfile - URL:", `${API_BASE_URL}/ai/evaluate-business-profile`);
        console.log("📤 [API] evaluateBusinessProfile - Payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_BASE_URL}/ai/evaluate-business-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("📥 [API] evaluateBusinessProfile - Status:", response.status);
        console.log("📥 [API] evaluateBusinessProfile - Status Text:", response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ [API] evaluateBusinessProfile - Error:", response.status, errorText);
            throw new Error(`Error al evaluar perfil comercial: ${response.statusText}`);
        }

        const result = await response.json() as EvaluateBusinessProfileResponse;
        console.log("✅ [API] evaluateBusinessProfile - Respuesta:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error("❌ [API] evaluateBusinessProfile - Exception:", error);
        throw error;
    }
}

export async function generateProposal(answers: string[], questions: string[]) {
    try {
        const payload = {
            questions: questions.map((question, index) => ({
                questionNumber: index + 1,
                question: question,
                answer: answers[index] || "",
            })),
            submittedAt: new Date().toISOString(),
        };

        console.log("📤 [API] generateProposal - URL:", `${API_BASE_URL}/ai/generate-proposal`);
        console.log("📤 [API] generateProposal - Payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_BASE_URL}/ai/generate-proposal`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("📥 [API] generateProposal - Status:", response.status);
        console.log("📥 [API] generateProposal - Status Text:", response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ [API] generateProposal - Error:", response.status, errorText);
            throw new Error(`Error al generar propuesta: ${response.statusText}`);
        }

        const result = await response.json() as GenerateProposalResponse;
        console.log("✅ [API] generateProposal - Respuesta:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error("❌ [API] generateProposal - Exception:", error);
        throw error;
    }
}

export async function sendProposalEmail(data: {
    recipientEmail: string;
    recipientName: string;
    pdfUrl: string;
}) {
    const subject = "Propuesta Comercial - Zelify";

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
          color: #333333;
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .email-body {
          padding: 40px;
        }
        .email-content {
          color: #111827;
          font-size: 16px;
          line-height: 1.8;
        }
        .email-content p {
          margin: 0 0 16px 0;
        }
        .pdf-link {
          display: inline-block;
          background-color: #7c3aed;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 8px;
        }
        .pdf-link:hover {
          background-color: #6d28d9;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 40px;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          color: #6b7280;
          font-size: 12px;
          margin: 0;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 20px;
            border-radius: 0;
          }
          .email-body,
          .footer {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-body">
          <div class="email-content">
            <p>Hola ${data.recipientName},</p>
            <p>Gracias por contactarnos, es un gusto saber que estás interesado en las soluciones de Zelify.</p>
            <p>Con gusto podemos coordinar una llamada para conocer más sobre tus necesidades, mostrarte cómo puedes aprovechar los productos de Zelify y presentarte una propuesta comercial acorde a lo que estás buscando (la encuentras incluida en este correo como link de acceso).</p>
            <p>
              <a href="${data.pdfUrl}" class="pdf-link" target="_blank">Ver Propuesta Comercial</a>
            </p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-text">
            Este correo fue generado automáticamente desde el sistema de onboarding de Zelify.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    const textContent = `
Hola ${data.recipientName},

Gracias por contactarnos, es un gusto saber que estás interesado en las soluciones de Zelify.

Con gusto podemos coordinar una llamada para conocer más sobre tus necesidades, mostrarte cómo puedes aprovechar los productos de Zelify y presentarte una propuesta comercial acorde a lo que estás buscando (la encuentras incluida en este correo como link de acceso).

Accede a tu propuesta comercial: ${data.pdfUrl}

Este correo fue generado automáticamente desde el sistema de onboarding de Zelify.
  `;

    const payload: EmailPayload = {
        to: data.recipientEmail,
        subject: subject,
        html: htmlContent,
        text: textContent,
    };

    try {
        console.log("📤 [API] sendProposalEmail - URL:", `${API_BASE_URL}/email/send`);
        console.log("📤 [API] sendProposalEmail - Payload:", JSON.stringify({
            to: payload.to,
            subject: payload.subject,
            htmlLength: payload.html.length,
            textLength: payload.text.length
        }, null, 2));

        const response = await fetch(`${API_BASE_URL}/email/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("📥 [API] sendProposalEmail - Status:", response.status);
        console.log("📥 [API] sendProposalEmail - Status Text:", response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ [API] sendProposalEmail - Error:", response.status, errorText);
            throw new Error(`Error al enviar el correo: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("✅ [API] sendProposalEmail - Respuesta:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error("❌ [API] sendProposalEmail - Exception:", error);
        throw error;
    }
}
