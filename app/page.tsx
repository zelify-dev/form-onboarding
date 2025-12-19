"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Navbar from "./components/Navbar";
import ProgressBar from "./components/ProgressBar";
import AnimatedQuestion from "./components/AnimatedQuestion";
import AnimatedHalftoneBackground from "./components/AnimatedHalftoneBackground";
import HexagonLoader from "./components/HexagonLoader";
import AnimationToggle from "./components/AnimationToggle";

// Array de preguntas
const QUESTIONS = [
  "1. Nombre y apellido",
  "2. Cargo y responsabilidades",
  "3. Institución / Empresa",
  "4. Tipo de institución (Banco, Cooperativa, Fintech, Empresa)",
  "5. País(es) donde opera",
  "6. Actividad principal de la institución",
  "7. Productos o servicios financieros actuales",
  "8. Segmento de clientes atendido",
  "9. Número aproximado de clientes activos",
  "10. Nivel de digitalización actual (bajo / medio / alto)",
  "11. Problema principal que desean resolver",
  "12. Objetivo de negocio a 6–12 meses",
  "13. Consecuencia de no ejecutar este proyecto",
  "14. Funcionalidades requeridas para el MVP",
  "15. Funcionalidades previstas para fases futuras",
  "16. Fecha objetivo de salida a producción",
  "17. Core bancario o sistema transaccional actual",
  "18. ¿El core expone APIs REST?",
  "19. ¿Existen ambientes de sandbox y producción?",
  "20. Proveedores tecnológicos críticos actuales",
  "21. Canales digitales activos (app, web, POS, otros)",
  "22. ¿Utilizan webhooks o eventos en tiempo real?",
  "23. Integraciones externas críticas (core, pagos, identidad, regulador)",
  "24. Método actual de autenticación de usuarios",
  "25. ¿Utilizan tokens de sesión (JWT u otro)?",
  "26. ¿Implementan doble factor de autenticación (2FA)?",
  "27. ¿Recolectan información de dispositivo y geolocalización?",
  "28. ¿Permiten onboarding 100% digital?",
  "29. Proceso actual de validación de identidad",
  "30. ¿Ejecutan validación AML/listas negras en el flujo?",
  "31. Periodicidad del control AML (registro / continuo)",
  "32. ¿Manejan wallet o saldo digital?",
  "33. Tipos de transferencias soportadas (P2P, interbancarias, SPI)",
  "34. ¿El core maneja saldo disponible vs saldo contable?",
  "35. ¿Las transacciones se procesan en tiempo real?",
  "36. ¿Emiten tarjetas (débito / crédito / prepago)?",
  "37. Regulador principal",
  "38. ¿Requieren contrato digital y T&C?",
  "39. Usuarios estimados primer año",
  "40. Transacciones mensuales estimadas",
  "41. ¿Cuentan con presupuesto asignado?",
  "42. Responsable interno del proyecto",
  "43. ¿Quién te refirió con nosotros?",
];

