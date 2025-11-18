'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className="mr-4 sm:mr-8 md:mr-12">
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="relative flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full bg-white transition-all duration-300 shadow-sm"
        aria-label="Toggle theme"
      >
        {/* Icono Sol fijo en el lado izquierdo - gris cuando no está seleccionado */}
        <div className="absolute left-1.5 sm:left-2 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center z-10">
          <svg
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300 ${
              !isDark ? 'text-transparent' : 'text-gray-400'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </div>
        
        {/* Icono Luna fijo en el lado derecho - gris cuando no está seleccionado */}
        <div className="absolute right-1.5 sm:right-2 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center z-10">
          <svg
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300 ${
              isDark ? 'text-transparent' : 'text-gray-400'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </div>
        
        {/* Círculo morado deslizante con icono dentro */}
        <div
          className={`absolute flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-purple-500 transition-transform duration-300 z-20 shadow-md ${
            isDark ? 'translate-x-8 sm:translate-x-9' : 'translate-x-0.5 sm:translate-x-1'
          }`}
        >
          {/* Icono dentro del círculo morado */}
          {isDark ? (
            <svg
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}

