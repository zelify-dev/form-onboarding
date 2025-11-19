"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Navbar from "./components/Navbar";
import ProgressBar from "./components/ProgressBar";
import AnimatedQuestion from "./components/AnimatedQuestion";
import AnimatedHalftoneBackground from "./components/AnimatedHalftoneBackground";

// Array de preguntas
const QUESTIONS = [
  '1.Ingresa tu nombre y apellido',
  '2. Ingresa tu correo electrónico de contacto',
  '3.Ingresa tu número de celular de contacto',
  '4. ¿A qué institución financiera o empresa perteneces?',
  '5. ¿Cuál es tu rol dentro de la organización? Cuéntame un poco más sobre tus responsabilidades.',
  '6. ¿Cuál es la actividad principal de la institución y qué productos o servicios financieros ofrecen actualmente?',
  '7. ¿Cuál es el mayor problema que enfrentan actualmente en sus procesos financieros o tecnológicos?',
  '⁠8. Háblame de tus clientes: ¿A qué segmento atienden, a quién sirven directamente, cómo es su cliente ideal y cuántos clientes tienen actualmente?',
  '9. ¿Qué tan digitalizada consideras que está tu institución? (bajo, medio, alto)',
  '10. Cuéntame sobre su infraestructura tecnológica: ¿Tienen equipo interno o tercerizan, qué soluciones desarrollan, con qué proveedores externos trabajan y qué integraciones desean implementar?',
  '11. ¿Cuál es la visión de tu institución a largo plazo y qué tipo de soluciones tecnológicas consideran implementar?',
  '12. ¿Tienen presupuesto asignado para soluciones tecnológicas?',
  '⁠13. ¿Qué conexiones API tienen actualmente con el core bancario, manejan webhooks o eventos en tiempo real, cómo procesan transacciones y pagos, y cuentan con wallet o canal móvil/web?',
  '14. ¿Cuentan con alguna normativa o lineamiento del Banco Central que condicione las integraciones? (Ejemplo: límites, formatos, requerimientos técnicos, seguridad, etc.)',
  '15. ¿Cómo gestionan el registro y apertura de cuentas digitales, qué validaciones de identidad y listas negras realizan, y qué servicios o proveedores usan para esa verificación?',
  '16. ¿Cuentan con ambientes de prueba y producción, cuál es el proceso de acceso y disponen de documentación técnica actualizada (o de qué fecha es la última versión)?',
  '17. ¿Qué problemas presentan actualmente en los procesos de registro, validación de identidad y validación de listas negras?',
  '18. ¿Su app tiene transferencia interbancaria por SPI? ¿Qué otro mecanismo usa?',
  '19. ¿Emiten tarjetas de débito o crédito?',
  '20. ¿Que servicios te interesarian?',
  '21. ¿Quién te refirió con nosotros?',
];

// Array de placeholders para cada pregunta
const PLACEHOLDERS = [
  'Ejm: Rodrigo Pérez',
  'Ejm: rodrigo.perez@banco.com',
  'Ejm: +593 99 123 4567',
  'Ejm: Banco XYZ',
  'Ejm: Director de TI, encargado de la infraestructura tecnológica.',
  'Ejm: Banco que ofrece cuentas de ahorro, crédito personal y seguros.',
  'Ejm: Dependencia de sistemas legacy, demoras en las transacciones, falta de innovación tecnológica.',
  'Ejm: Atendemos principalmente a empresas B2B y clientes finales de clase media-alta. Tenemos aproximadamente 10,000 clientes activos.',
  'Ejm: Alta digitalización, con múltiples canales de comunicación y APIs integradas.',
  'Ejm: Contamos con un equipo interno de tecnología que gestiona la infraestructura digital. Trabajamos con proveedores como Visa y Mastercard.',
  'Ejm: Buscamos lograr independencia tecnológica y optimizar costos operativos.',
  'Ejm: Sí, contamos con un presupuesto de $500,000 anuales para tecnología.',
  'Ejm: Utilizamos conexiones API para integrar sistemas bancarios. El core maneja webhooks para transacciones en tiempo real. Contamos con app móvil y portal web.',
  'Ejm: Cumplimos con las normativas del Banco Central que regulan las integraciones tecnológicas.',
  'Ejm: La validación de identidad se hace con el Registro Civil y proveedores privados de autenticación. Realizamos screening de listas nacionales e internacionales.',
  'Ejm: Usamos un sistema de Sandbox para pruebas, y nuestra documentación técnica está actualizada hasta enero de 2025.',
  'Ejm: Los problemas incluyen demoras en la validación de identidad y falta de integración de listas negras.',
  'Ejm: Sí, ofrecemos transferencias interbancarias por SPI y mecanismos adicionales como pagos por QR.',
  'Ejm: Sí, emitimos tarjetas de débito y crédito para nuestros clientes.',
  'Ejm: Servicios de identidad, AML, tarjetas, transferencias, pagos, etc.',
  'Ejm: Fui referido por el ejecutivo Pedro Pérez de Zelify.',
];

