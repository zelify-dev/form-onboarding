"use client";

import React, { useEffect, useState, useRef } from "react";

interface HexagonLoaderProps {
  message?: string;
}

// ============================================
// VARIABLES DE CONFIGURACIÓN - MODIFICA AQUÍ
// ============================================

// Colores del fondo
const BACKGROUND_COLOR = "rgba(26, 26, 33, 0.2)"; // Color de fondo oscuro
const BACKGROUND_OPACITY = 0.2; // Opacidad del fondo (0-100)
const BACKDROP_BLUR = "sm"; // Nivel de blur: "sm", "md", "lg", "xl", "2xl", "3xl"

// Tamaños del hexágono (en Tailwind: w-32=128px, w-40=160px, w-48=192px)
const HEXAGON_SIZE_MOBILE = "w-32 h-32"; // Tamaño en móvil
const HEXAGON_SIZE_TABLET = "sm:w-40 sm:h-40"; // Tamaño en tablet
const HEXAGON_SIZE_DESKTOP = "md:w-48 md:h-48"; // Tamaño en desktop

// Colores del hexágono
const HEXAGON_FILL = "rgba(255, 255, 255, 0)"; // Color de relleno del hexágono (base)
const HEXAGON_STROKE = "rgba(156, 86, 160, 0)"; // Color del borde del hexágono
const HEXAGON_STROKE_WIDTH = "2"; // Grosor del borde

// Configuración del ícono de Alaiza (asterisco de 8 puntas)
const ICON_COLOR = "rgb(155, 39, 176)"; // Color púrpura intenso del ícono
const ICON_SIZE = 30; // Tamaño del ícono (radio desde el centro, en unidades del viewBox)
const ICON_ARM_WIDTH = 6; // Ancho de cada brazo del asterisco
const ICON_ARM_LENGTH = 20; // Longitud de cada brazo desde el centro
const ICON_CENTER_X = 60; // Centro X del viewBox
const ICON_CENTER_Y = 50; // Centro Y del viewBox

// Animación de partículas/letras
const PARTICLE_COLOR = "rgba(200, 0, 255, 0.5)"; // Color de las partículas (verde)
const PARTICLE_COUNT = 25; // Cantidad de partículas simultáneas
const PARTICLE_SIZE = "8px"; // Tamaño de cada partícula
const PARTICLE_ANIMATION_DURATION = "1.1s"; // Duración del viaje de cada partícula
const PARTICLE_DELAY_RANGE = 1500; // Rango de delay aleatorio en ms (0-2000ms)

// Colores de la línea de progreso
const PROGRESS_COLOR = "rgba(217, 0, 255, 0.5)"; // Color de la línea de progreso (verde)
const PROGRESS_STROKE_WIDTH = "3"; // Grosor de la línea de progreso

// Efecto glow
const GLOW_INTENSITY = "3"; // Intensidad del glow (3 = suave, 5 = intenso, 7 = muy intenso)

// Animación
const ANIMATION_DURATION = "20s"; // Duración de la animación (más = más lento)
const ANIMATION_TIMING = "ease-in-out"; // Tipo de animación: "linear", "ease-in-out", "ease-in", "ease-out"

// Calcular el perímetro real del hexágono para que la velocidad coincida con la duración
// Puntos del hexágono: (60,10) (100,30) (100,70) (60,90) (20,70) (20,30)
// Calculamos la distancia entre cada par de puntos consecutivos
const calculateHexagonPerimeter = () => {
  const points = [
    [60, 10], [100, 30], [100, 70], [60, 90], [20, 70], [20, 30]
  ];
  
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const dx = next[0] - current[0];
    const dy = next[1] - current[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    perimeter += distance;
  }
  
  return Math.round(perimeter);
};

const STROKE_DASHARRAY = calculateHexagonPerimeter().toString(); // Perímetro calculado automáticamente

