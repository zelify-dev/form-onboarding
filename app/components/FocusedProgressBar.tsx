"use client";

import { useEffect, useState } from "react";

interface FocusedProgressBarProps {
    totalSteps: number;
    currentStep: number;
    completedSteps: number[];
}

export default function FocusedProgressBar({
    totalSteps,
    currentStep,
    completedSteps,
}: FocusedProgressBarProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calcular porcentaje de progreso para la barra continua
    const progressPercentage = (currentStep / totalSteps) * 100;

    // Evitar desajustes de hidratación (Hydration Mismatch)
    // Renderizar un placeholder estático hasta que el componente esté montado en el cliente
    if (!mounted) {
        return (
            <div className="relative w-full h-24 flex items-center justify-center overflow-hidden">
                <div className="flex items-center gap-4">
                    {/* Skeleton simple para mantener la estructura visual durante la carga */}
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative w-full h-24 flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Barra de Progreso Continua (Estilo YouTube) */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-200 z-30">
                <div
                    className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7] transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
                {/* Brillo en la punta de la barra */}
                <div
                    className="absolute top-0 h-[2px] w-2 bg-slate-300 blur-[2px] transition-all duration-500 ease-out"
                    style={{ left: `${progressPercentage}%`, transform: 'translateX(-100%)' }}
                />
            </div>

            {/* Contenedor con máscara para la lista de números */}
            <div
                className="w-full h-20 flex items-center justify-center relative"
                style={{
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                }}
            >
                {/* Contenedor de la pista que se mueve */}
                <div
                    className="flex items-center transition-transform duration-500 linear will-change-transform"
                    style={{
                        // 4rem es el ancho total de cada bloque (círculo + separador)
                        // Ajustamos para centrar el elemento actual
                        // -1rem es para compensar la mitad del ancho del círculo
                        transform: `translateX(calc(50% - ${(currentStep) * 4}rem - 1rem))`,
                    }}
                >
                    {Array.from({ length: totalSteps }, (_, i) => {
                        const stepNumber = i + 1;
                        const distance = Math.abs(currentStep - stepNumber);
                        const isCompleted = completedSteps.includes(stepNumber);

                        // Lógica estricta de visualización:
                        // Si está completado y NO es el actual -> CHECKMARK
                        // Si es el actual (incluso si estaba completado antes) -> NÚMERO + EFECTO ACTIVO
                        const showCheckmark = isCompleted && distance !== 0;

                        // Calcular estilos basados en la distancia al centro
                        let scale = 1;
                        let opacity = 1;
                        let blur = 0;
                        let zIndex = 10;
                        let separatorOpacity = 0.3;

                        if (distance === 0) {
                            // Elemento central (Current)
                            scale = 1.3; // Reducido de 1.6 a 1.3 como solicitó el usuario
                            opacity = 1;
                            blur = 0;
                            zIndex = 20;
                            separatorOpacity = 0.5;
                        } else if (distance === 1) {
                            // Vecinos inmediatos
                            scale = 0.9;
                            opacity = 0.6;
                            blur = 0;
                            zIndex = 10;
                            separatorOpacity = 0.3;
                        } else if (distance === 2) {
                            // Vecinos lejanos
                            scale = 0.7;
                            opacity = 0.25;
                            blur = 0.5;
                            zIndex = 5;
                            separatorOpacity = 0.1;
                        } else {
                            // Muy lejanos
                            scale = 0.5;
                            opacity = 0.05;
                            blur = 1;
                            zIndex = 0;
                            separatorOpacity = 0;
                        }

                        return (
                            <div key={stepNumber} className="flex items-center">
                                {/* Elemento Circular */}
                                <div
                                    className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        transform: `scale(${scale})`,
                                        opacity: opacity,
                                        filter: `blur(${blur}px)`,
                                        zIndex: zIndex,
                                    }}
                                >
                                    {/* 1. Efecto Ripple (Onda) solo para el activo */}
                                    {distance === 0 && (
                                        <div className="absolute inset-0 -m-1 rounded-full border border-purple-500 opacity-75 animate-ping-slow pointer-events-none" />
                                    )}

                                    {/* 2. Círculo Base */}
                                    <div
                                        className={`absolute inset-0 rounded-full border flex items-center justify-center transition-colors duration-500 flex-shrink-0 ${distance === 0
                                            ? "border-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                            : showCheckmark
                                                ? "border-purple-500 bg-purple-500/10" // Estilo completado
                                                : "border-slate-200 bg-transparent"
                                            }`}
                                    >
                                        {/* Contenido: Checkmark o Número */}
                                        {showCheckmark ? (
                                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span
                                                className={`font-semibold  transition-colors duration-300 ${distance === 0 ? "text-slate-900 text-base" : "text-slate-500 text-xs"
                                                    }`}
                                            >
                                                {stepNumber}
                                            </span>
                                        )}
                                    </div>

                                    {/* 3. Glow estático para el activo */}
                                    {distance === 0 && (
                                        <div className="absolute inset-0 bg-purple-500/30 blur-md rounded-full -z-10" />
                                    )}
                                </div>

                                {/* Separador (Guión) */}
                                {i < totalSteps - 1 && (
                                    <div
                                        className="w-8 flex items-center justify-center transition-opacity duration-500"
                                        style={{ opacity: separatorOpacity }}
                                    >
                                        <div className={`w-3 h-[1px] rounded-full transition-colors duration-300 ${
                                            // Si el paso actual ES completado (y no es el último), pintar separador
                                            // O si estamos entre dos completados.
                                            (isCompleted && completedSteps.includes(stepNumber + 1)) ? "bg-purple-500/50" : "bg-slate-200"
                                            }`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Estilos para animación custom */}
                <style jsx>{`
        .animate-ping-slow {
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
            75%, 100% {
                transform: scale(1.6);
                opacity: 0;
            }
        }
      `}</style>

                {/* Puntero/Indicador inferior estático */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full opacity-60 shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
            </div>
        </div>
    );
}
