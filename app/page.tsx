'use client';

import { useEffect, useRef } from 'react';
// Componentes de layout
import { Navbar } from './components/layout';
// Componentes de UI
import { AnimatedText, InputField, ProgressBar } from './components/ui';
// Hook para manejar el formulario
import { useFormQuestions } from './lib/hooks/useFormQuestions';

export default function Home() {
  const {
    currentQuestion,
    currentPlaceholder,
    currentAnswer,
    currentQuestionIndex,
    viewingQuestionIndex,
    isViewingCurrentQuestion,
    isExiting,
    isTransitioning,
    totalQuestions,
    handleAnswer,
    handleExitComplete,
    navigateBack,
    navigateForward,
  } = useFormQuestions();

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  // Maneja el scroll para navegar entre preguntas
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // No permite navegación durante transiciones
      if (isTransitioning) return;

      const now = Date.now();
      // Throttle: solo procesa scroll cada 500ms
      if (now - lastScrollTimeRef.current < 500) return;
      lastScrollTimeRef.current = now;

      // Scroll hacia arriba = navegar hacia atrás (ver pregunta anterior)
      if (e.deltaY < 0 && viewingQuestionIndex > 0) {
        e.preventDefault();
        navigateBack();
      }
      // Scroll hacia abajo = navegar hacia adelante (volver a la pregunta actual)
      else if (e.deltaY > 0 && viewingQuestionIndex < currentQuestionIndex) {
        e.preventDefault();
        navigateForward();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [viewingQuestionIndex, currentQuestionIndex, isTransitioning, navigateBack, navigateForward]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradiente animado de fondo */}
      <div className="absolute inset-0 animated-gradient" />
      
      {/* Efecto de estrellas/textura con puntos brillantes */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px),
                              radial-gradient(circle at 60% 70%, rgba(255,255,255,0.1) 1px, transparent 1px),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 1px, transparent 1px),
                              radial-gradient(circle at 40% 80%, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '200px 200px, 150px 150px, 180px 180px, 160px 160px'
          }}
        />
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Barra de progreso */}
        <ProgressBar 
          currentQuestionIndex={currentQuestionIndex}
          viewingQuestionIndex={viewingQuestionIndex}
          totalQuestions={totalQuestions}
        />

        {/* Contenido centrado */}
        <main className="flex flex-1 items-center justify-center px-4 sm:px-6 md:px-8 pb-8">
          <div className="flex w-full max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl flex-col items-start justify-start gap-6 sm:gap-10 md:gap-12 lg:gap-16 text-left">
            <h1 className="w-full text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-white">
              <AnimatedText 
                text={currentQuestion} 
                isExiting={isExiting}
                onExitComplete={handleExitComplete}
              />
            </h1>
            
            <div className="w-full">
              <InputField 
                placeholder={currentPlaceholder}
                initialValue={currentAnswer}
                onSubmit={handleAnswer}
                disabled={isTransitioning || !isViewingCurrentQuestion}
                resetOnSubmit={true}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
