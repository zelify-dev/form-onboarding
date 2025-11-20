"use client";

import { useEffect, useRef, useMemo } from "react";

interface AnimatedQuestionProps {
  question: string;
  isExiting: boolean;
  isGoingBack?: boolean;
  isFirstQuestion?: boolean;
  animationsEnabled?: boolean;
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

const LATERAL_PHASE1_DELAY_PER_LETTER = 3;   // ms
const LATERAL_PHASE1_DURATION = 0.035;       // s
const LATERAL_PHASE2_DURATION = 0.3;         // s
const LATERAL_PHASE3_DURATION = 0.15;        // s

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
  isFirstQuestion = false,
  animationsEnabled = true,
  onAnimationComplete,
}: AnimatedQuestionProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  
  // Mantener la referencia más reciente de onAnimationComplete
  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);
  
  // Memoizar config para que solo cambie cuando question o isExiting cambien
  const config = useMemo(() => getConfig(question, isExiting), [question, isExiting]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Si las animaciones están desactivadas, usar solo fade in/out simple
    if (!animationsEnabled) {
      const container = containerRef.current;
      
      if (isExiting) {
        // Fade out simple
        container.style.transition = 'opacity 0.3s ease-out';
        container.style.opacity = '0';
        
        const timer = setTimeout(() => {
          onAnimationCompleteRef.current();
        }, 300);
        timeoutsRef.current.push(timer);
      } else {
        // Fade in simple
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.3s ease-in';
        
        // Forzar reflow
        void container.offsetHeight;
        
        container.style.opacity = '1';
        
        const timer = setTimeout(() => {
          onAnimationCompleteRef.current();
        }, 300);
        timeoutsRef.current.push(timer);
      }
      
      return () => {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      };
    }

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
      if (isFirstQuestion) {
        // Primera pregunta: animación original desde el centro
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
      } else {
        // Preguntas siguientes: animación desde laterales (desktop) o arriba/abajo (móvil)
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const containerRect = containerRef.current?.getBoundingClientRect();
        
        if (!containerRect) return;
        
        // Detectar si es móvil (ancho menor a 768px)
        const isMobile = screenWidth < 768;
        
        // Calcular el centro de la pantalla completa (no del contenedor)
        const screenCenterX = screenWidth/1.48;
        const screenCenterY = screenHeight / 2;
        
        // Calcular el centro del contenedor (necesario para convertir posiciones absolutas a relativas)
        const containerCenterX = containerRect.left + (containerRect.width / 2);
        const containerCenterY = containerRect.top + (containerRect.height / 2);
        
        // Calcular la distancia desde el centro de la pantalla hasta los laterales (desktop) o arriba/abajo (móvil)
        const offsetDistance = isMobile 
          ? screenHeight * 0.35  // 35% de la altura para móvil (arriba/abajo)
          : screenWidth * 0.30;  // 30% del ancho para desktop (laterales)
        
        // Offset adicional solo para el grupo de la derecha (desktop) o abajo (móvil)
        const rightGroupOffset = isMobile ? 30 : 50; // Píxeles adicionales
        
        // Guardar posiciones finales de cada letra antes de moverlas
        const finalPositions: Array<{ x: number; y: number }> = [];
        letters.forEach((letter) => {
          const rect = letter.getBoundingClientRect();
          if (containerRect) {
            finalPositions.push({
              x: rect.left - containerRect.left,
              y: rect.top - containerRect.top,
            });
          } else {
            finalPositions.push({ x: 0, y: 0 });
          }
        });
        
        // Separar letras en dos grupos: 
        // Desktop: pares a la izquierda, impares a la derecha
        // Móvil: pares arriba, impares abajo
        const leftLetters: Array<{ letter: HTMLElement; index: number }> = [];
        const rightLetters: Array<{ letter: HTMLElement; index: number }> = [];
        
        letters.forEach((letter, i) => {
          const char = question[i];
          if (!char) return;
          
          if (i % 2 === 0) {
            // Letras pares (índices 0, 2, 4, 6...): izquierda (desktop) o arriba (móvil)
            leftLetters.push({ letter, index: i });
          } else {
            // Letras impares (índices 1, 3, 5, 7...): derecha (desktop) o abajo (móvil)
            rightLetters.push({ letter, index: i });
          }
        });
        
        // Ordenar letras de la derecha en orden inverso (última primero)
        rightLetters.sort((a, b) => b.index - a.index);
        
        // Función para animar una letra
        const animateLetter = (
          letter: HTMLElement,
          index: number,
          fromLeft: boolean,
          positionInGroup: number,
          totalInGroup: number
        ) => {
          const char = question[index];
          if (!char) return;
          
          let sideOffset: number;
          let verticalOffset: number;
          
          if (isMobile) {
            // Móvil: arriba y abajo
            // fromLeft = true significa arriba, fromLeft = false significa abajo
            const initialY = fromLeft 
              ? screenCenterY - offsetDistance  // Arriba del centro (sin offset adicional)
              : screenCenterY + offsetDistance + rightGroupOffset; // Abajo del centro + offset adicional
            
            // Convertir a posición relativa al contenedor
            verticalOffset = initialY - containerCenterY;
            
            // Posición horizontal aleatoria
            sideOffset = (Math.sin(index * 0.7) * containerRect.width * 0.3) + (Math.random() - 0.5) * containerRect.width * 0.2;
          } else {
            // Desktop: izquierda y derecha
            const initialX = fromLeft 
              ? screenCenterX - offsetDistance  // Izquierda del centro de la pantalla (sin offset adicional)
              : screenCenterX + offsetDistance + rightGroupOffset; // Derecha del centro de la pantalla + offset adicional
            
            // Convertir a posición relativa al contenedor para usar con transform
            sideOffset = initialX - containerCenterX;
            
            // Posición vertical aleatoria en los laterales
            verticalOffset = (Math.sin(index * 0.7) * screenHeight * 0.25) + (Math.random() - 0.5) * screenHeight * 0.15;
          }
          
          // Rotación inicial aleatoria
          const seed = index * 100 + char.charCodeAt(0);
          const initialRotation = (Math.sin(seed) * 180) + (Math.random() - 0.5) * 60;
          
          // Calcular delay basado en la posición dentro del grupo
          // Las letras aparecen en orden desde su extremo correspondiente
          const phase1Delay = positionInGroup * 5; // Delay basado en posición en el grupo (10ms por letra - rápido)
          const phase1Duration = 0; // Tiempo flotando en laterales (0.1s - rápido)
          
          // Fase 2: Viajar hacia el centro
          const phase2Delay = phase1Delay + phase1Duration * 500;
          const phase2Duration = 0.3; // Tiempo viajando al centro (0.8s - rápido para construir la pregunta)
          
          // Estado inicial: fuera de pantalla en los laterales
          letter.style.position = 'absolute';
          letter.style.transform = `translate(${sideOffset}px, ${verticalOffset}px) rotate(${initialRotation}deg) scale(0.4)`;
          letter.style.opacity = "0";
          
          // Forzar reflow
          void letter.offsetHeight;
          
          // Fase 1: Aparecer y flotar en los laterales (desktop) o arriba/abajo (móvil)
          const timeout1 = setTimeout(() => {
            letter.style.transition = `transform ${LATERAL_PHASE1_DURATION}s ease-out, opacity ${LATERAL_PHASE1_DURATION * 0.6}s ease-out`;
            let floatX: number;
            let floatY: number;
            
            if (isMobile) {
              // Móvil: flotación horizontal (izquierda/derecha)
              floatX = sideOffset + (Math.sin(index * 0.3) * 20) + (Math.random() - 0.5) * 15;
              floatY = verticalOffset + (fromLeft ? -20 : 20) + (Math.cos(index * 0.4) * 15);
            } else {
              // Desktop: flotación vertical (arriba/abajo)
              floatX = sideOffset + (fromLeft ? 30 : -30) + (Math.sin(index * 0.3) * 20);
              floatY = verticalOffset + (Math.cos(index * 0.4) * 25);
            }
            
            letter.style.transform = `translate(${floatX}px, ${floatY}px) rotate(${initialRotation * 0.6}deg) scale(0.6)`;
            letter.style.opacity = "0.7";
          }, phase1Delay);
          timeoutsRef.current.push(timeout1);
          
          // Fase 2: Viajar hacia la posición final
          const timeout2 = setTimeout(() => {
            const finalPos = finalPositions[index] || { x: 0, y: 0 };
            letter.style.transition = `transform ${LATERAL_PHASE2_DURATION}s cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${LATERAL_PHASE2_DURATION * 0.4}s ease-in`;
            letter.style.transform = `translate(${finalPos.x}px, ${finalPos.y}px) rotate(0deg) scale(1)`;
            letter.style.opacity = "1";
          }, phase2Delay);
          timeoutsRef.current.push(timeout2);
          
          // Fase 3: Restaurar posición relativa y ajuste final
          const timeout3 = setTimeout(() => {
            letter.style.position = '';
            letter.style.transition = `transform ${LATERAL_PHASE3_DURATION}s ease-out`;
            letter.style.transform = `translate(0, 0) rotate(0deg) scale(1)`;
          }, phase2Delay + LATERAL_PHASE2_DURATION * 1000);
          timeoutsRef.current.push(timeout3);
        };
        
        // Animar letras de la izquierda (de izquierda a derecha)
        leftLetters.forEach(({ letter, index }, positionInGroup) => {
          animateLetter(letter, index, true, positionInGroup, leftLetters.length);
        });
        
        // Animar letras de la derecha (de derecha a izquierda)
        rightLetters.forEach(({ letter, index }, positionInGroup) => {
          animateLetter(letter, index, false, positionInGroup, rightLetters.length);
        });
      }
    }

    // Calcular tiempo total de animación
    let totalTime: number;
    if (isExiting) {
      totalTime = config.duracion * 1000 + question.length * config.delay;
    } else {
      if (isFirstQuestion) {
        // Primera pregunta: animación original
        totalTime = config.duracion * 1000 + question.length * config.delay;
      } else {
        // Preguntas siguientes: animación desde laterales (ambos extremos)
        // Calcular el máximo delay entre ambos grupos (izquierda y derecha)
        const leftCount = Math.ceil(question.length / 2);
        const rightCount = Math.floor(question.length / 2);
        const maxDelay = Math.max(leftCount, rightCount) * LATERAL_PHASE1_DELAY_PER_LETTER;
        const phase1Ms = LATERAL_PHASE1_DURATION * 1000;
        const phase2Ms = LATERAL_PHASE2_DURATION * 1000;
        const phase3Ms = LATERAL_PHASE3_DURATION * 1000;
        totalTime = maxDelay + phase1Ms + phase2Ms + phase3Ms;
      }
    }
    
    const timer = setTimeout(() => {
      onAnimationCompleteRef.current();
    }, totalTime);
    timeoutsRef.current.push(timer);

    return () => {
      clearTimeout(timer);
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, [question, isExiting, isFirstQuestion, config, animationsEnabled]);

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
      className="font-medium text-white text-left mb-4 sm:mb-6 md:mb-8 lg:mb-10 relative"
      style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.75rem)' }}
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
