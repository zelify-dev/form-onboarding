"use client";

import { useEffect, useState, useRef } from "react";

interface TokenWalletProps {
    balance: number;
    addedAmount: number; // Cantidad recién agregada para animar
    onAnimationComplete: () => void;
}

export default function TokenWallet({
    balance,
    addedAmount,
    onAnimationComplete,
}: TokenWalletProps) {
    const [displayBalance, setDisplayBalance] = useState(balance);
    const [isAnimating, setIsAnimating] = useState(false);
    const [popups, setPopups] = useState<Array<{ id: number; amount: number }>>([]);
    const popupIdRef = useRef(0);

    // Efecto para animar el conteo
    useEffect(() => {
        if (balance !== displayBalance) {
            // Si la diferencia es grande, incrementar rápido, si es pequeña, lento
            const diff = balance - displayBalance;
            const step = Math.ceil(diff / 20) || 1; // Terminar en ~20 frames

            const timer = requestAnimationFrame(() => {
                if (displayBalance < balance) {
                    setDisplayBalance(Math.min(balance, displayBalance + step));
                } else {
                    setDisplayBalance(balance); // Sincronización final
                }
            });
            return () => cancelAnimationFrame(timer);
        }
    }, [balance, displayBalance]);

    // Efecto para detectar cuando se agregan (o quitan) fondos
    useEffect(() => {
        if (addedAmount !== 0) { // Ahora permitimos valores negativos
            setIsAnimating(true);

            // Crear nuevo popup visual
            const newPopup = { id: popupIdRef.current++, amount: addedAmount };
            setPopups((prev) => [...prev, newPopup]);

            // Limpiar popup después de la animación
            setTimeout(() => {
                setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
                setIsAnimating(false);
                onAnimationComplete();
            }, 2000);
        }
    }, [addedAmount, onAnimationComplete]);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2">
            {/* Popups de ganancia flotantes - Alineados a la derecha */}
            <div className="absolute bottom-full right-10 mb-2 flex flex-col items-center gap-1 pointer-events-none">
                {popups.map((popup) => (
                    <div
                        key={popup.id}
                        className={`animate-float-up font-bold text-xl sm:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${popup.amount > 0 ? "text-green-400" : "text-red-400"
                            }`}
                    >
                        {popup.amount > 0 ? "+" : ""}{popup.amount}
                    </div>
                ))}
            </div>

            {/* Billetera Visual */}
            <div
                className={`
            group relative flex items-center gap-3 px-4 py-3 rounded-2xl 
            bg-[#13111C]/90 backdrop-blur-md border border-white/10 shadow-xl 
            transition-all duration-300 cursor-help
            ${isAnimating ? "scale-105 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]" : "hover:border-purple-500/30"}
        `}
            >
                {/* Tooltip Informativo */}
                <div className="absolute bottom-full right-0 mb-4 w-64 p-3 rounded-xl bg-[#0F0A1F] border border-purple-500/30 shadow-2xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-50">
                    <div className="text-xs text-white/90 leading-relaxed text-center">
                        <span className="text-purple-400 font-bold block mb-1">¡Gana Tokens! 🚀</span>
                        Entre más detalladas y de valor sean tus respuestas, ganarás más tokens para usar en nuestros servicios futuros.
                    </div>
                    {/* Triángulo/Flecha */}
                    <div className="absolute -bottom-1 right-8 w-2 h-2 bg-[#0F0A1F] border-r border-b border-purple-500/30 rotate-45"></div>
                </div>

                {/* Icono Alaiza (Futurista) */}
                <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                    {/* Logo SVG */}
                    <div className={`
                absolute inset-0 flex items-center justify-center
                ${isAnimating ? "animate-spin-slow" : ""}
            `}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                            {/* Asterisco de 8 puntas (8-pointed star constructed from overlapping squares/rects logic simplified) */}
                            <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                {/* Cruz + */}
                                <path d="M12 4V20" />
                                <path d="M4 12H20" />
                                {/* Cruz X */}
                                <path d="M6.34 6.34L17.66 17.66" />
                                <path d="M6.34 17.66L17.66 6.34" />
                            </g>
                            {/* Centro sólido */}
                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                        </svg>
                    </div>
                    {/* Brillo detrás */}
                    <div className="absolute inset-0 bg-purple-600/20 blur-lg rounded-full -z-10 animate-pulse" />
                </div>

                {/* Texto de Balance */}
                <div className="flex flex-col">
                    <span className="text-white/50 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                        Tus Tokens
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl sm:text-2xl font-bold font-mono transition-colors duration-300 ${isAnimating ? "text-purple-400" : "text-white"}`}>
                            {displayBalance.toLocaleString()}
                        </span>
                        <span className="text-white/40 text-xs">tkn</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { transform: translateY(-10px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-40px) scale(1); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
        .animate-spin-slow {
            animation: spin 3s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
