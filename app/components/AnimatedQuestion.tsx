"use client";

import { useEffect, useRef } from "react";

interface AnimatedQuestionProps {
  question: string;
  isExiting: boolean;
  onAnimationComplete: () => void;
}

// Configuración básica
const ENTRADA = {
  distancia: 1000,      // px de dispersión
  rotacion: 180,        // grados
  escala: 0.3,          // tamaño inicial
  delay: 28,            // ms entre letras
  duracion: 0.75        // segundos
};

const SALIDA = {
  distancia: 1000,
  rotacion: 180,
  escala: 0.3,
  delay: 14,            // más rápido que entrada
  duracion: 0.4         // más corto que entrada
};

// Ajustar delay y duración según longitud del texto
function getConfig(texto: string, esSalida: boolean) {
  const baseConfig = esSalida ? SALIDA : ENTRADA;
  const longitud = texto.length;
  
  // Textos largos: delays más cortos y duraciones menores
  // Textos cortos: delays más largos para que el efecto sea más visible
  const factor = longitud > 50 ? 0.7 : longitud > 30 ? 0.85 : 1;
  
  return {
    ...baseConfig,
    delay: baseConfig.delay * factor,
    duracion: baseConfig.duracion * factor
  };
}

// Función para calcular posición aleatoria determinística
function getRandomPosition(letra: string, indice: number, config: typeof ENTRADA) {
  const charCode = letra.charCodeAt(0);
  const seed = indice * 1000 + charCode;
  
  const x = (Math.sin(seed) - 0.5) * config.distancia;
  const y = (Math.sin(seed + 1) - 0.5) * config.distancia;
  const rotacion = (Math.sin(seed + 2) - 0.5) * config.rotacion;
  
  return { x, y, rotacion };
}

export default function AnimatedQuestion({
  question,
  isExiting,
  onAnimationComplete,
}: AnimatedQuestionProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const config = getConfig(question, isExiting);

  useEffect(() => {
    if (!containerRef.current) return;

    const letters = containerRef.current.querySelectorAll("span");
    const easing = "cubic-bezier(0.34, 1.56, 0.64, 1)";

    if (isExiting) {
      // Animación de salida
      letters.forEach((letter, i) => {
        const { x, y, rotacion } = getRandomPosition(question[i], i, config);
        const delay = i * config.delay;
        
        (letter as HTMLElement).style.transition = `transform ${config.duracion}s ${easing} ${delay}ms, opacity ${config.duracion}s ${easing} ${delay}ms`;
        
        // Forzar reflow
        void (letter as HTMLElement).offsetHeight;
        
        // Aplicar transformación de salida
        (letter as HTMLElement).style.transform = `translate(${x}px, ${y}px) rotate(${rotacion}deg) scale(${config.escala})`;
        (letter as HTMLElement).style.opacity = "0";
      });
    } else {
      // Animación de entrada
      letters.forEach((letter, i) => {
        const { x, y, rotacion } = getRandomPosition(question[i], i, config);
        const delay = i * config.delay;
        
        // Estado inicial
        (letter as HTMLElement).style.transform = `translate(${x}px, ${y}px) rotate(${rotacion}deg) scale(${config.escala})`;
        (letter as HTMLElement).style.opacity = "0";
        
        // Forzar reflow
        void (letter as HTMLElement).offsetHeight;
        
        // Aplicar transición y estado final
        (letter as HTMLElement).style.transition = `transform ${config.duracion}s ${easing} ${delay}ms, opacity ${config.duracion}s ${easing} ${delay}ms`;
        (letter as HTMLElement).style.transform = `translate(0, 0) rotate(0) scale(1)`;
        (letter as HTMLElement).style.opacity = "1";
      });
    }

    // Calcular tiempo total de animación
    const totalTime = config.duracion * 1000 + question.length * config.delay;
    
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, totalTime);

    return () => clearTimeout(timer);
  }, [question, isExiting, config, onAnimationComplete]);

  return (
    <h2
      ref={containerRef}
      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-white text-left mb-6 sm:mb-8 md:mb-10 lg:mb-12"
    >
      {question.split("").map((letra, i) => (
        <span
          key={`${question}-${i}`}
          className="inline-block"
        >
          {letra === " " ? "\u00A0" : letra}
        </span>
      ))}
    </h2>
  );
}