const THANK_YOU_MESSAGE = "Muchas gracias por tus respuestas. Estamos procesando tu información. Un ejecutivo coordinará una reunión introductoria para la presentación de los productos y servicios de Zelify en Ecuador.";

const DECLINE_MESSAGE = "Muchas gracias por tus respuestas. Estaremos revisando la información proporcionada, nos pondremos en contacto.";

const DOCS_URL = "https://docs.zelify.com";

// ID del archivo de Google Drive para la propuesta
const PROPOSAL_FILE_ID = "178RB8SelWt4Ya6tl0xF0OuUyvf2Hqu97";
const PROPOSAL_DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${PROPOSAL_FILE_ID}`;

// Servicios disponibles para la pregunta de servicios
const SERVICES = [
  'Auth',
  'Identity',
  'AML',
  'Connect',
  'Cards',
  'Transfers',
  'TX',
  'Payments',
  'Discounts',
  'Alaiza IA',
  'Insurance',
];

// Índice de la pregunta de servicios (0-indexed) - Pregunta 20
const SERVICES_QUESTION_INDEX = 19;

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

// Función para validar formato de email
const isValidEmail = (email: string): boolean => {
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  
  // Validación básica de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return false;
  
  // Validar que no tenga espacios
  if (trimmed.includes(' ')) return false;
  
  // Validar que el dominio tenga al menos 2 caracteres después del punto
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split('.');
  if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) return false;
  
  return true;
};

// Función para validar formato de número de celular
// Acepta números con o sin código de país, con o sin espacios, guiones, paréntesis
const isValidPhone = (phone: string): boolean => {
  const trimmed = phone.trim();
  if (trimmed.length === 0) return false;
  
  // Remover espacios, guiones, paréntesis y el signo + para validar
  const cleaned = trimmed.replace(/[\s\-\(\)\+]/g, '');
  
  // Debe tener al menos algunos caracteres después de limpiar
  if (cleaned.length === 0) return false;
  
  // Validar que tenga entre 7 y 15 dígitos (estándar internacional)
  const phoneRegex = /^\d{7,15}$/;
  return phoneRegex.test(cleaned);
};

// Función auxiliar para calcular el siguiente índice considerando lógica condicional
const getNextQuestionIndex = (currentIndex: number, answer: string): number => {
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
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [answers, setAnswers] = useState<string[]>(loadAnswersFromStorage);
  const [currentAnswer, setCurrentAnswer] = useState(answers[0] || "");
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    // Cargar servicios seleccionados desde la respuesta guardada
    const savedAnswer = answers[SERVICES_QUESTION_INDEX] || "";
    return savedAnswer ? savedAnswer.split(',').map(s => s.trim()).filter(s => s) : [];
  });
  const [submissionStatus, setSubmissionStatus] = useState<"next" | "decline" | null>(null);
  const [showStatusTab, setShowStatusTab] = useState(false);
  const [mounted, setMounted] = useState(false);
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
    if (currentQuestionIndex === SERVICES_QUESTION_INDEX) {
      // Si es la pregunta de servicios, cargar los servicios seleccionados
      const savedAnswer = answers[currentQuestionIndex] || "";
      const services = savedAnswer ? savedAnswer.split(',').map(s => s.trim()).filter(s => s) : [];
      setSelectedServices(services);
      setCurrentAnswer(savedAnswer);
    } else {
      setCurrentAnswer(answers[currentQuestionIndex] || "");
    }
    // Limpiar errores al cambiar de pregunta
    setNameError("");
    setEmailError("");
    setPhoneError("");
  }, [currentQuestionIndex, answers]);

  // Manejar selección de servicios
  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => {
      const newServices = prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service];
      // Actualizar currentAnswer con los servicios seleccionados
      const answerValue = newServices.join(', ');
      setCurrentAnswer(answerValue);
      return newServices;
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
    
    // Validar email en tiempo real (pregunta 2, índice 1)
    if (currentQuestionIndex === 1) {
      if (value.trim() === "") {
        setEmailError("");
      } else if (!isValidEmail(value)) {
        setEmailError("Por favor ingresa un correo electrónico válido (ejemplo: nombre@dominio.com)");
      } else {
        setEmailError("");
      }
    }
    
    // Validar teléfono en tiempo real (pregunta 3, índice 2)
    if (currentQuestionIndex === 2) {
      if (value.trim() === "") {
        setPhoneError("");
      } else if (!isValidPhone(value)) {
        setPhoneError("Por favor ingresa un número de celular válido (mínimo 7 dígitos, máximo 15)");
      } else {
        setPhoneError("");
      }
    }
  };

  // Mantener la referencia más reciente de answers
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Función para enviar las respuestas al endpoint
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

      // Enviar al endpoint
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
      console.log("✅ [ENVÍO] Respuestas enviadas exitosamente:", result);
      
      // Manejar el status de la respuesta
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
      timeoutRef.current = setTimeout(() => {
        const answersToSend = currentQuestionIndex < QUESTIONS.length 
          ? finalAnswers 
          : answersRef.current;
        submitAnswers(answersToSend);
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
    // Para la pregunta de servicios, verificar que al menos uno esté seleccionado
    if (currentQuestionIndex === SERVICES_QUESTION_INDEX) {
      if (selectedServices.length === 0) return;
    } else {
      if (currentAnswer.trim() === "") return;
    }

    // Validar nombre y apellido si es la pregunta 1 (índice 0)
    if (currentQuestionIndex === 0) {
      if (!isValidName(currentAnswer)) {
        setNameError("Por favor ingresa tu nombre completo (nombre y apellido, mínimo 2 palabras)");
        return;
      }
      setNameError("");
    }

    // Validar email si es la pregunta 2 (índice 1)
    if (currentQuestionIndex === 1) {
      if (!isValidEmail(currentAnswer)) {
        setEmailError("Por favor ingresa un correo electrónico válido (ejemplo: nombre@dominio.com)");
        return;
      }
      setEmailError("");
    }

    // Validar teléfono si es la pregunta 3 (índice 2)
    if (currentQuestionIndex === 2) {
      if (!isValidPhone(currentAnswer)) {
        setPhoneError("Por favor ingresa un número de celular válido (mínimo 7 dígitos, máximo 15)");
        return;
      }
      setPhoneError("");
    }

    // Guardar respuesta
    const newAnswers = [...answers];
    // Para la pregunta de servicios, guardar los servicios seleccionados como string
    if (currentQuestionIndex === SERVICES_QUESTION_INDEX) {
      newAnswers[currentQuestionIndex] = selectedServices.join(', ');
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
    // Para la pregunta de servicios, verificar que al menos uno esté seleccionado
    if (currentQuestionIndex === SERVICES_QUESTION_INDEX) {
      return isExiting || selectedServices.length === 0 || nameError !== "" || emailError !== "" || phoneError !== "";
    }
    return isExiting || currentAnswer.trim() === "" || nameError !== "" || emailError !== "" || phoneError !== "";
  }, [mounted, isExiting, currentAnswer, selectedServices, currentQuestionIndex, nameError, emailError, phoneError]);

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
              /* Mensaje según el status de la respuesta */
              showQuestion && (
                <>
                  {submissionStatus === "decline" ? (
                    /* Mensaje para decline */
                    <AnimatedQuestion
                      question={DECLINE_MESSAGE}
                      isExiting={false}
                      isGoingBack={false}
                      isFirstQuestion={false}
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
                          <a
                            href={PROPOSAL_DOWNLOAD_URL}
                            download
                            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-green-500 hover:bg-green-600 text-white text-base sm:text-lg md:text-xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-green-500/50 hover:shadow-green-500/70"
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
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Descargar Propuesta
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
                    onAnimationComplete={handleAnimationComplete}
                  />
                )}

                {/* Input según el tipo de pregunta */}
                <div className="w-full">
                  {currentQuestionIndex === SERVICES_QUESTION_INDEX ? (
                    /* Checkboxes para servicios */
                    <div className="w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                        {SERVICES.map((service) => (
                          <label
                            key={service}
                            className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              selectedServices.includes(service)
                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                            } ${isExiting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service)}
                              onChange={() => handleServiceToggle(service)}
                              disabled={isExiting}
                              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 accent-purple-500 cursor-pointer"
                            />
                            <span className="text-sm sm:text-base md:text-lg font-medium select-none">
                              {service}
                            </span>
                          </label>
                        ))}
                      </div>
                      {selectedServices.length === 0 && (
                        <p className="text-white/50 text-sm sm:text-base mt-4">
                          Selecciona al menos un servicio
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Textarea para otras preguntas */
                    <textarea
                      ref={textareaRef}
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className={`w-full bg-transparent text-white text-lg sm:text-lg md:text-xl lg:text-2xl text-left outline-none border-none focus:border-none focus:ring-0 placeholder-white/50 focus:placeholder-white/30 transition-all resize-none overflow-hidden min-h-[1.5em] ${nameError || emailError || phoneError ? 'placeholder-red-400/70' : ''}`}
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
                  {emailError && (
                    <p className="text-red-400 text-sm sm:text-base mt-2">
                      {emailError}
                    </p>
                  )}
                  {phoneError && (
                    <p className="text-red-400 text-sm sm:text-base mt-2">
                      {phoneError}
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

      {/* Pestaña de notificación cuando el status es "next" */}
      {showStatusTab && submissionStatus === "next" && (
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
    </div>
  );
}
