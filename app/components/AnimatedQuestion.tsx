"use client";

import { useEffect, useRef } from "react";

interface AnimatedQuestionProps {
  question: string;
  isExiting: boolean;
  isGoingBack?: boolean;
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
  isGoingBack = false,
  onAnimationComplete,
}: AnimatedQuestionProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const config = getConfig(question, isExiting);

  useEffect(() => {
    if (!containerRef.current) return;

    // Filtrar solo los spans que contienen letras individuales (no los contenedores de palabras)
    const allSpans = containerRef.current.querySelectorAll("span[data-letter]");
    const letters: HTMLElement[] = Array.from(allSpans) as HTMLElement[];
    
    // Ordenar las letras según su posición en el DOM para asegurar el orden correcto
    letters.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });

    const easing = "cubic-bezier(0.34, 1.56, 0.64, 1)";

    if (isExiting) {
      // Animación de salida
      letters.forEach((letter, i) => {
        const char = question[i];
        if (!char) return;
        const { x, y, rotacion } = getRandomPosition(char, i, config);
        const delay = i * config.delay;
        
        letter.style.transition = `transform ${config.duracion}s ${easing} ${delay}ms, opacity ${config.duracion}s ${easing} ${delay}ms`;
        
        // Forzar reflow
        void letter.offsetHeight;
        
        // Aplicar transformación de salida
        letter.style.transform = `translate(${x}px, ${y}px) rotate(${rotacion}deg) scale(${config.escala})`;
        letter.style.opacity = "0";
      });
    } else {
      // Animación de entrada
      letters.forEach((letter, i) => {
        const char = question[i];
        if (!char) return;
        const { x, y, rotacion } = getRandomPosition(char, i, config);
        const delay = i * config.delay;
        
        // Estado inicial
        letter.style.transform = `translate(${x}px, ${y}px) rotate(${rotacion}deg) scale(${config.escala})`;
        letter.style.opacity = "0";
        
        // Forzar reflow
        void letter.offsetHeight;
        
        // Aplicar transición y estado final
        letter.style.transition = `transform ${config.duracion}s ${easing} ${delay}ms, opacity ${config.duracion}s ${easing} ${delay}ms`;
        letter.style.transform = `translate(0, 0) rotate(0) scale(1)`;
        letter.style.opacity = "1";
      });
    }

    // Calcular tiempo total de animación
    const totalTime = config.duracion * 1000 + question.length * config.delay;
    
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, totalTime);

    return () => clearTimeout(timer);
  }, [question, isExiting, config, onAnimationComplete]);

  // Dividir el texto en palabras para evitar que se corten
  const palabras = question.split(/(\s+)/);
  let indiceGlobal = 0;

  /* 
    ⚙️ CONFIGURACIÓN DE TAMAÑO DE TEXTO DE LA PREGUNTA
    Puedes modificar el tamaño aquí cambiando el valor de 'fontSize' en el style del h2.
    
    Opción 1: Usar clamp() (recomendado para responsividad)
    - clamp(min, preferido, max) - se adapta al tamaño de pantalla
    - Ejemplo más grande: clamp(1.125rem, 3vw, 2rem)
    - Ejemplo más pequeño: clamp(0.875rem, 2vw, 1.5rem)
    
    Opción 2: Usar clases de Tailwind en className
    - Agregar: text-lg sm:text-xl md:text-2xl lg:text-3xl
    - Tamaños disponibles: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, etc.
    - Ejemplo más grande: text-xl sm:text-2xl md:text-3xl lg:text-4xl
    - Ejemplo más pequeño: text-base sm:text-lg md:text-xl lg:text-2xl
    
    Opción 3: Tamaño fijo en px
    - style={{ fontSize: '18px' }} o fontSize: '20px', etc.
  */

  return (
    <h2
      ref={containerRef}
      className="font-medium text-white text-left mb-4 sm:mb-6 md:mb-8 lg:mb-10"
      style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.75rem)' }}
    >
      {palabras.map((palabra, palabraIndex) => {
        const esEspacio = /^\s+$/.test(palabra);
        const letras = palabra.split("");
        const inicioIndice = indiceGlobal;
        
        // Calcular los índices antes de renderizar
        const contenido = letras.map((letra, letraIndex) => {
          const indice = inicioIndice + letraIndex;
          return { letra, indice };
        });
        
        // Actualizar el índice global
        indiceGlobal += letras.length;

        // Si es un espacio, mantenerlo como está
        if (esEspacio) {
          return (
            <span key={`space-${palabraIndex}`} className="inline-block whitespace-pre">
              {palabra}
            </span>
          );
        }

        // Agrupar letras de cada palabra en un contenedor inline-block
        return (
          <span
            key={`word-${palabraIndex}`}
            className="inline-block whitespace-nowrap"
          >
            {contenido.map(({ letra, indice }) => (
              <span
                key={`${question}-${indice}`}
                data-letter="true"
                className="inline-block"
              >
                {letra}
              </span>
            ))}
          </span>
        );
      })}
    </h2>
  );
}

