"use client";

import { useState, useEffect } from "react";

interface AnimationToggleProps {
  onToggle: (enabled: boolean) => void;
  defaultEnabled?: boolean;
}

export default function AnimationToggle({ 
  onToggle, 
  defaultEnabled = true 
}: AnimationToggleProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Notificar el cambio de estado
    onToggle(enabled);
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return null;
  }

  const handleToggle = () => {
    setEnabled(prev => !prev);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-lg px-4 py-3 shadow-lg border border-purple-500/30">
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="text-white text-sm sm:text-base font-medium select-none">
          Animaciones
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent
            ${enabled ? 'bg-purple-500' : 'bg-gray-600'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
              ${enabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </label>
    </div>
  );
}

