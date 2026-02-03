"use client";

import { PropsWithChildren, useEffect, useRef } from "react";

type AnimatedHalftoneBackgroundProps = PropsWithChildren<{
  isDark?: boolean;
  fullScreen?: boolean;
  intensity?: number;
  brightness?: number;
  className?: string;
}>;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default function AnimatedHalftoneBackground({
  isDark = false,
  fullScreen = false,
  intensity = 1,
  brightness = 1,
  className = "",
  children,
}: AnimatedHalftoneBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ⚙️ CONFIGURACIÓN DE COLORES
  // Cambia el color RGB de los puntos del halftone (formato: "R,G,B")
  // Light theme uses a neutral gray so the dots are visible on white backgrounds.
  const halftoneColor = isDark ? "255,255,255" : "148,163,184";
  
  // ⚙️ CONFIGURACIÓN DE OPACIDAD/INTENSIDAD
  // baseAlphaRaw: Opacidad base de los puntos (0 = invisible, 1 = completamente opaco)
  // Valores más altos = fondo más pronunciado/visible
  // Valores más bajos = fondo más sutil/discreto
  const baseAlphaRaw = isDark ? 0.06 : 0.14; // Ajusta aquí para cambiar la opacidad base
  
  // pulseAlphaRaw: Opacidad máxima cuando los puntos "pulsan" (efecto de onda)
  // Valores más altos = pulso más intenso y visible
  // Valores más bajos = pulso más sutil
  const pulseAlphaRaw = isDark ? 0.30 : 0.32; // Ajusta aquí para cambiar la intensidad del pulso
  
  // ⚙️ CONFIGURACIÓN DEL FADE EN LOS BORDES
  // Color del degradado que se aplica en los bordes para suavizar la transición
  const fadeColor = isDark ? "rgba(8,11,25,1)" : "rgb(255, 255, 255)";

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const [r, g, b] = halftoneColor.split(",").map(Number);
    const brightnessScale = clamp(brightness, 0, 1);
    const baseAlpha = clamp(baseAlphaRaw * intensity * brightnessScale, 0, 1);
    const pulseAlpha = clamp(pulseAlphaRaw * intensity * brightnessScale, 0, 1);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
    }

    let rafId: number;
    const start = performance.now();

    // ⚙️ CONFIGURACIÓN DEL ESPACIADO DE LOS PUNTOS
    // spacing: Distancia entre cada punto del halftone (en píxeles)
    // Valores más bajos = puntos más juntos = patrón más denso
    // Valores más altos = puntos más separados = patrón más disperso
    const spacing = 26; // Ajusta aquí para cambiar la densidad del patrón
    
    // ⚙️ CONFIGURACIÓN DE LA ONDA DE ANIMACIÓN
    // waveFrequency: Frecuencia de la onda (cuántas ondas completas hay desde el centro)
    // Valores más altos = más ondas = patrón más complejo
    // Valores más bajos = menos ondas = patrón más simple
    const waveFrequency = 1.35; // Ajusta aquí para cambiar la complejidad de la onda
    
    // waveSpeed: Velocidad de la animación de la onda
    // Valores más altos = animación más rápida
    // Valores más bajos = animación más lenta
    const waveSpeed = 0.35; // Ajusta aquí para cambiar la velocidad de la animación

    const render = (time: number) => {
      const elapsed = (time - start) / 1000;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase =
            (normalizedDistance * waveFrequency - elapsed * waveSpeed) *
            Math.PI * 2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          // ⚙️ CONFIGURACIÓN DEL FADE EN LOS BORDES
          // El exponente (1.4) controla qué tan rápido se desvanece el efecto hacia los bordes
          // Valores más altos = fade más abrupto (desaparece más rápido en los bordes)
          // Valores más bajos = fade más suave (se extiende más hacia los bordes)
          const edgeFade = Math.pow(Math.max(0, 1 - normalizedDistance), 1.4); // Ajusta 1.4 para cambiar el fade
          
          const alpha = (baseAlpha + pulse * pulseAlpha) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          
          // ⚙️ CONFIGURACIÓN DEL TAMAÑO DE LOS PUNTOS
          // 1.4 = tamaño base del punto (en píxeles)
          // 0.6 = variación del tamaño durante el pulso
          // Valores más altos = puntos más grandes
          // Valores más bajos = puntos más pequeños
          ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2); // Ajusta 1.4 y 0.6 para cambiar el tamaño
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, [baseAlphaRaw, brightness, halftoneColor, intensity, pulseAlphaRaw]);

  const baseClasses = fullScreen
    ? "animated-halftone fixed inset-0"
    : "animated-halftone relative overflow-hidden rounded-3xl";

  return (
    <div
      ref={containerRef}
      className={`${baseClasses} ${className}`.trim()}
      aria-hidden={fullScreen && !children ? true : undefined}
    >
      <canvas
        ref={canvasRef}
        className="halftone-canvas absolute inset-0 w-full h-full"
      />
      <div
        className={`edge-fade absolute inset-0 pointer-events-none ${
          fullScreen ? "" : "rounded-3xl"
        }`}
        style={{
          background: `radial-gradient(circle at center, rgba(130, 37, 37, 0) 60%, ${fadeColor} 100%)`,
        }}
      />
      {children}
    </div>
  );
}