// Array de placeholders para cada pregunta
const PLACEHOLDERS = [
  "Ej: Ana García",
  "Ej: Directora de Innovación, lidera proyectos digitales",
  "Ej: Banco Andino",
  "Ej: Fintech",
  "Ej: Ecuador y Perú",
  "Ej: Banca minorista y créditos de consumo",
  "Ej: Cuentas corrientes, tarjetas de débito, microcréditos",
  "Ej: PYMES y profesionales independientes",
  "Ej: 150000 clientes activos",
  "Ej: Digitalización media, procesos híbridos",
  "Ej: Reducir tiempos de onboarding de clientes",
  "Ej: Lanzar nueva app de onboarding digital",
  "Ej: Continuarán las fugas de clientes y costos altos",
  "Ej: Registro digital, validación de identidad y firma de contratos",
  "Ej: Integrar préstamos digitales y scoring avanzado",
  "Ej: Q4 2025",
  "Ej: Temenos T24 conectado a middleware propio",
  "Ej: Sí, contamos con APIs REST documentadas",
  "Ej: Sí, tenemos sandbox para pruebas y ambiente productivo",
  "Ej: AWS, Fiserv, proveedores locales de pagos",
  "Ej: Banca web, app móvil y POS propios",
  "Ej: Sí, usamos webhooks para eventos transaccionales",
  "Ej: Core bancario, pasarela de pagos y proveedor de identidad",
  "Ej: Login con usuario/contraseña reforzado con OTP",
  "Ej: Sí, tokens JWT emitidos por nuestro IdP",
  "Ej: Sí, enviamos OTP por SMS para 2FA",
  "Ej: Capturamos huella del dispositivo y ubicación aproximada",
  "Ej: Sí, el onboarding es 100% digital",
  "Ej: Validación biométrica y consulta de listas oficiales",
  "Ej: Revisamos listas AML en cada alta",
  "Ej: Control continuo con monitoreo mensual",
  "Ej: Sí, ofrecemos wallet con saldos en USD",
  "Ej: P2P, interbancarias ACH y SPI",
  "Ej: Sí, el core separa saldo disponible y contable",
  "Ej: Sí, conciliamos en tiempo real",
  "Ej: Emitimos tarjetas de débito y prepago",
  "Ej: Superintendencia de Bancos de Ecuador",
  "Ej: Sí, requerimos contrato digital y T&C firmados",
  "Ej: 50000 usuarios durante el primer año",
  "Ej: 200000 transacciones mensuales estimadas",
  "Ej: Sí, tenemos presupuesto aprobado",
  "Ej: María Gómez, líder de Transformación Digital",
  "Ej: Referido por Pedro Pérez (Zelify)",
];

const THANK_YOU_MESSAGE = "Muchas gracias por tus respuestas. Estamos procesando tu información. Un ejecutivo coordinará una reunión introductoria para la presentación de los productos y servicios de Zelify en Ecuador.";

const DECLINE_MESSAGE = "Muchas gracias por tus respuestas. Estaremos revisando la información proporcionada, nos pondremos en contacto.";

const DOCS_URL = "https://docs.zelify.com";

// Índice de la pregunta de presupuesto (0-indexed) - Pregunta 41
const BUDGET_QUESTION_INDEX = 40;

// Índice de la pregunta de países (0-indexed) - Pregunta 5
const COUNTRY_QUESTION_INDEX = 4;

const COUNTRY_OPTIONS = [
  "Colombia",
  "Ecuador",
  "Estados Unidos",
  "México",
];

// Clave para localStorage
const STORAGE_KEY = "form-onboarding-answers";

// Función para validar nombre y apellido
// Debe tener al menos 2 palabras (nombre y apellido), solo letras, espacios y caracteres especiales comunes
const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  if (trimmed.length < 3) return false; // Mínimo 3 caracteres
  
  // Dividir por espacios y filtrar vacíos
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  
  // Debe tener al menos 2 palabras (nombre y apellido)
  if (words.length < 2) return false;
  
  // Cada palabra debe tener al menos 2 caracteres y contener solo letras y caracteres especiales comunes
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  return words.every(word => word.length >= 2 && nameRegex.test(word)) && nameRegex.test(trimmed);
};

// Función auxiliar para calcular el siguiente índice considerando lógica condicional
const getNextQuestionIndex = (currentIndex: number, _answer: string): number => {
  // Por ahora no hay lógica condicional, todas las preguntas se muestran en secuencia
  return currentIndex + 1;
};

