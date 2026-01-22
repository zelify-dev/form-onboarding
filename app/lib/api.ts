export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://exemptive-bernice-experiencedly.ngrok-free.dev";

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
    <h1>Nueva Solicitud de Acceso</h1>
    <p><strong>Nombre:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Teléfono:</strong> ${data.phone}</p>
    <p><strong>Empresa:</strong> ${data.company}</p>
    <p><strong>Rol:</strong> ${data.role}</p>
    <br/>
    <p>Solicitado desde el formulario de onboarding.</p>
  `;

    const textContent = `
    Nueva Solicitud de Acceso
    Nombre: ${data.name}
    Email: ${data.email}
    Teléfono: ${data.phone}
    Empresa: ${data.company}
    Rol: ${data.role}
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
