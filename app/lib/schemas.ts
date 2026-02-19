import { z } from 'zod';

// Regex for alphanumeric codes only (no special characters that could trigger SQLi/XSS)
export const accessCodeSchema = z.object({
    code: z
        .string()
        .trim() // Trim first to handle copy-paste spaces
        .min(1, { message: "El código es requerido" })
        .regex(/^[a-zA-Z0-9]+$/, { message: "El código solo puede contener letras y números" }),
});

// Sanitize inputs to remove dangerous characters, though React escapes by default, 
// explicit server-side sanitization is robust against other contexts.
// For now, we rely on Zod's strict typing and specific regexes.

export const contactFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(45, { message: "El nombre es muy largo" })
        .regex(/^[\p{L}\s\-\.]+$/u, { message: "El nombre contiene caracteres inválidos" }),

    email: z
        .string()
        .trim()
        .email({ message: "Correo electrónico inválido" })
        .toLowerCase(),

    phone: z
        .string()
        .trim()
        .regex(/^\d{10}$/, { message: "El teléfono debe tener 10 dígitos numéricos" }),

    company: z
        .string()
        .trim()
        .min(2, { message: "El nombre de la empresa es requerido" })
        .max(50, { message: "El nombre de la empresa es muy largo" })
        .regex(/^[\p{L}\p{N}\s\-\.&]+$/u, { message: "El nombre de la empresa contiene caracteres inválidos" }),

    role: z
        .string()
        .trim()
        .min(2, { message: "El rol es requerido" })
        .max(50, { message: "El rol es muy largo" })
        .regex(/^[\p{L}\s\-\.]+$/u, { message: "El rol contiene caracteres inválidos" }),
});

export type AccessCodeInput = z.infer<typeof accessCodeSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;

// Generic sanitization regex for text fields (prevents HTML tags and common injection chars)
// Allows letters, numbers, common punctuation, spacing.
const safeTextRegex = /^[\p{L}\p{N}\s\-\.,;:\(\)\?¿!¡@#&"'/]+$/u;
// More permissive text regex but blocking strict dangerous chars like < > { }
const permissiveTextRegex = /^[^<>{}]+$/;

// Tech form has 15 questions
export const technicalFormSchema = z.object({
    answers: z.array(z.string().trim()).min(15).max(15).superRefine((val, ctx) => {
        val.forEach((answer, index) => {
            // Sanitize all answers
            if (answer.length > 0 && !permissiveTextRegex.test(answer)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Respuesta ${index + 1} contiene caracteres no permitidos`,
                    path: [index]
                });
            }
            // Name validation (Index 0)
            if (index === 0 && answer.length > 0 && answer.length < 3) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Nombre muy corto",
                    path: [0]
                });
            }
        });
    })
});

// Commercial form has 27 questions
// Indices 16-24 are metrics (numeric-ish)
const metricRegex = /^[\d\s\.,$€£%a-zA-Z]+$/; // Allows numbers, spaces, dots, commas, currency, and some text (e.g. "USD")

export const commercialFormSchema = z.object({
    answers: z.array(z.string().trim()).min(27).max(27).superRefine((val, ctx) => {
        val.forEach((answer, index) => {
            // General sanitization
            if (answer.length > 0 && !permissiveTextRegex.test(answer)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Respuesta ${index + 1} contiene caracteres no permitidos`,
                    path: [index]
                });
            }

            // Name validation (Index 0)
            if (index === 0 && answer.length > 0 && answer.length < 3) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Nombre muy corto",
                    path: [0]
                });
            }

            // Metrics validation (Indices 16-24)
            // 17. TPV to 25. Number of transfers
            // Arrays are 0-indexed, so Question 17 is index 16.
            if (index >= 16 && index <= 24 && answer.length > 0) {
                if (!metricRegex.test(answer)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Este campo debe contener valores numéricos o monetarios válidos",
                        path: [index]
                    });
                }
            }
        });
    })
});