export default function Home() {
  // Cargar respuestas desde localStorage al iniciar
  const loadAnswersFromStorage = (): string[] => {
    if (typeof window === "undefined") return Array(QUESTIONS.length).fill("");
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Asegurar que el array tenga el tamaño correcto
        const loadedAnswers = Array(QUESTIONS.length).fill("");
        parsed.forEach((answer: string, index: number) => {
          if (index < QUESTIONS.length) {
            loadedAnswers[index] = answer;
          }
        });
        return loadedAnswers;
      }
    } catch (error) {
      console.error("Error al cargar respuestas desde localStorage:", error);
    }
    return Array(QUESTIONS.length).fill("");
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [answers, setAnswers] = useState<string[]>(loadAnswersFromStorage);
  const [currentAnswer, setCurrentAnswer] = useState(answers[0] || "");
  const [selectedCountries, setSelectedCountries] = useState<string[]>(() => {
    const savedAnswer = answers[COUNTRY_QUESTION_INDEX] || "";
    return savedAnswer
      ? savedAnswer.split(',').map((c) => c.trim()).filter((c) => c.length > 0)
      : [];
  });
  const [submissionStatus, setSubmissionStatus] = useState<"next" | "decline" | null>(null);
  const [showStatusTab, setShowStatusTab] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const answersRef = useRef(answers);
  const hasSubmittedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Marcar como montado después del primer render
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Guardar respuestas en localStorage cada vez que cambien
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      } catch (error) {
        console.error("Error al guardar respuestas en localStorage:", error);
      }
    }
  }, [answers]);

  // Cargar la respuesta actual cuando cambia el índice de pregunta
  useEffect(() => {
    if (currentQuestionIndex === COUNTRY_QUESTION_INDEX) {
      const savedAnswer = answers[currentQuestionIndex] || "";
      const countries = savedAnswer
        ? savedAnswer.split(',').map((c) => c.trim()).filter((c) => c.length > 0)
        : [];
      setSelectedCountries((prev) => {
        if (
          prev.length === countries.length &&
          prev.every((country, index) => country === countries[index])
        ) {
          return prev;
        }
        return countries;
      });
      setCurrentAnswer(savedAnswer);
    } else {
      setCurrentAnswer(answers[currentQuestionIndex] || "");
    }
    // Limpiar errores al cambiar de pregunta
    setNameError("");
  }, [currentQuestionIndex, answers]);

  // Manejar selección de países para la pregunta 5
  const handleCountryToggle = (country: string) => {
    setSelectedCountries((prev) => {
      const newSelection = prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country];
      const answerValue = newSelection.join(', ');
      setCurrentAnswer(answerValue);
      setAnswers((prevAnswers) => {
        const updated = [...prevAnswers];
        updated[COUNTRY_QUESTION_INDEX] = answerValue;
        return updated;
      });
      return newSelection;
    });
  };

  // Validar y actualizar respuesta cuando el usuario escribe
  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
    
    // Validar nombre y apellido en tiempo real (pregunta 1, índice 0)
    if (currentQuestionIndex === 0) {
      if (value.trim() === "") {
        setNameError("");
      } else if (!isValidName(value)) {
        setNameError("Por favor ingresa tu nombre completo (nombre y apellido, mínimo 2 palabras)");
      } else {
        setNameError("");
      }
    }
  };

  // Mantener la referencia más reciente de answers
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Función para enviar las respuestas al endpoint
  // TEMPORALMENTE COMENTADO PARA PRUEBAS LOCALES
  const submitAnswers = useCallback(async (finalAnswers: string[]) => {
    setIsSubmitting(true);
    
    try {
      // Estructurar los datos en formato JSON
      const data = {
        questions: QUESTIONS.map((question, index) => ({
          questionNumber: index + 1,
          question: question,
          answer: finalAnswers[index] || "",
        })),
        submittedAt: new Date().toISOString(),
      };

      console.log("📤 [ENVÍO] Enviando respuestas a la API...", {
        totalPreguntas: data.questions.length,
        timestamp: data.submittedAt
      });

      // Enviar al endpoint de producción
      const response = await fetch("https://mailing-production-65d6.up.railway.app/ai/evaluate-business-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error al enviar: ${response.status}`);
      }

      const result = await response.json();
      
      // El loader se ocultará cuando termine la generación del PDF también
      if (result.status === "next" || result.status === "decline") {
        setSubmissionStatus(result.status);
        if (result.status === "next") {
          setShowStatusTab(true);
        }
      }
      
      // Limpiar localStorage después de enviar exitosamente
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.error("Error al limpiar localStorage:", error);
        }
      }
    } catch (error) {
      console.error("❌ [ENVÍO] Error al enviar las respuestas:", error);
      // Aquí podrías agregar un estado para mostrar un mensaje de error al usuario
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Enviar respuestas cuando se complete el formulario (solo una vez)
  useEffect(() => {
    if (isCompleted && !isSubmitting && !hasSubmittedRef.current) {
      // Marcar como enviado inmediatamente para evitar múltiples envíos
      hasSubmittedRef.current = true;
      
      // Guardar la última respuesta antes de enviar
      const finalAnswers = [...answersRef.current];
      if (currentQuestionIndex < QUESTIONS.length) {
        finalAnswers[currentQuestionIndex] = currentAnswer;
        setAnswers(finalAnswers);
        answersRef.current = finalAnswers;
      }
      
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Pequeño delay para asegurar que todas las respuestas estén guardadas
      timeoutRef.current = setTimeout(async () => {
        const answersToSend = currentQuestionIndex < QUESTIONS.length 
          ? finalAnswers 
          : answersRef.current;
        
        try {
          await submitAnswers(answersToSend);
        } catch (error) {
          console.error("❌ [ENVÍO] Error en el proceso:", error);
        }
        
        timeoutRef.current = null;
      }, 500);
      
      // Cleanup function para cancelar el timeout si el componente se desmonta
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [isCompleted, isSubmitting, currentQuestionIndex, currentAnswer, submitAnswers]);

  const totalSteps = QUESTIONS.length;
  const currentStep = currentQuestionIndex + 1;
  const completedSteps = answers
    .map((answer, index) => (answer.trim() !== "" ? index + 1 : -1))
    .filter((step) => step > 0);

  const handleNext = () => {
    if (currentQuestionIndex === COUNTRY_QUESTION_INDEX) {
      if (selectedCountries.length === 0) return;
    } else if (currentAnswer.trim() === "") {
      return;
    }

    // Validar nombre y apellido si es la pregunta 1 (índice 0)
    if (currentQuestionIndex === 0) {
      if (!isValidName(currentAnswer)) {
        setNameError("Por favor ingresa tu nombre completo (nombre y apellido, mínimo 2 palabras)");
        return;
      }
      setNameError("");
    }

    // Guardar respuesta
    const newAnswers = [...answers];
    if (currentQuestionIndex === COUNTRY_QUESTION_INDEX) {
      newAnswers[currentQuestionIndex] = selectedCountries.join(', ');
    } else {
      newAnswers[currentQuestionIndex] = currentAnswer;
    }
    setAnswers(newAnswers);

    // Calcular siguiente índice considerando lógica condicional
    const nextIndex = getNextQuestionIndex(currentQuestionIndex, currentAnswer);

    // Si es la última pregunta, marcar como completado
    if (nextIndex >= QUESTIONS.length) {
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
        // Avanzar a la siguiente pregunta (considerando lógica condicional)
        setCurrentQuestionIndex((prevIndex) => {
          const currentAnswer = answersRef.current[prevIndex] || "";
          const newIndex = getNextQuestionIndex(prevIndex, currentAnswer);
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

  // Calcular el estado disabled del botón de manera consistente
  const isNextButtonDisabled = useMemo(() => {
    if (!mounted) return true; // Deshabilitar hasta que esté montado para evitar errores de hidratación
    if (currentQuestionIndex === COUNTRY_QUESTION_INDEX) {
      return isExiting || selectedCountries.length === 0 || nameError !== "";
    }
    return isExiting || currentAnswer.trim() === "" || nameError !== "";
  }, [mounted, isExiting, currentAnswer, currentQuestionIndex, selectedCountries, nameError]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Loader de carga cuando se está enviando el formulario */}
      {isSubmitting && <HexagonLoader />}
      
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
        {/* <HexagonLoader /> */}
          <div className="flex flex-col px-3 sm:px-6 md:px-8 lg:px-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
            {isCompleted && !isSubmitting ? (
              /* Mensaje según el status de la respuesta - solo se muestra cuando el loader se oculta */
              showQuestion && (
                <>
                  {submissionStatus === "decline" ? (
                    /* Mensaje para decline */
                    <AnimatedQuestion
                      question={DECLINE_MESSAGE}
                      isExiting={false}
                      isGoingBack={false}
                      isFirstQuestion={false}
                      animationsEnabled={animationsEnabled}
                      onAnimationComplete={() => {}}
                    />
                  ) : submissionStatus === "next" ? (
                    /* Mensaje para next con enlaces a documentación */
                    <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">
                      <AnimatedQuestion
                        question={THANK_YOU_MESSAGE}
                        isExiting={false}
                        isGoingBack={false}
                        isFirstQuestion={false}
                        animationsEnabled={animationsEnabled}
                        onAnimationComplete={() => {}}
                      />
                      <div className="mt-4 sm:mt-6 md:mt-8">
                        <p className="text-white text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-6 font-medium">
                          Mientras tanto, te invitamos a visitar nuestro sitio de documentación para conocer más sobre nuestros servicios:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5">
                          <a
                            href={DOCS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-purple-500 hover:bg-purple-600 text-white text-base sm:text-lg md:text-xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
                          >
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            Visitar Documentación
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Mensaje por defecto mientras se procesa */
                    <AnimatedQuestion
                      question={THANK_YOU_MESSAGE}
                      isExiting={false}
                      isGoingBack={false}
                      isFirstQuestion={false}
                      animationsEnabled={animationsEnabled}
                      onAnimationComplete={() => {}}
                    />
                  )}
                </>
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
                    animationsEnabled={animationsEnabled}
                    onAnimationComplete={handleAnimationComplete}
                  />
                )}

                {/* Input según el tipo de pregunta */}
                <div className="w-full">
                  {currentQuestionIndex === COUNTRY_QUESTION_INDEX ? (
                    /* Checkboxes para países */
                    <div className="w-full">
                      <p className="text-white/60 text-sm sm:text-base mb-4">
                        Selecciona uno o varios países
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {COUNTRY_OPTIONS.map((country) => (
                          <label
                            key={country}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              selectedCountries.includes(country)
                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                            } ${isExiting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCountries.includes(country)}
                              onChange={() => handleCountryToggle(country)}
                              disabled={isExiting}
                              className="w-4 h-4 sm:w-5 sm:h-5 accent-purple-500 cursor-pointer"
                            />
                            <span className="text-sm sm:text-base font-medium select-none">
                              {country}
                            </span>
                          </label>
                        ))}
                      </div>
                      {selectedCountries.length === 0 && (
                        <p className="text-white/50 text-sm sm:text-base mt-4">
                          Selecciona al menos un país
                        </p>
                      )}
                    </div>
                  ) : currentQuestionIndex === BUDGET_QUESTION_INDEX ? (
                    /* Radio buttons para pregunta de presupuesto */
                    <div className="w-full flex flex-col items-center">
                      <p className="text-white/50 text-sm sm:text-base mb-4">
                        Selecciona una opción
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {['Sí', 'No'].map((option) => (
                          <label
                            key={option}
                            className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              currentAnswer === option
                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                            } ${isExiting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="radio"
                              name="budget"
                              value={option}
                              checked={currentAnswer === option}
                              onChange={(e) => handleAnswerChange(e.target.value)}
                              disabled={isExiting}
                              className="w-5 h-5 sm:w-6 sm:h-6 accent-purple-500 cursor-pointer"
                            />
                            <span className="text-base sm:text-lg md:text-xl font-medium select-none">
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Textarea para otras preguntas */
                    <textarea
                      ref={textareaRef}
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className={`w-full bg-transparent text-white text-lg sm:text-lg md:text-xl lg:text-2xl text-left outline-none border-none focus:border-none focus:ring-0 placeholder-white/50 focus:placeholder-white/30 transition-all resize-none overflow-hidden min-h-[1.5em] ${nameError ? 'placeholder-red-400/70' : ''}`}
                      placeholder={PLACEHOLDERS[currentQuestionIndex]}
                      disabled={isExiting}
                      rows={1}
                    />
                  )}
                  {/* Mensajes de error */}
                  {nameError && (
                    <p className="text-red-400 text-sm sm:text-base mt-2">
                      {nameError}
                    </p>
                  )}
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
                    disabled={isNextButtonDisabled}
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

      {/* Pestaña de notificación cuando el status es "next" - solo se muestra cuando el loader se oculta */}
      {showStatusTab && submissionStatus === "next" && !isSubmitting && (
        <div className="fixed bottom-0 right-0 z-50 animate-slide-up">
          <div className="bg-green-500 text-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 rounded-tl-2xl shadow-2xl max-w-sm sm:max-w-md md:max-w-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-sm sm:text-base md:text-lg">
                    ¡Aprobado!
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-green-50 mt-1">
                    Tu solicitud ha sido enviada exitosamente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusTab(false)}
                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                aria-label="Cerrar notificación"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle de animaciones en la parte inferior izquierda */}
      {!isCompleted && <AnimationToggle onToggle={setAnimationsEnabled} />}
    </div>
  );
}
