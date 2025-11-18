'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface InputFieldProps {
  placeholder?: string;
  initialValue?: string; // Valor inicial (para mostrar respuestas anteriores)
  onSubmit?: (value: string) => void;
  disabled?: boolean; // Para deshabilitar durante transiciones
  resetOnSubmit?: boolean; // Para limpiar el input después del submit
}

export default function InputField({
  placeholder = "Quiero crear un nuevo proyecto",
  initialValue = '',
  onSubmit,
  disabled = false,
  resetOnSubmit = true,
}: InputFieldProps) {
  const [value, setValue] = useState(initialValue);

  // Actualiza el valor cuando cambia el placeholder o initialValue (nueva pregunta o navegación)
  useEffect(() => {
    setValue(initialValue);
  }, [placeholder, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled && onSubmit) {
      const submittedValue = value.trim();
      onSubmit(submittedValue);
      // Limpia el input después del submit solo si resetOnSubmit es true y no hay initialValue
      // (es decir, solo limpia cuando es una respuesta nueva, no cuando se está editando)
      if (resetOnSubmit && !initialValue) {
        setValue('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="flex flex-col gap-4">
        <div className="w-full">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-sm sm:text-base md:text-lg lg:text-xl text-white placeholder:text-white/40 focus:outline-none pb-3 sm:pb-4 md:pb-5 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="h-0.5 w-full bg-purple-500" />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={disabled}
            className="flex h-10 sm:h-12 w-32 sm:w-40 items-center justify-end gap-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 active:scale-95 transition pr-3 sm:pr-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-500"
            aria-label="Submit"
          >
            <Image
              src="/icons/iconAlaiza.svg"
              alt="Alaiza"
              width={20}
              height={20}
              className="brightness-0 invert sm:w-6 sm:h-6"
            />
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
