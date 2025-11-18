"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Navbar from "./components/Navbar";
import ProgressBar from "./components/ProgressBar";
import AnimatedQuestion from "./components/AnimatedQuestion";
import AnimatedHalftoneBackground from "./components/AnimatedHalftoneBackground";

// Array de preguntas
const QUESTIONS = [
  '1. Ingresa tu nombre y apellido',
  '2. ¿A qué institución financiera o empresa perteneces?',
  '3. ¿Cuál es tu rol dentro de la organización? Cuéntame un poco más sobre tus responsabilidades.',
  '4. ¿En qué áreas se toman decisiones relacionadas con tecnología o servicios financieros?',
  '5. ¿Cuál es la actividad principal de la institución y qué productos o servicios financieros ofrecen actualmente?',
  '6. ¿Cuál es el mayor problema que enfrentan actualmente en sus procesos financieros o tecnológicos?',
  '7. Háblame de tus clientes:\n ¿A qué segmento de mercado atienden?\n ¿A quién brindan servicios directamente?\n ¿Cómo describirías a tu cliente ideal?',
  '8. Háblame del volumen de clientes: ¿cuántos clientes atienden actualmente?',
  '9. ¿Qué tan digitalizada consideras que está tu institución? (bajo, medio, alto)',
  '10. ¿Tienen un equipo interno de tecnología o tercerizan?',
  '11. Si cuentan con equipo interno, cuéntame más de la tecnología que desarrollan.',
  '12. ¿Tienen proveedores externos de tecnología? ¿Cuáles?',
  '13. ¿Qué tipo de integraciones desean implementar?',
  '14. ¿Cuál es tu visión a largo plazo?',
  '15. ¿Tienen presupuesto asignado para soluciones tecnológicas?',
  '16. Cuéntame quién te refirió con nosotros.',
];

// Array de placeholders para cada pregunta
const PLACEHOLDERS = [
  'Ejm: Rodrigo Pérez',
  'Ejm: Banco XYZ',
  'Ejm: Director de TI, encargado de la infraestructura tecnológica.',
  'Ejm: Jefaturas de Tecnología, Dirección General, etc.',
  'Ejm: Banco que ofrece cuentas de ahorro, crédito personal y seguros.',
  'Ejm: Dependencia de sistemas legacy, demoras en las transacciones, falta de innovación tecnológica.',
  'Ejm: Atendemos principalmente a empresas B2B y clientes finales de clase media-alta.',
  'Ejm: Atendemos a 10,000 clientes activos con cuentas bancarias.',
  'Ejm: Alta digitalización, con múltiples canales de comunicación y APIs integradas.',
  'Ejm: Contamos con un equipo interno de tecnología que gestiona la infraestructura digital.',
  'Ejm: Desarrollamos soluciones en la nube, microservicios y servicios de ciberseguridad.',
  'Ejm: Utilizamos proveedores como Visa, Mastercard y sistemas de core bancario.',
  'Ejm: Deseamos integrar soluciones de pagos, transferencias y autenticación biométrica.',
  'Ejm: Buscamos lograr independencia tecnológica y optimizar costos operativos.',
  'Ejm: Sí, contamos con un presupuesto de $500,000 anuales para tecnología.',
  'Ejm: Fui referido por el ejecutivo Pedro Pérez de Zelify.',
];