// Función para generar los elementos del ícono de Alaiza (asterisco de 8 puntas)
const generateAlaizaIconElements = (): React.ReactElement[] => {
  const centerX = ICON_CENTER_X;
  const centerY = ICON_CENTER_Y;
  const armWidth = ICON_ARM_WIDTH;
  const armLength = ICON_ARM_LENGTH;
  const centerSize = armWidth * 1.5; // Tamaño del centro compacto
  
  const elements: React.ReactElement[] = [];
  
  // Centro compacto (cuadrado pequeño)
  const centerHalf = centerSize / 2;
  elements.push(
    <rect
      key="center"
      x={centerX - centerHalf}
      y={centerY - centerHalf}
      width={centerSize}
      height={centerSize}
    />
  );
  
  // Generar 8 brazos rectangulares (cada 45 grados)
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * (Math.PI / 180); // Convertir a radianes
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // El brazo se extiende desde el centro hacia afuera
    const startX = centerX + cos * (centerHalf);
    const startY = centerY + sin * (centerHalf);
    const endX = centerX + cos * armLength;
    const endY = centerY + sin * armLength;
    
    // Calcular los puntos perpendiculares para el ancho del brazo
    const perpCos = -sin; // Perpendicular al ángulo
    const perpSin = cos;
    const halfWidth = armWidth / 2;
    
    const p1x = startX + perpCos * halfWidth;
    const p1y = startY + perpSin * halfWidth;
    const p2x = endX + perpCos * halfWidth;
    const p2y = endY + perpSin * halfWidth;
    const p3x = endX - perpCos * halfWidth;
    const p3y = endY - perpSin * halfWidth;
    const p4x = startX - perpCos * halfWidth;
    const p4y = startY - perpSin * halfWidth;
    
    // Crear el rectángulo del brazo como un polígono
    elements.push(
      <polygon
        key={`arm-${i}`}
        points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`}
      />
    );
  }
  
  return elements;
};

// Espaciado del texto
const TEXT_MARGIN_TOP = "mt-6"; // Margen superior del texto (mt-4, mt-6, mt-8, etc)
const TEXT_MARGIN_TOP_TABLET = "sm:mt-8"; // Margen superior en tablet

// Tamaños de texto
const TEXT_SIZE_MOBILE = "text-sm"; // Tamaño en móvil
const TEXT_SIZE_TABLET = "sm:text-base"; // Tamaño en tablet
const TEXT_SIZE_DESKTOP = "md:text-lg"; // Tamaño en desktop
const TEXT_COLOR = "text-white/80"; // Color del texto

// Mensaje por defecto
const DEFAULT_MESSAGE = "Procesando tu información...";

// ============================================

export default function HexagonLoader({ message = DEFAULT_MESSAGE }: HexagonLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const particleIdCounter = useRef(0);

  useEffect(() => {
    setMounted(true);
    
    // Función para generar una sola partícula nueva
    const generateSingleParticle = () => {
      // Generar posición en los bordes de la pantalla (no en el centro)
      const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let x, y;
      
      if (side === 0) { // Top
        x = Math.random() * 100;
        y = Math.random() * 20; // Top 20%
      } else if (side === 1) { // Right
        x = 80 + Math.random() * 20; // Right 20%
        y = Math.random() * 100;
      } else if (side === 2) { // Bottom
        x = Math.random() * 100;
        y = 80 + Math.random() * 20; // Bottom 20%
      } else { // Left
        x = Math.random() * 20; // Left 20%
        y = Math.random() * 100;
      }
      
      const newParticle = {
        id: particleIdCounter.current++,
        x,
        y,
        delay: 0, // Sin delay para generación continua
      };
      
      // Agregar la nueva partícula al array existente (sin reemplazar las demás)
      setParticles(prev => [...prev, newParticle]);
      
      // Remover la partícula después de que termine su animación
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, parseInt(PARTICLE_ANIMATION_DURATION) * 1000);
    };

    // Generar partículas iniciales escalonadas
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      setTimeout(() => {
        generateSingleParticle();
      }, (i * parseInt(PARTICLE_ANIMATION_DURATION) * 1000) / PARTICLE_COUNT);
    }
    
    // Generar nuevas partículas continuamente sin reiniciar las existentes
    // Calcular intervalo para mantener flujo constante
    const intervalTime = (parseInt(PARTICLE_ANIMATION_DURATION) * 1000) / PARTICLE_COUNT;
    const interval = setInterval(generateSingleParticle, intervalTime);
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Cargando"
    >
      {/* Fondo con blur */}
      <div 
        className="absolute inset-0 backdrop-blur-md" 
        style={{ 
          backgroundColor: `rgba(26, 26, 33, ${BACKGROUND_OPACITY / 100})` 
        }}
      />
      
      {/* Partículas que se mueven hacia el centro */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => {
          // Calcular el movimiento necesario para llegar al centro (50%, 50%)
          const moveX = (particle.x - 50) * 1; // Convertir porcentaje a vw
          const moveY = (particle.y - 50) * 1; // Convertir porcentaje a vh
          
          return (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}ms`,
                '--particle-color': PARTICLE_COLOR,
                '--particle-size': PARTICLE_SIZE,
                '--particle-duration': PARTICLE_ANIMATION_DURATION,
                '--move-x': `${moveX}vw`,
                '--move-y': `${moveY}vh`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* Contenedor del hexágono centrado */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Hexágono */}
        <div className={`relative ${HEXAGON_SIZE_MOBILE} ${HEXAGON_SIZE_TABLET} ${HEXAGON_SIZE_DESKTOP}`}>
          <svg
            className="w-full h-full"
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Filtros y gradientes */}
            <defs>
              {/* Glow verde */}
              <filter id="glow-green">
                <feGaussianBlur stdDeviation={GLOW_INTENSITY} result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Hexágono base (fondo oscuro) */}
            <polygon
              points="60,10 100,30 100,70 60,90 20,70 20,30"
              fill={HEXAGON_FILL}
              stroke={HEXAGON_STROKE}
              strokeWidth={HEXAGON_STROKE_WIDTH}
            />

            {/* Ícono de Alaiza (asterisco de 8 puntas) en el centro */}
            <g fill={ICON_COLOR} fillRule="evenodd">
              {generateAlaizaIconElements()}
            </g>

            {/* Línea de progreso animada */}
            <polygon
              points="60,10 100,30 100,70 60,90 20,70 20,30"
              fill="none"
              stroke={PROGRESS_COLOR}
              strokeWidth={PROGRESS_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={STROKE_DASHARRAY}
              strokeDashoffset={STROKE_DASHARRAY}
              filter="url(#glow-green)"
              className="progress-stroke"
            />
          </svg>
        </div>

        {/* Mensaje de texto */}
        <div className={`${TEXT_MARGIN_TOP} ${TEXT_MARGIN_TOP_TABLET} text-center`}>
          <p className={`${TEXT_COLOR} ${TEXT_SIZE_MOBILE} ${TEXT_SIZE_TABLET} ${TEXT_SIZE_DESKTOP} font-medium`}>
            {message}
          </p>
        </div>
      </div>

      {/* Texto accesible oculto */}
      <span className="sr-only">Cargando contenido, por favor espera...</span>

      <style jsx>{`
        /* Animación de progreso del perímetro */
        @keyframes progress-fill {
          0% {
            stroke-dashoffset: ${STROKE_DASHARRAY}; /* Comienza oculto (100% del perímetro) */
          }
          100% {
            stroke-dashoffset: 0; /* Termina visible (0% = línea completa) */
          }
        }

        /* Aplicar animación de progreso */
        .progress-stroke {
          animation: progress-fill ${ANIMATION_DURATION} ${ANIMATION_TIMING} infinite;
        }

        /* Animación de partículas - Fade in y movimiento hacia el centro */
        @keyframes particle-fly {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
          }
          5% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
          95% {
            opacity: 1;
            transform: translate(calc(-50% - var(--move-x)), calc(-50% - var(--move-y))) scale(0.6) rotate(360deg);
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% - var(--move-x)), calc(-50% - var(--move-y))) scale(0) rotate(360deg);
          }
        }

        /* Efecto de brillo pulsante en las partículas */
        @keyframes particle-glow {
          0%, 100% {
            box-shadow: 0 0 10px var(--particle-color), 0 0 20px var(--particle-color);
          }
          50% {
            box-shadow: 0 0 20px var(--particle-color), 0 0 40px var(--particle-color), 0 0 60px var(--particle-color);
          }
        }

        /* Estilo de cada partícula */
        .particle {
          position: absolute;
          width: var(--particle-size);
          height: var(--particle-size);
          background: var(--particle-color);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--particle-color), 0 0 20px var(--particle-color);
          animation: particle-fly var(--particle-duration) ease-in-out infinite,
                     particle-glow 1.5s ease-in-out infinite;
        }

        /* Respeta preferencias de accesibilidad */
        @media (prefers-reduced-motion: reduce) {
          .progress-stroke {
            animation: none;
            stroke-dashoffset: ${parseInt(STROKE_DASHARRAY) / 2}; /* Muestra la mitad del progreso estático */
          }
          
          .particle {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

