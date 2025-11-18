"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "./components/Navbar";
import ProgressBar from "./components/ProgressBar";
import AnimatedQuestion from "./components/AnimatedQuestion";

// Array de 6 preguntas de ejemplo
const QUESTIONS = [
  '¿Cuál es su rol dentro de la organización y en qué áreas toma decisiones relacionadas con tecnología o servicios financieros?',
  '¿A qué actividad principal se dedica su empresa y qué productos financieros ofrecen actualmente?',
  '¿Cuál es el mayor problema o fricción que tienen hoy en sus procesos financieros o tecnológicos?',
  '¿Qué tipo de integraciones o servicios están buscando implementar (identidad, AML, pagos, tarjetas, transferencias, etc.)?',
  '¿Cómo manejan hoy el onboarding, pagos o transferencias y qué parte de ese proceso sigue siendo manual?',
  '¿Qué objetivos tienen para los próximos 6–12 meses en términos de nuevos productos o expansión digital?',
  '¿Tienen un presupuesto asignado o un proceso definido para evaluar e implementar soluciones como Zelify?',
  '¿Cuál sería para ustedes el resultado ideal al trabajar con Zelify?',
];

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(""));
  const [currentAnswer, setCurrentAnswer] = useState(answers[0] || "");

  const totalSteps = QUESTIONS.length;
  const currentStep = currentQuestionIndex + 1;
  const completedSteps = answers
    .map((answer, index) => (answer.trim() !== "" ? index + 1 : -1))
    .filter((step) => step > 0);

  const handleNext = () => {
    if (currentAnswer.trim() === "") return;

    // Guardar respuesta
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(newAnswers);

    // Si no es la última pregunta, iniciar animación de salida
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setIsExiting(true);
    }
  };

  const handleAnimationComplete = () => {
    if (isExiting) {
      // La animación de salida terminó, cambiar a la siguiente pregunta
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer(answers[nextIndex] || "");
      setIsExiting(false);
      setShowQuestion(false);
      // Pequeño delay para asegurar que el DOM se actualice
      setTimeout(() => {
        setShowQuestion(true);
      }, 50);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNext();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Gradiente animado de fondo */}
      <div className="absolute inset-0 animated-gradient" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="pt-4 pb-2 sm:pt-8 sm:pb-4 md:pt-12 md:pb-6 lg:pt-16 lg:pb-8">
          <ProgressBar
            totalSteps={totalSteps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            viewingStep={currentStep}
          />
        </div>

        {/* Contenedor de pregunta y respuesta - centrado verticalmente */}
        <div className="flex-1 flex items-center justify-center py-4 sm:py-8">
          <div className="flex flex-col px-4 sm:px-6 md:px-8 lg:px-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
            {/* Pregunta animada */}
            {showQuestion && (
              <AnimatedQuestion
                question={QUESTIONS[currentQuestionIndex]}
                isExiting={isExiting}
                onAnimationComplete={handleAnimationComplete}
              />
            )}

            {/* Input invisible */}
            <div className="w-full">
              {/* Input sin bordes */}
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-transparent text-white text-lg sm:text-xl md:text-2xl text-left outline-none border-none focus:border-none focus:ring-0 placeholder-white/50 focus:placeholder-white/30 transition-all"
                placeholder="Escribe tu respuesta aquí"
                disabled={isExiting}
              />
            </div>

            {/* Espacio entre input y línea */}
            <div className="h-3 sm:h-4 md:h-5 lg:h-6" />

            {/* Línea/franja morada - ocupa todo el ancho */}
            <div className="w-full h-1 bg-purple-500 rounded-full" />

            {/* Botón con flecha alineado a la derecha */}
            <button
              onClick={handleNext}
              disabled={isExiting || currentAnswer.trim() === ""}
              className="self-end flex items-center gap-2 sm:gap-3 mt-6 sm:mt-8 md:mt-10 lg:mt-12 px-8 sm:px-10 md:px-12 py-2 sm:py-3 md:py-4 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white text-lg sm:text-xl md:text-2xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
            >
              <Image
                src="/iconAlaiza.svg"
                alt="Alaiza AI Logo"
                width={20}
                height={20}
                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 brightness-0 invert"
              />
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