const THANK_YOU_MESSAGE = "Muchas gracias por tus respuestas. Un ejecutivo coordinará una reunión introductoria para la presentación de los productos y servicios de Zelify en Ecuador.";

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(""));
  const [currentAnswer, setCurrentAnswer] = useState(answers[0] || "");
  const answersRef = useRef(answers);
  
  // Mantener la referencia más reciente de answers
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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

    // Si es la última pregunta, marcar como completado
    if (currentQuestionIndex === QUESTIONS.length - 1) {
      setIsCompleted(true);
      setIsExiting(true);
      setIsGoingBack(false);
    } else {
      // Si no es la última pregunta, iniciar animación de salida
      setIsGoingBack(false);
      setIsExiting(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0 && !isExiting) {
      // Guardar respuesta actual antes de retroceder
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);

      setIsGoingBack(true);
      setIsExiting(true);
    }
  };

  // Memoizar handleAnimationComplete para evitar que se recree en cada render
  const handleAnimationComplete = useCallback(() => {
    if (isExiting) {
      if (isCompleted) {
        // Si se completó, mostrar el mensaje de agradecimiento
        setIsExiting(false);
        setShowQuestion(false);
        setTimeout(() => {
          setShowQuestion(true);
        }, 50);
      } else if (isGoingBack) {
        // Retroceder a la pregunta anterior
        setCurrentQuestionIndex((prevIndex) => {
          const newIndex = prevIndex - 1;
          setCurrentAnswer(answersRef.current[newIndex] || "");
          return newIndex;
        });
        setIsGoingBack(false);
        setIsExiting(false);
        setShowQuestion(false);
        // Pequeño delay para asegurar que el DOM se actualice
        setTimeout(() => {
          setShowQuestion(true);
        }, 50);
      } else {
        // Avanzar a la siguiente pregunta
        setCurrentQuestionIndex((prevIndex) => {
          const newIndex = prevIndex + 1;
          setCurrentAnswer(answersRef.current[newIndex] || "");
          return newIndex;
        });
        setIsExiting(false);
        setShowQuestion(false);
        // Pequeño delay para asegurar que el DOM se actualice
        setTimeout(() => {
          setShowQuestion(true);
        }, 50);
      }
    }
  }, [isExiting, isGoingBack, isCompleted]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajustar altura del textarea automáticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentAnswer]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Si se presiona Enter sin Shift, avanzar a la siguiente pregunta
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Gradiente animado de fondo */}
      <div className="absolute inset-0 animated-gradient" />
      {/* Fondo de halftone animado */}
      <AnimatedHalftoneBackground 
        isDark={true} 
        fullScreen={true} 
        intensity={0.6}
        brightness={0.8}
        className="z-0"
      />
      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
        {!isCompleted && (
          <div className="pt-2 pb-1 sm:pt-3 sm:pb-2 md:pt-4 md:pb-2 lg:pt-5 lg:pb-3">
            <ProgressBar
              totalSteps={totalSteps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              viewingStep={currentStep}
            />
          </div>
        )}

        {/* Contenedor de pregunta y respuesta - centrado verticalmente */}
        <div className="flex-1 flex items-center justify-center py-2 sm:py-4 md:py-8">
          <div className="flex flex-col px-3 sm:px-6 md:px-8 lg:px-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
            {isCompleted ? (
              /* Mensaje de agradecimiento */
              showQuestion && (
                <AnimatedQuestion
                  question={THANK_YOU_MESSAGE}
                  isExiting={false}
                  isGoingBack={false}
                  isFirstQuestion={false}
                  onAnimationComplete={() => {}}
                />
              )
            ) : (
              <>
                {/* Pregunta animada */}
                {showQuestion && (
                  <AnimatedQuestion
                    question={QUESTIONS[currentQuestionIndex]}
                    isExiting={isExiting}
                    isGoingBack={isGoingBack}
                    isFirstQuestion={currentQuestionIndex === 0}
                    onAnimationComplete={handleAnimationComplete}
                  />
                )}

                {/* Textarea que se ajusta automáticamente */}
                <div className="w-full">
                  {/* Textarea sin bordes que crece con el contenido */}
                  <textarea
                    ref={textareaRef}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full bg-transparent text-white text-base sm:text-lg md:text-xl lg:text-2xl text-left outline-none border-none focus:border-none focus:ring-0 placeholder-white/50 focus:placeholder-white/30 transition-all resize-none overflow-hidden min-h-[1.5em]"
                    placeholder={PLACEHOLDERS[currentQuestionIndex]}
                    disabled={isExiting}
                    rows={1}
                  />
                </div>

                {/* Espacio entre input y línea */}
                <div className="h-2 sm:h-3 md:h-4 lg:h-5" />

                {/* Línea/franja morada - ocupa todo el ancho */}
                <div className="w-full h-1 bg-purple-500 rounded-full" />

                {/* Botones de navegación */}
                <div className="flex justify-between items-center gap-2 sm:gap-0 mt-4 sm:mt-6 md:mt-8 lg:mt-10">
                  {/* Botón para retroceder */}
                  {currentQuestionIndex > 0 && (
                    <button
                      onClick={handlePrevious}
                      disabled={isExiting}
                      className="flex items-center gap-1 sm:gap-2 md:gap-3 px-4 sm:px-6 md:px-8 lg:px-10 py-1 sm:py-1.5 md:py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white text-sm sm:text-base md:text-lg lg:text-xl font-medium rounded-lg transition-all duration-300"
                      title="Retroceder"
                    >
                      &lt;
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                  )}
                  
                  {/* Botón para avanzar */}
                  <button
                    onClick={handleNext}
                    disabled={isExiting || currentAnswer.trim() === ""}
                    className={`flex items-center gap-1 sm:gap-2 md:gap-3 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-1 sm:py-1.5 md:py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white text-base sm:text-lg md:text-xl lg:text-2xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 ${currentQuestionIndex === 0 ? 'ml-auto' : ''}`}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
