'use client';

import { useEffect, useState, useMemo } from 'react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  isExiting?: boolean; // Si es true, anima la salida (dispersión)
  onExitComplete?: () => void; // Callback cuando la animación de salida termina
}

// ============================================
// CONFIGURACIÓN DE ANIMACIÓN DE ENTRADA - Personaliza aquí
// ============================================
const ANIMATION_CONFIG = {
  // Distancia máxima desde donde aparecen las letras (en píxeles)
  MAX_DISTANCE_X: 1000, // Distancia horizontal máxima
  MAX_DISTANCE_Y: 1000, // Distancia vertical máxima
  
  // Rotación máxima inicial de las letras (en grados)
  MAX_ROTATION: 180,
  
  // Escala inicial de las letras (0.1 = muy pequeño, 1 = tamaño normal)
  INITIAL_SCALE: 0.3,
  
  // Delay base entre cada letra (en milisegundos)
  // Se ajusta dinámicamente según la longitud del texto
  BASE_STAGGER_DELAY: 28,
  
  // Delay mínimo entre letras para textos muy largos (en milisegundos)
  MIN_STAGGER_DELAY: 14,
  
  // Delay máximo entre letras para textos cortos (en milisegundos)
  MAX_STAGGER_DELAY: 38,
  
  // Longitud de texto que se considera "largo" (ajusta según necesites)
  LONG_TEXT_THRESHOLD: 100,
  
  // Delay antes de iniciar la animación (en milisegundos)
  INITIAL_DELAY: 180,
  
  // Duración base de la animación de opacidad (en segundos)
  // Se ajusta dinámicamente según la longitud
  BASE_OPACITY_DURATION: 0.75,
  
  // Duración base de la animación de transformación (en segundos)
  // Se ajusta dinámicamente según la longitud
  BASE_TRANSFORM_DURATION: 0.55,
  
  // Curva de animación (easing)
  // Opciones comunes: 'ease', 'ease-in', 'ease-out', 'ease-in-out'
  // O usa cubic-bezier personalizado: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  EASING: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const;

// Función para calcular delay dinámico según longitud del texto
function getDynamicStaggerDelay(textLength: number): number {
  if (textLength > ANIMATION_CONFIG.LONG_TEXT_THRESHOLD) {
    // Para textos largos, usa delay mínimo
    return ANIMATION_CONFIG.MIN_STAGGER_DELAY;
  } else if (textLength < 50) {
    // Para textos cortos, usa delay máximo
    return ANIMATION_CONFIG.MAX_STAGGER_DELAY;
  } else {
    // Para textos medianos, interpola entre min y max
    const ratio = (textLength - 50) / (ANIMATION_CONFIG.LONG_TEXT_THRESHOLD - 50);
    return ANIMATION_CONFIG.MAX_STAGGER_DELAY - 
           (ratio * (ANIMATION_CONFIG.MAX_STAGGER_DELAY - ANIMATION_CONFIG.MIN_STAGGER_DELAY));
  }
}

// Función para calcular duración dinámica según longitud del texto
function getDynamicDuration(textLength: number, baseDuration: number): number {
  if (textLength > ANIMATION_CONFIG.LONG_TEXT_THRESHOLD) {
    // Para textos largos, reduce la duración base
    return baseDuration * 0.7;
  } else if (textLength < 50) {
    // Para textos cortos, mantiene la duración base
    return baseDuration;
  } else {
    // Para textos medianos, interpola
    const ratio = (textLength - 50) / (ANIMATION_CONFIG.LONG_TEXT_THRESHOLD - 50);
    return baseDuration * (1 - ratio * 0.3);
  }
}

// ============================================
// CONFIGURACIÓN DE ANIMACIÓN DE SALIDA - Personaliza aquí
// ============================================
const EXIT_ANIMATION_CONFIG = {
  // Distancia máxima hacia donde se dispersan las letras (en píxeles)
  MAX_DISTANCE_X: 1000, // Distancia horizontal máxima
  MAX_DISTANCE_Y: 1000, // Distancia vertical máxima
  
  // Rotación máxima de las letras al salir (en grados)
  MAX_ROTATION: 180,
  
  // Escala final de las letras al salir (0.1 = muy pequeño, 1 = tamaño normal)
  FINAL_SCALE: 0.3,
  
  // Delay base entre cada letra (en milisegundos) - más bajo = más rápido
  // Se ajusta dinámicamente según la longitud del texto
  BASE_STAGGER_DELAY: 14,
  
  // Delay mínimo entre letras para textos muy largos (en milisegundos)
  MIN_STAGGER_DELAY: 7,
  
  // Delay máximo entre letras para textos cortos (en milisegundos)
  MAX_STAGGER_DELAY: 20,
  
  // Duración base de la animación de opacidad (en segundos)
  BASE_OPACITY_DURATION: 0.4,
  
  // Duración base de la animación de transformación (en segundos)
  BASE_TRANSFORM_DURATION: 0.35,
  
  // Curva de animación (easing)
  // Opciones comunes: 'ease', 'ease-in', 'ease-out', 'ease-in-out'
  // O usa cubic-bezier personalizado: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  EASING: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Easing más rápido
} as const;

// Función pseudo-aleatoria determinística basada en semilla
// (garantiza consistencia entre servidor y cliente)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function AnimatedText({ 
  text, 
  className = '', 
  isExiting = false,
  onExitComplete 
}: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Reinicia el estado cuando cambia el texto
    setIsVisible(false);
    // Inicia la animación después de que el componente se monte o cambie el texto
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, ANIMATION_CONFIG.INITIAL_DELAY);
    return () => clearTimeout(timer);
  }, [text]);

  // Calcula valores dinámicos basados en la longitud del texto
  const staggerDelay = useMemo(() => getDynamicStaggerDelay(text.length), [text.length]);
  const exitStaggerDelay = useMemo(() => {
    const textLength = text.length;
    if (textLength > ANIMATION_CONFIG.LONG_TEXT_THRESHOLD) {
      return EXIT_ANIMATION_CONFIG.MIN_STAGGER_DELAY;
    } else if (textLength < 50) {
      return EXIT_ANIMATION_CONFIG.MAX_STAGGER_DELAY;
    } else {
      const ratio = (textLength - 50) / (ANIMATION_CONFIG.LONG_TEXT_THRESHOLD - 50);
      return EXIT_ANIMATION_CONFIG.MAX_STAGGER_DELAY - 
             (ratio * (EXIT_ANIMATION_CONFIG.MAX_STAGGER_DELAY - EXIT_ANIMATION_CONFIG.MIN_STAGGER_DELAY));
    }
  }, [text.length]);
  
  const opacityDuration = useMemo(() => getDynamicDuration(text.length, ANIMATION_CONFIG.BASE_OPACITY_DURATION), [text.length]);
  const transformDuration = useMemo(() => getDynamicDuration(text.length, ANIMATION_CONFIG.BASE_TRANSFORM_DURATION), [text.length]);
  const exitOpacityDuration = useMemo(() => getDynamicDuration(text.length, EXIT_ANIMATION_CONFIG.BASE_OPACITY_DURATION), [text.length]);
  const exitTransformDuration = useMemo(() => getDynamicDuration(text.length, EXIT_ANIMATION_CONFIG.BASE_TRANSFORM_DURATION), [text.length]);

  // Maneja la animación de salida
  useEffect(() => {
    if (isExiting) {
      setIsVisible(false);
      // Calcula el tiempo total de la animación de salida usando valores dinámicos
      const totalDuration = 
        (text.length * exitStaggerDelay) + 
        (exitTransformDuration * 1000);
      
      const timer = setTimeout(() => {
        onExitComplete?.();
      }, totalDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isExiting, text.length, onExitComplete, exitStaggerDelay, exitTransformDuration]);

  // Calcula posiciones iniciales de cada letra agrupadas por palabras
  const wordsData = useMemo(() => {
    // Divide el texto en palabras y espacios
    const words = text.split(/(\s+)/);
    let charIndex = 0;
    // Calcula el delay dinámico para esta longitud de texto
    const currentStaggerDelay = getDynamicStaggerDelay(text.length);
    
    return words.map((word, wordIndex) => {
      const isSpace = /^\s+$/.test(word);
      const wordChars = word.split('').map((char, charPosInWord) => {
        const index = charIndex++;
        // Genera semilla determinística basada en índice y código del carácter
        const seed = index * 1000 + char.charCodeAt(0);
        
        // Calcula posición inicial aleatoria pero determinística
        const randomX = (seededRandom(seed) - 0.5) * ANIMATION_CONFIG.MAX_DISTANCE_X;
        const randomY = (seededRandom(seed + 1) - 0.5) * ANIMATION_CONFIG.MAX_DISTANCE_Y;
        const randomRotation = (seededRandom(seed + 2) - 0.5) * ANIMATION_CONFIG.MAX_ROTATION;
        
        // Delay escalonado dinámico para cada letra
        const delay = index * currentStaggerDelay;
        
        return {
          char,
          index,
          randomX,
          randomY,
          randomRotation,
          delay,
        };
      });
      
      return {
        word,
        isSpace,
        wordIndex,
        chars: wordChars,
      };
    });
  }, [text]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span 
      className={`inline-block ${className}`}
      style={{
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
        whiteSpace: 'normal',
        lineHeight: '1.5',
      }}
    >
      {wordsData.map(({ word, isSpace, wordIndex, chars }) => (
        <span
          key={wordIndex}
          style={{
            whiteSpace: isSpace ? 'pre' : 'nowrap',
            wordBreak: 'keep-all',
            display: 'inline-block',
          }}
        >
          {chars.map(({ char, index, randomX, randomY, randomRotation, delay }) => (
            <span
              key={index}
              className="inline-block"
              style={{
                // Opacidad: invisible al inicio/salida, visible cuando está visible
                opacity: isVisible && !isExiting ? 1 : 0,
                
                // Transformación: 
                // - Si está visible y no saliendo: posición final (centro)
                // - Si está saliendo: posición dispersa usando configuración de salida
                // - Si no está visible: posición inicial dispersa usando configuración de entrada
                transform: isVisible && !isExiting
                  ? 'translate(0, 0) rotate(0deg) scale(1)' // Posición final (centro)
                  : `translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg) scale(${isExiting ? EXIT_ANIMATION_CONFIG.FINAL_SCALE : ANIMATION_CONFIG.INITIAL_SCALE})`, // Posición dispersa
                
                // Transición suave con delay escalonado dinámico
                // En la salida, usa configuración de salida (más rápida) con valores dinámicos
                // En la entrada, usa configuración de entrada con valores dinámicos
                transition: isExiting
                  ? `opacity ${exitOpacityDuration}s ${EXIT_ANIMATION_CONFIG.EASING} ${(text.length - index - 1) * exitStaggerDelay}ms, transform ${exitTransformDuration}s ${EXIT_ANIMATION_CONFIG.EASING} ${(text.length - index - 1) * exitStaggerDelay}ms`
                  : `opacity ${opacityDuration}s ${ANIMATION_CONFIG.EASING} ${delay}ms, transform ${transformDuration}s ${ANIMATION_CONFIG.EASING} ${delay}ms`,
                
                // Optimización de rendimiento
                willChange: isVisible || isExiting ? 'transform, opacity' : 'auto',
              }}
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

