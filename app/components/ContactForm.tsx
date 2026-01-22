"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type ContactFormProps = {
    onCancel: () => void;
    onSubmit: (data: ContactFormData) => void;
};

export type ContactFormData = {
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
};

type FormErrors = {
    [K in keyof ContactFormData]?: string;
};

export default function ContactForm({ onCancel, onSubmit }: ContactFormProps) {
    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = (name: keyof ContactFormData, value: string): string => {
        switch (name) {
            case "name":
                if (!value.trim()) return "El nombre es requerido";
                if (value.length < 3) return "El nombre es muy corto";
                return "";
            case "email":
                if (!value.trim()) return "El correo es requerido";
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return "Correo electrónico inválido";
                return "";
            case "phone":
                if (!value.trim()) return "El teléfono es requerido";
                // Expecting 10 digits mainly, but allow basic number validation
                const phoneRegex = /^\d{10}$/;
                if (!phoneRegex.test(value.replace(/\s/g, ""))) return "Ingresa un número celular válido (10 dígitos)";
                return "";
            case "company":
                if (!value.trim()) return "La empresa es requerida";
                return "";
            case "role":
                if (!value.trim()) return "El rol es requerido";
                return "";
            default:
                return "";
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof ContactFormData;

        setFormData((prev) => ({ ...prev, [fieldName]: value }));

        // Real-time validation if touched or if value is present
        if (touched[fieldName] || value) {
            const error = validateField(fieldName, value);
            setErrors((prev) => ({ ...prev, [fieldName]: error }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof ContactFormData;

        setTouched((prev) => ({ ...prev, [fieldName]: true }));
        const error = validateField(fieldName, value);
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const newErrors: FormErrors = {};
        let isValid = true;
        (Object.keys(formData) as Array<keyof ContactFormData>).forEach((key) => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        setTouched({
            name: true,
            email: true,
            phone: true,
            company: true,
            role: true
        });

        if (isValid) {
            onSubmit(formData);
        }
    };

    const inputClass = (error?: string) => `
    w-full rounded-xl border bg-black/40 px-4 py-3 text-white text-base outline-none transition 
    ${error
            ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
            : "border-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30"
        }
  `;

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
                <label className="text-xs text-white/50 mb-1 block">Nombre</label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Tu nombre completo"
                    className={inputClass(errors.name)}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className="text-xs text-white/50 mb-1 block">Correo Electrónico</label>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="ejemplo@empresa.com"
                    className={inputClass(errors.email)}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
                <label className="text-xs text-white/50 mb-1 block">Teléfono celular</label>
                <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0998324423"
                    maxLength={10}
                    className={inputClass(errors.phone)}
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
                <label className="text-xs text-white/50 mb-1 block">Empresa</label>
                <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Nombre de tu empresa"
                    className={inputClass(errors.company)}
                />
                {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
            </div>

            <div>
                <label className="text-xs text-white/50 mb-1 block">Rol en la empresa</label>
                <input
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Gerente / CEO / CTO"
                    className={inputClass(errors.role)}
                />
                {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
            </div>

            <div className="flex gap-3 mt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-white/20 py-3 text-base font-medium text-white/70 hover:bg-white/5 transition"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex-1 rounded-xl bg-purple-500 py-3 text-base font-semibold text-white shadow-lg shadow-purple-500/40 transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Enviar
                </button>
            </div>
        </form>
    );
}
