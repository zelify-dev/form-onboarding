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

  const halftoneColor = isDark ? "255,255,255" : "58,82,190";
  const baseAlphaRaw = isDark ? 0.06 : 0.2;
  const pulseAlphaRaw = isDark ? 0.45 : 0.75;
  const fadeColor = isDark ? "rgba(8,11,25,1)" : "rgba(250,252,255,1)";

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

    const spacing = 26;
    const waveFrequency = 1.35;
    const waveSpeed = 0.35;

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
          const edgeFade = Math.pow(Math.max(0, 1 - normalizedDistance), 1.4);
          const alpha = (baseAlpha + pulse * pulseAlpha) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2);
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
          background: `radial-gradient(circle at center, rgba(0,0,0,0) 60%, ${fadeColor} 100%)`,
        }}
      />
      {children}
    </div>
  );
}
