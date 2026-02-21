"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Navbar from "./Navbar";
import FocusedProgressBar from "./FocusedProgressBar";
import AnimatedQuestion from "./AnimatedQuestion";
import AnimatedHalftoneBackground from "./AnimatedHalftoneBackground";
import HexagonLoader from "./HexagonLoader";
import AnimationToggle from "./AnimationToggle";
import TokenWallet from "./TokenWallet";
import iconAlaiza from "../assets/icons/iconAlaiza.svg";
import type { FormConfig } from "../lib/formConfigs";
import { COMERCIAL_FORM, TECNOLOGICO_FORM } from "../lib/formConfigs";
import { evaluateBusinessProfile, generateProposal, sendProposalEmail } from "../lib/api";

type OnboardingFormProps = {
  config: FormConfig;
};

// Servicios disponibles para la pregunta de servicios - REORDERED
const SERVICES = [
  { name: "Autenticación", description: "Autenticación segura y gestión de accesos" },
  { name: "Identidad", description: "Verificación y validación de identidad" },
  { name: "AML (prevención de lavado de dinero)", description: "Prevención de lavado de activos/antifraude y cumplimiento" },
  { name: "Conexión", description: "Integración y conexión con sistemas externos" },
  { name: "Transacciones Internacionales", description: "Procesamiento de transacciones financieras internacionales" },
  { name: "Pagos & transferencias", description: "Transferencias bancarias y transacciones. Sistema de pagos y cobros digitales" },
  { name: "Descuentos", description: "Gestión de descuentos y promociones" },
  { name: "Alaiza IA", description: "Inteligencia artificial para tus servicios financieros" },
  { name: "Tarjetas", description: "Emisión y gestión de tarjetas de débito" },
  // Eliminados temporalmente: Seguros
];

const PDF_FILES = {
  COVER: "1yP4TgKm0CEY773yfgP6VYejGffVE55KE",
  ONBOARDING: "19tWreLsCdhi5RWZ7nTEl98Veffr2ajAY",
  IDENTITY: "1AzECN-tYXTdRmnJW3qJpsS8c-npEk5ds",
  CONNECT: "1PoLgM6RAmCzEJzfqSFRyC0Jw60DmBDne",
  TRANSFERS: "1fy1jvsY3-c9pPla7BBEfLeXoXST9TorI",
  ALAIZA: "1guUnUrhIcwho7c7u9gAc2oR-BCtH2GQx",
  AUTH: "1j7UyEznTNhgHQ7CeiDn17v6I-AClCg7N",
  AML: "1ptu6sceqzpoPMEefCqkjUmGX684LDlIa",
  PAYMENTS: "1qJfybrP1C1yU6Jkq2CyrWO774TnnsFQr",
  TX_INT: "1_N4KnYNrCp0AYYHd5dqy_RkA7hNVdwf3",
  BACK_COVER: "1xGHIqnuZ5OVjdiWsjC7If4GQx1md-NTB",
  CARDS: "19UOK6escB9Jb9l8q7dh04aAAI_f6yfHQ",
  DISCOUNT: "1lHVKOLQkIzX2baHffmFEe4SenuW-Ouw5",
};

// Mapeo de servicios a IDs de Google Drive para PDFs (Array de strings)
const SERVICE_PDF_MAP: Record<string, string[]> = {
  Autenticación: [PDF_FILES.AUTH],
  Identidad: [PDF_FILES.IDENTITY],
  "AML (prevención de lavado de dinero)": [PDF_FILES.AML],
  Conexión: [PDF_FILES.CONNECT],
  "Transacciones Internacionales": [PDF_FILES.TX_INT],
  "Pagos & transferencias": [PDF_FILES.PAYMENTS, PDF_FILES.TRANSFERS],
  Descuentos: [PDF_FILES.DISCOUNT],
  "Alaiza IA": [PDF_FILES.ALAIZA],
  Tarjetas: [PDF_FILES.CARDS],
};

const THANK_YOU_MESSAGE =
  "Muchas gracias por tus respuestas. Estamos procesando tu información. Un ejecutivo coordinará una reunión introductoria para la presentación de los productos y servicios de Zelify en Ecuador.";

const DECLINE_MESSAGE =
  "Gracias por tus respuestas. Evaluaremos tus preguntas y nos pondremos en contacto contigo lo más pronto posible.";

const DOCS_URL = "https://docs.zelify.com";

const COUNTRY_OPTIONS = ["Colombia", "Ecuador", "Estados Unidos", "México"];

// Función para validar nombre y apellido
// Debe tener al menos 2 palabras (nombre y apellido), solo letras, espacios y caracteres especiales comunes
const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;

  const words = trimmed.split(/\s+/).filter((word) => word.length > 0);
  if (words.length < 2) return false;

  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  return words.every((word) => word.length >= 2 && nameRegex.test(word)) && nameRegex.test(trimmed);
};

const validateAnswer = (questionIndex: number, answer: string, config: FormConfig): string | null => {
  const rule = config.validationRules?.[questionIndex];
  if (!rule) return null;

  const trimmed = answer.trim();

  //Validar longitud minima
  if (rule.minLength && trimmed.length < rule.minLength) {
    return rule.errorMessage;
  }

  //Validar longitud máxima
  if (rule.maxLength && trimmed.length > rule.maxLength) {
    return rule.errorMessage;
  }

  //Validar patrón
  if (rule.pattern && !rule.pattern.test(trimmed)) {
    return rule.errorMessage;
  }

  //Validar palabras bloqueadas
  if (rule.blockedWords && rule.blockedWords.length > 0) {
    const lowerAnswer = trimmed.toLowerCase();
    const blockedWord = rule.blockedWords.find(word => lowerAnswer.includes(word.toLowerCase()));
    if (blockedWord) {
      return `Por favor, proporciona una respuesta válida. "${blockedWord}" no es aceptable.`;
    }
  }

  return null;
};

const getNextQuestionIndex = (currentIndex: number, _answer: string): number => currentIndex + 1;

export default function OnboardingForm({ config }: OnboardingFormProps) {

  const questions = config.questions;
  const placeholders = config.placeholders;
  const storageKey = config.storageKey;
  const { budgetQuestionIndex, servicesQuestionIndex, countryQuestionIndex } = config.indices;
  const selectQuestions = config.selectQuestions || {};

  // Función genérica para verificar si una pregunta es de tipo select
  const isSelectQuestion = (index: number): boolean => {
    return index in selectQuestions;
  };

  // Obtener configuración de pregunta select
  const getSelectConfig = (index: number) => {
    return selectQuestions[index];
  };

  // Funciones de compatibilidad hacia atrás (mantener para código existente)
  const isCountryQuestion = (index: number) =>
    countryQuestionIndex >= 0 && index === countryQuestionIndex;
  const isServicesQuestion = (index: number) =>
    servicesQuestionIndex >= 0 && index === servicesQuestionIndex;
  const isBudgetQuestion = (index: number) =>
    budgetQuestionIndex >= 0 && index === budgetQuestionIndex;

  // No longer loading from localStorage on init
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [tokenBalance, setTokenBalance] = useState(100);
  const [lastAddedTokens, setLastAddedTokens] = useState(0);
  const [awardedTokens, setAwardedTokens] = useState<Record<number, number>>({});

  const [currentAnswer, setCurrentAnswer] = useState(answers[0] || "");
  // Estado genérico para manejar selecciones de preguntas select
  const [selectSelections, setSelectSelections] = useState<Record<number, string[]>>(() => {
    const initial: Record<number, string[]> = {};
    // Inicializar con valores guardados para todas las preguntas select
    Object.keys(selectQuestions).forEach((key) => {
      const index = parseInt(key, 10);
      const savedAnswer = answers[index] || "";
      if (savedAnswer) {
        initial[index] = savedAnswer.split(",").map((s) => s.trim()).filter((s) => s);
      } else {
        initial[index] = [];
      }
    });
    return initial;
  });

  const [selectedCountries, setSelectedCountries] = useState<string[]>(() => {
    if (countryQuestionIndex < 0) return [];
    const savedAnswer = answers[countryQuestionIndex] || "";
    return savedAnswer
      ? savedAnswer
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
      : [];
  });
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    if (servicesQuestionIndex < 0) return [];
    const savedAnswer = answers[servicesQuestionIndex] || "";
    return savedAnswer ? savedAnswer.split(",").map((s) => s.trim()).filter((s) => s) : [];
  });
  const [submissionStatus, setSubmissionStatus] = useState<"next" | "decline" | null>(null);
  const [showStatusTab, setShowStatusTab] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [preGeneratedPDF, setPreGeneratedPDF] = useState<Blob | null>(null);
  const answersRef = useRef(answers);
  const hasSubmittedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar si es formulario técnico
  const isTechnicalForm = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('onboarding_role') === 'technical';
  }, []);

  // Detectar si es formulario comercial
  const isCommercialForm = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('onboarding_role') === 'commercial';
  }, []);

  // Estado para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);



  useEffect(() => {
    if (isCountryQuestion(currentQuestionIndex)) {
      const savedAnswer = answers[currentQuestionIndex] || "";
      const countries = savedAnswer
        ? savedAnswer
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c.length > 0)
        : [];
      setSelectedCountries((prev) => {
        if (prev.length === countries.length && prev.every((country, index) => country === countries[index])) {
          return prev;
        }
        return countries;
      });
      setCurrentAnswer(savedAnswer);
    } else if (isServicesQuestion(currentQuestionIndex)) {
      const savedAnswer = answers[currentQuestionIndex] || "";
      const services = savedAnswer ? savedAnswer.split(",").map((s) => s.trim()).filter((s) => s) : [];
      setSelectedServices(services);
      setCurrentAnswer(savedAnswer);
    } else if (isSelectQuestion(currentQuestionIndex)) {
      const savedAnswer = answers[currentQuestionIndex] || "";
      const selections = savedAnswer ? savedAnswer.split(",").map((s) => s.trim()).filter((s) => s) : [];
      setSelectSelections((prev) => ({
        ...prev,
        [currentQuestionIndex]: selections,
      }));
      setCurrentAnswer(savedAnswer);
    } else {
      setCurrentAnswer(answers[currentQuestionIndex] || "");
    }
    setNameError("");
    setValidationMessage(null);
  }, [currentQuestionIndex, answers]);

  const handleCountryToggle = (country: string) => {
    setSelectedCountries((prev) => {
      const newSelection = prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country];
      const answerValue = newSelection.join(", ");
      setCurrentAnswer(answerValue);
      setAnswers((prevAnswers) => {
        const updated = [...prevAnswers];
        if (countryQuestionIndex >= 0) {
          updated[countryQuestionIndex] = answerValue;
        }
        return updated;
      });
      return newSelection;
    });
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) => {
      const newServices = prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service];
      const answerValue = newServices.join(", ");
      setCurrentAnswer(answerValue);
      setAnswers((prevAnswers) => {
        const updated = [...prevAnswers];
        if (servicesQuestionIndex >= 0) {
          updated[servicesQuestionIndex] = answerValue;
        }
        return updated;
      });
      return newServices;
    });
  };

  // Función genérica para manejar toggle de opciones en preguntas select
  const handleSelectToggle = (questionIndex: number, optionLabel: string) => {
    const selectConfig = getSelectConfig(questionIndex);
    if (!selectConfig) return;

    setSelectSelections((prev) => {
      const currentSelections = prev[questionIndex] || [];
      let newSelections: string[];

      if (selectConfig.multiple) {
        // Selección múltiple: toggle
        newSelections = currentSelections.includes(optionLabel)
          ? currentSelections.filter((s) => s !== optionLabel)
          : [...currentSelections, optionLabel];
      } else {
        // Selección única: reemplazar
        newSelections = currentSelections.includes(optionLabel) ? [] : [optionLabel];
      }

      const answerValue = newSelections.join(", ");
      setCurrentAnswer(answerValue);
      setAnswers((prevAnswers) => {
        const updated = [...prevAnswers];
        updated[questionIndex] = answerValue;
        return updated;
      });

      return {
        ...prev,
        [questionIndex]: newSelections,
      };
    });
  };

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);

    // Limpiar mensaje de validación cuando el usuario empiece a escribir
    if (validationMessage) {
      setValidationMessage(null);
    }

    if (currentQuestionIndex === 0) {
      if (value.trim() === "") {
        setNameError("");
      } else if (!isValidName(value)) {
        setNameError("Por favor, ingresa tu nombre completo (nombre y apellido, mínimo 2 palabras)");
      } else {
        setNameError("");
      }
    }
  };

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const getOrderedSelectedServices = useCallback((servicesList: string[]): string[] => {
    return SERVICES.map((service) => service.name).filter(
      (serviceName) => servicesList.includes(serviceName) && SERVICE_PDF_MAP[serviceName],
    );
  }, []);

  const getPDFFileName = useCallback((institutionName: string): string => {
    const cleanName = institutionName
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    return `propuesta-servicios-${cleanName || "empresa"}.pdf`;
  }, []);

  const generatePDFInBackground = useCallback(
    async (servicesList: string[], institutionName: string = ""): Promise<void> => {
      try {
        const orderedServices = getOrderedSelectedServices(servicesList);

        const allFileIds = [PDF_FILES.COVER];

        const isOnboardingPackage =
          servicesList.length === 3 &&
          servicesList.includes("Autenticación") &&
          servicesList.includes("Identidad") &&
          servicesList.includes("AML (prevención de lavado de dinero)");

        if (isOnboardingPackage) {
          allFileIds.push(PDF_FILES.ONBOARDING);
        }

        orderedServices.forEach((serviceName) => {
          const files = SERVICE_PDF_MAP[serviceName];
          if (files) {
            files.forEach((fileId) => {
              if (!allFileIds.includes(fileId)) {
                allFileIds.push(fileId);
              }
            });
          }
        });

        allFileIds.push(PDF_FILES.BACK_COVER);

        const response = await fetch("/api/combine-pdfs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileIds: allFileIds,
            fileName: getPDFFileName(institutionName),
            clientName: institutionName,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al generar PDF: ${response.status}`);
        }

        const blob = await response.blob();
        setPreGeneratedPDF(blob);
      } catch (error) {
        throw error;
      }
    },
    [getOrderedSelectedServices, getPDFFileName],
  );

  const generateCombinedPDF = useCallback(async () => {
    const institutionName = answers[2] || "";
    const fileName = getPDFFileName(institutionName);

    if (preGeneratedPDF) {
      const url = URL.createObjectURL(preGeneratedPDF);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const savedAnswer = answers[servicesQuestionIndex] || "";
      const services = savedAnswer ? savedAnswer.split(",").map((s) => s.trim()).filter((s) => s) : selectedServices;
      const orderedServices = getOrderedSelectedServices(services);

      const allFileIds = [PDF_FILES.COVER];

      const finalServicesString = answers[servicesQuestionIndex] || "";
      const currentServices = finalServicesString
        ? finalServicesString.split(",").map((s) => s.trim()).filter((s) => s)
        : selectedServices;

      const isOnboardingPackage =
        currentServices.length === 3 &&
        currentServices.includes("Autenticación") &&
        currentServices.includes("Identidad") &&
        currentServices.includes("AML (prevención de lavado de dinero)");

      if (isOnboardingPackage) {
        allFileIds.push(PDF_FILES.ONBOARDING);
      }

      orderedServices.forEach((serviceName) => {
        const files = SERVICE_PDF_MAP[serviceName];
        if (files) {
          files.forEach((fileId) => {
            if (!allFileIds.includes(fileId)) {
              allFileIds.push(fileId);
            }
          });
        }
      });

      allFileIds.push(PDF_FILES.BACK_COVER);

      const response = await fetch("/api/combine-pdfs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileIds: allFileIds,
          fileName,
          clientName: institutionName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al generar PDF: ${response.status}`);
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al generar el PDF combinado. Por favor, intenta nuevamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [selectedServices, answers, preGeneratedPDF, getOrderedSelectedServices, getPDFFileName, servicesQuestionIndex]);

  const submitAnswers = useCallback(
    async (finalAnswers: string[]) => {
      setIsSubmitting(true);

      try {
        const role = isTechnicalForm ? 'technical' : isCommercialForm ? 'commercial' : null;
        if (!role) {
          return;
        }

        // Para formulario técnico, no esperar tiempo de procesamiento (simulado antes)
        if (!isTechnicalForm) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submitForm', formType: role, answers: finalAnswers })
        });
        const result = await res.json();

        if (result.success) {
          const status = result.status || "next";
          if (status === "next" || status === "decline") {
            setSubmissionStatus(status as any);
            if (status === "next") {
              setShowStatusTab(true);
            }
          }
        } else {
          if (result.fieldErrors) {
            alert(`Error en el formulario: ${result.message}`);
          } else {
            alert(result.message || "Error al enviar las respuestas.");
          }
        }

      } catch (error) {
        // Envio fail silencioso en UI si ya se maneja
      } finally {
        setIsSubmitting(false);
      }
    },
    [questions, storageKey, isTechnicalForm, isCommercialForm],
  );

  useEffect(() => {
    if (isCompleted && !isSubmitting && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;

      const finalAnswers = [...answersRef.current];
      if (currentQuestionIndex < questions.length) {
        finalAnswers[currentQuestionIndex] = currentAnswer;
        setAnswers(finalAnswers);
        answersRef.current = finalAnswers;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Para formulario técnico, establecer estado inmediatamente sin delay
      if (isTechnicalForm) {
        setSubmissionStatus("next");
        setShowStatusTab(true);
        setIsSubmitting(false);
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        const answersToSend = currentQuestionIndex < questions.length ? finalAnswers : answersRef.current;

        try {
          await submitAnswers(answersToSend);

          // Solo generar PDF si NO es formulario técnico
          if (!isTechnicalForm) {
            const savedAnswer = answersToSend[servicesQuestionIndex] || "";
            const services = savedAnswer ? savedAnswer.split(",").map((s) => s.trim()).filter((s) => s) : [];
            const institutionName = answersToSend[2] || "";

            if (services.length > 0) {
              generatePDFInBackground(services, institutionName).catch((err) => {
              });
            }
          }
        } catch (error) {
        }

        timeoutRef.current = null;
      }, 500);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [
    isCompleted,
    isSubmitting,
    currentQuestionIndex,
    currentAnswer,
    submitAnswers,
    generatePDFInBackground,
    questions.length,
    servicesQuestionIndex,
    isTechnicalForm,
  ]);


  // Sync with Supabase on answer change
  // Sync with Supabase on answer change via Server Action
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = localStorage.getItem("onboarding_role");

    // Only save if we have a valid role and some answers
    if ((role === 'commercial' || role === 'technical') && answers.some(a => a !== "")) {
      const handler = setTimeout(async () => {
        try {
          await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveProgress', formType: role, answers })
          });
        } catch (err) {
        }
      }, 1000); // Debounce saves

      return () => clearTimeout(handler);
    }
  }, [answers]);

  // Load from Supabase on mount
  // Load from Supabase on mount via Server Action
  useEffect(() => {
    const fetchSupabaseData = async () => {
      if (typeof window === 'undefined') return;
      const role = localStorage.getItem("onboarding_role");

      if (role === 'commercial' || role === 'technical') {
        try {
          const res = await fetch(`/api/onboarding?formType=${role}`);
          const result = await res.json();
          if (result.success && result.answers && Array.isArray(result.answers)) {
            setAnswers(result.answers);
            if (result.answers[0]) setCurrentAnswer(result.answers[0]);
          }
        } catch (e) {
        }
      };
    };

    fetchSupabaseData();
  }, []);

  const totalSteps = questions.length;
  const currentStep = currentQuestionIndex + 1;
  const completedSteps = answers
    .map((answer, index) => (answer.trim() !== "" ? index + 1 : -1))
    .filter((step) => step > 0);

  const handleNext = () => {
    if (isCountryQuestion(currentQuestionIndex)) {
      if (selectedCountries.length === 0) return;
    } else if (isServicesQuestion(currentQuestionIndex)) {
      if (selectedServices.length === 0) return;
    } else if (isSelectQuestion(currentQuestionIndex)) {
      const selections = selectSelections[currentQuestionIndex] || [];
      if (selections.length === 0) return;
    } else if (currentAnswer.trim() === "") {
      return;
    }

    if (currentQuestionIndex === 0) {
      if (!isValidName(currentAnswer)) {
        setNameError("Por favor, ingresa tu nombre completo (nombre y apellido, mínimo 2 palabras)");
        return;
      }
      setNameError("");
    }

    // Validar campos con reglas especiales (solo para campos de texto normales)
    if (!isCountryQuestion(currentQuestionIndex) &&
      !isServicesQuestion(currentQuestionIndex) &&
      !isSelectQuestion(currentQuestionIndex)) {
      const validationError = validateAnswer(currentQuestionIndex, currentAnswer, config);
      if (validationError) {
        setValidationMessage(validationError);
        return;
      }
      setValidationMessage(null);
    }

    const newAnswers = [...answers];
    if (isCountryQuestion(currentQuestionIndex)) {
      newAnswers[currentQuestionIndex] = selectedCountries.join(", ");
    } else if (isServicesQuestion(currentQuestionIndex)) {
      newAnswers[currentQuestionIndex] = selectedServices.join(", ");
    } else if (isSelectQuestion(currentQuestionIndex)) {
      const selections = selectSelections[currentQuestionIndex] || [];
      newAnswers[currentQuestionIndex] = selections.join(", ");
    } else {
      newAnswers[currentQuestionIndex] = currentAnswer;
    }
    setAnswers(newAnswers);

    updateTokens(currentAnswer);

    const nextIndex = getNextQuestionIndex(currentQuestionIndex, currentAnswer);

    if (nextIndex >= questions.length) {
      setIsCompleted(true);
      // Para formulario técnico, no usar animaciones
      if (isTechnicalForm) {
        setIsExiting(false);
        setShowQuestion(true);
      } else {
        setIsExiting(true);
      }
      setIsGoingBack(false);
    } else {
      setIsGoingBack(false);
      setIsExiting(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0 && !isExiting) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);

      setIsGoingBack(true);
      setIsExiting(true);
    }
  };

  const handleAnimationComplete = useCallback(() => {
    if (isExiting) {
      if (isCompleted) {
        setIsExiting(false);
        setShowQuestion(false);
        setTimeout(() => {
          setShowQuestion(true);
        }, 50);
      } else if (isGoingBack) {
        setCurrentQuestionIndex((prevIndex) => {
          const newIndex = prevIndex - 1;
          setCurrentAnswer(answersRef.current[newIndex] || "");
          return newIndex;
        });
        setIsGoingBack(false);
        setIsExiting(false);
        setShowQuestion(false);
        setTimeout(() => {
          setShowQuestion(true);
        }, 50);
      } else {
        setCurrentQuestionIndex((prevIndex) => {
          const currentAnswer = answersRef.current[prevIndex] || "";
          const newIndex = getNextQuestionIndex(prevIndex, currentAnswer);
          setCurrentAnswer(answersRef.current[newIndex] || "");
          return newIndex;
        });
        setIsExiting(false);
        setShowQuestion(false);
        setTimeout(() => {
          setShowQuestion(true);
        }, 50);
      }
    }
  }, [isExiting, isGoingBack, isCompleted]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentAnswer]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const isNextButtonDisabled = useMemo(() => {
    if (!mounted) return true;
    if (isCountryQuestion(currentQuestionIndex)) {
      return isExiting || selectedCountries.length === 0 || nameError !== "" || validationMessage !== null;
    }
    if (isServicesQuestion(currentQuestionIndex)) {
      return isExiting || selectedServices.length === 0 || validationMessage !== null;
    }
    if (isSelectQuestion(currentQuestionIndex)) {
      const selections = selectSelections[currentQuestionIndex] || [];
      return isExiting || selections.length === 0 || validationMessage !== null;
    }
    return isExiting || currentAnswer.trim() === "" || nameError !== "" || validationMessage !== null;
  }, [mounted, isExiting, currentAnswer, currentQuestionIndex, selectedCountries, selectedServices, nameError, validationMessage, selectSelections]);

  // Verificar si es la última pregunta
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Client-side validation removed in favor of Server Action validation


  // Función para manejar el clic en Finalizar
  const handleFinalize = async () => {
    // Guardar la respuesta actual antes de verificar
    const newAnswers = [...answers];
    if (isCountryQuestion(currentQuestionIndex)) {
      newAnswers[currentQuestionIndex] = selectedCountries.join(", ");
    } else if (isServicesQuestion(currentQuestionIndex)) {
      newAnswers[currentQuestionIndex] = selectedServices.join(", ");
    } else if (isSelectQuestion(currentQuestionIndex)) {
      const selections = selectSelections[currentQuestionIndex] || [];
      newAnswers[currentQuestionIndex] = selections.join(", ");
    } else {
      newAnswers[currentQuestionIndex] = currentAnswer;
    }
    setAnswers(newAnswers);
    answersRef.current = newAnswers;

    // Mostrar estado de carga
    setIsSubmitting(true);
    setValidationMessage(null);

    try {
      const role = localStorage.getItem("onboarding_role");
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', formType: role, answers: newAnswers })
      });
      const result = await res.json();

      if (result.success) {
        if (result.status === 'decline') {
          setSubmissionStatus("decline");
          setIsCompleted(true);
          setIsExiting(false);
          setShowQuestion(true);
          setIsSubmitting(false);
          setShowConfirmModal(false);
        } else {
          // Success - 'next'
          setIsCompleted(true);
          setIsExiting(false);
          setShowQuestion(true);
          setIsSubmitting(false);
          hasSubmittedRef.current = false;

          // Optionally show the status tab if that's the desired UI
          setSubmissionStatus("next");
          setShowConfirmModal(false);
        }
      } else {
        setValidationMessage(result.message || "Error al finalizar.");
        setIsSubmitting(false);
      }

    } catch (error) {
      setValidationMessage("Ocurrió un error inesperado. Intente nuevamente.");
      setIsSubmitting(false);
    }
  };

  const calculateReward = (answer: string): number => {
    const BASE_REWARD = 10;
    const lengthBonus = Math.min(Math.floor(answer.length / 5), 50);
    const complexWords = ["porque", "para", "mediante", "actualmente", "proyecto", "objetivo"];
    const qualityBonus = complexWords.some((w) => answer.toLowerCase().includes(w)) ? 10 : 0;

    return BASE_REWARD + lengthBonus + qualityBonus;
  };

  const updateTokens = (answer: string) => {
    const currentReward = calculateReward(answer);
    const previousReward = awardedTokens[currentQuestionIndex] || 0;
    const difference = currentReward - previousReward;

    if (difference !== 0) {
      setTokenBalance((prev) => prev + difference);
      setLastAddedTokens(difference);

      setAwardedTokens((prev) => ({
        ...prev,
        [currentQuestionIndex]: currentReward,
      }));
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <TokenWallet balance={tokenBalance} addedAmount={lastAddedTokens} onAnimationComplete={() => setLastAddedTokens(0)} />

      {isSubmitting && !isTechnicalForm && <HexagonLoader />}

      <div className="absolute inset-0 animated-gradient" />
      <AnimatedHalftoneBackground isDark={false} fullScreen={true} intensity={0.8} brightness={1} className="z-0" />
      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
        {!isCompleted && (
          <div className="pt-2 pb-1 sm:pt-3 sm:pb-2 md:pt-4 md:pb-2 lg:pt-5 lg:pb-3">
            <FocusedProgressBar totalSteps={totalSteps} currentStep={currentStep} completedSteps={completedSteps} />
          </div>
        )}

        <div className="flex-1 flex items-start justify-center py-2 sm:py-4 md:py-8 overflow-y-auto">
          <div className="flex flex-col px-3 sm:px-6 md:px-8 lg:px-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl pt-8 sm:pt-12 md:pt-16 lg:pt-20 pb-24 sm:pb-28 md:pb-32">
            {isCompleted && !isSubmitting ? (
              showQuestion && (
                <>
                  {submissionStatus === "decline" ? (
                    <div className="w-full">
                      <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 text-center">
                        {DECLINE_MESSAGE}
                      </h2>
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => {
                            localStorage.removeItem("onboarding_role");
                            localStorage.removeItem("onboarding_company_id");
                            window.location.href = "/";
                          }}
                          className="bg-red-500/80 hover:bg-red-600 text-white py-4 px-8 rounded-xl font-medium transition-all duration-300"
                        >
                          Salir
                        </button>
                      </div>
                    </div>
                  ) : submissionStatus === "next" ? (
                    <div className="w-full">
                      {(() => {
                        const role = typeof window !== 'undefined' ? localStorage.getItem('onboarding_role') : null;
                        const isTechnical = role === 'technical';

                        if (isTechnical) {
                          return (
                            <div className="w-full">
                              <h2 className="text-slate-900 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 text-center">
                                ¡Muchas gracias por completar el cuestionario técnico!
                              </h2>
                              <div className="flex flex-col sm:flex-row gap-4 w-full mt-8">
                                <button
                                  onClick={() => {
                                    setIsCompleted(false);
                                    setCurrentQuestionIndex(0);
                                    setShowQuestion(true);
                                    setIsExiting(false);
                                    setSubmissionStatus(null);
                                    setShowStatusTab(false);
                                    hasSubmittedRef.current = false;
                                  }}
                                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-900 py-4 px-6 rounded-xl font-medium transition-all duration-300"
                                >
                                  Volver a la pregunta 1
                                </button>
                                <button
                                  onClick={() => {
                                    localStorage.removeItem("onboarding_role");
                                    localStorage.removeItem("onboarding_company_id");
                                    window.location.href = "/";
                                  }}
                                  className="flex-1 bg-red-500/80 hover:bg-red-600 text-white py-4 px-6 rounded-xl font-medium transition-all duration-300"
                                >
                                  Salir
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <>
                            <AnimatedQuestion
                              question={THANK_YOU_MESSAGE}
                              isExiting={false}
                              isGoingBack={false}
                              isFirstQuestion={false}
                              animationsEnabled={animationsEnabled}
                              onAnimationComplete={() => { }}
                            />
                            <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 mt-8">
                              <div className="mt-4 sm:mt-6 md:mt-8">
                                <p className="text-white text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-6 font-medium">
                                  Mientras tanto, te invitamos a visitar nuestro sitio de documentación para conocer más sobre nuestros
                                  servicios:
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5">
                                  <a
                                    href={DOCS_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-purple-500 hover:bg-purple-600 text-white text-base sm:text-lg md:text-xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
                                  >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </>
              )
            ) : (
              <>
                {showQuestion && (
                  <AnimatedQuestion
                    question={questions[currentQuestionIndex]}
                    isExiting={isExiting}
                    isGoingBack={isGoingBack}
                    isFirstQuestion={currentQuestionIndex === 0}
                    animationsEnabled={animationsEnabled}
                    onAnimationComplete={handleAnimationComplete}
                  />
                )}

                <div className="w-full">
                  {isCountryQuestion(currentQuestionIndex) ? (
                    <div className="w-full">
                      <p className="text-slate-600 text-sm sm:text-base mb-4">Selecciona uno o varios países</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {COUNTRY_OPTIONS.map((country) => (
                          <label
                            key={country}
                            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedCountries.includes(country)
                              ? "bg-purple-50 text-slate-900"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                              } ${isExiting ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCountries.includes(country)}
                              onChange={() => handleCountryToggle(country)}
                              disabled={isExiting}
                              className="w-4 h-4 sm:w-5 sm:h-5 accent-purple-500 cursor-pointer"
                            />
                            <span className="text-sm sm:text-base font-medium select-none">{country}</span>
                          </label>
                        ))}
                      </div>
                      {selectedCountries.length === 0 && (
                        <p className="text-slate-500 text-sm sm:text-base mt-4">Selecciona al menos un país</p>
                      )}
                    </div>
                  ) : isBudgetQuestion(currentQuestionIndex) ? (
                    <div className="w-full flex flex-col items-center">
                      <p className="text-slate-600 text-sm sm:text-base mb-4">Selecciona una opción</p>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {["Sí", "No"].map((option) => (
                          <label
                            key={option}
                            className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg cursor-pointer transition-all duration-200 ${currentAnswer === option
                              ? "bg-purple-50 text-slate-900"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                              } ${isExiting ? "opacity-50 cursor-not-allowed" : ""}`}
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
                            <span className="text-base sm:text-lg md:text-xl font-medium select-none">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : isServicesQuestion(currentQuestionIndex) ? (
                    <div className="w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                        {SERVICES.map((service) => (
                          <label
                            key={service.name}
                            className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 ${selectedServices.includes(service.name)
                              ? "bg-purple-50 text-slate-900"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                              } ${isExiting ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service.name)}
                              onChange={() => handleServiceToggle(service.name)}
                              disabled={isExiting}
                              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 accent-purple-500 cursor-pointer mt-0.5 sm:mt-1 flex-shrink-0"
                            />
                            <div className="flex flex-col gap-1">
                              <span className="text-sm sm:text-base md:text-lg font-medium select-none">{service.name}</span>
                              <span className="text-xs sm:text-sm text-slate-500 select-none leading-tight">
                                {service.description}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 sm:mt-6 flex justify-center">
                        <a
                          href="https://www.zelify.com/clips"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-purple-500 hover:bg-purple-600 text-white text-sm sm:text-base font-medium rounded-lg transition-all duration-300"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Ver demo
                        </a>
                      </div>
                      {selectedServices.length === 0 && (
                        <p className="text-slate-500 text-sm sm:text-base mt-4">Selecciona al menos un servicio</p>
                      )}
                    </div>
                  ) : isSelectQuestion(currentQuestionIndex) ? (
                    <div className="w-full">
                      {(() => {
                        const selectConfig = getSelectConfig(currentQuestionIndex);
                        if (!selectConfig) return null;
                        const currentSelections = selectSelections[currentQuestionIndex] || [];
                        const hasDescriptions = selectConfig.options.some((opt) => opt.description);

                        return (
                          <>
                            <p className="text-slate-600 text-sm sm:text-base mb-4">
                              {selectConfig.multiple ? "Selecciona una o varias opciones" : "Selecciona una opción"}
                            </p>
                            <div
                              className={`overflow-y-auto max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] pr-2 -mr-2 ${hasDescriptions
                                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 md:gap-3.5"
                                : selectConfig.multiple
                                  ? "grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3"
                                  : "flex flex-col sm:flex-row gap-3 sm:gap-4"
                                }`}
                              style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(168, 85, 247, 0.5) transparent'
                              }}
                            >
                              {selectConfig.options.map((option) => {
                                const isSelected = currentSelections.includes(option.label);
                                return (
                                  <label
                                    key={option.label}
                                    className={`flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                                      ? "bg-purple-50 text-slate-900"
                                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                      } ${isExiting ? "opacity-50 cursor-not-allowed" : ""}`}
                                  >
                                    <input
                                      type={selectConfig.multiple ? "checkbox" : "radio"}
                                      name={selectConfig.multiple ? undefined : `select-${currentQuestionIndex}`}
                                      checked={isSelected}
                                      onChange={() => handleSelectToggle(currentQuestionIndex, option.label)}
                                      disabled={isExiting}
                                      className={`${selectConfig.multiple
                                        ? "w-4 h-4 sm:w-4 sm:h-4 accent-purple-500 cursor-pointer mt-0.5 flex-shrink-0"
                                        : "w-4 h-4 sm:w-5 sm:h-5 accent-purple-500 cursor-pointer"
                                        }`}
                                    />
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs sm:text-sm md:text-base font-medium select-none leading-tight">
                                        {option.label}
                                      </span>
                                      {option.description && (
                                        <span className="text-xs text-white/60 select-none leading-tight">
                                          {option.description}
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                            {currentSelections.length === 0 && (
                              <p className="text-white/50 text-sm sm:text-base mt-4">
                                {selectConfig.multiple ? "Selecciona al menos una opción" : "Selecciona una opción"}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className={`w-full bg-transparent text-slate-600 text-lg sm:text-lg md:text-xl lg:text-2xl text-left outline-none border-none focus:border-none focus:ring-0 placeholder-slate-400 focus:placeholder-slate-300 transition-all resize-none overflow-hidden min-h-[1.5em] ${nameError ? "placeholder-red-400/70" : ""
                        }`}
                      placeholder={placeholders[currentQuestionIndex] || ""}
                      disabled={isExiting}
                      rows={1}
                    />
                  )}
                  {validationMessage && !isCountryQuestion(currentQuestionIndex) && !isServicesQuestion(currentQuestionIndex) && !isSelectQuestion(currentQuestionIndex) && (
                    <p className="text-red-500 text-sm sm:text-base mt-2 font-medium">{validationMessage}</p>
                  )}
                  {nameError && <p className="text-red-400 text-sm sm:text-base mt-2">{nameError}</p>}
                </div>

                <div className="h-2 sm:h-3 md:h-4 lg:h-5" />

                <div className="w-full h-1 bg-purple-500 rounded-full" />

                <div className="flex justify-between items-center gap-2 sm:gap-0 mt-4 sm:mt-6 md:mt-8 lg:mt-10">
                  {currentQuestionIndex > 0 && (
                    <button
                      onClick={handlePrevious}
                      disabled={isExiting}
                      className="flex items-center gap-1 sm:gap-2 md:gap-3 px-4 sm:px-6 md:px-8 lg:px-10 py-1 sm:py-1.5 md:py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100/50 disabled:cursor-not-allowed text-slate-900 text-sm sm:text-base md:text-lg lg:text-xl font-medium rounded-lg transition-all duration-300"
                      title="Retroceder"
                    >
                      &lt;
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                  )}

                  {isCommercialForm && isLastQuestion ? (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isNextButtonDisabled}
                      className={`flex items-center gap-1 sm:gap-2 md:gap-3 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-1 sm:py-1.5 md:py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white text-base sm:text-lg md:text-xl lg:text-2xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 ${currentQuestionIndex === 0 ? "ml-auto" : ""
                        }`}
                    >
                      Finalizar
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={isNextButtonDisabled}
                      className={`flex items-center gap-1 sm:gap-2 md:gap-3 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-1 sm:py-1.5 md:py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white text-base sm:text-lg md:text-xl lg:text-2xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 ${currentQuestionIndex === 0 ? "ml-auto" : ""
                        }`}
                    >
                      <Image
                        src={iconAlaiza}
                        alt="Alaiza AI Logo"
                        width={20}
                        height={20}
                        className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 brightness-0 invert"
                      />
                      &gt;
                    </button>
                  )}
                </div>
              </>
            )}
          </div >
        </div >
      </div >

      {showStatusTab && submissionStatus === "next" && !isSubmitting && (
        <div className="fixed bottom-0 right-0 z-50 animate-slide-up">
          <div className="bg-green-500 text-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 rounded-tl-2xl shadow-2xl max-w-sm sm:max-w-md md:max-w-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-sm sm:text-base md:text-lg">¡Aprobado!</p>
                  <p className="text-xs sm:text-sm md:text-base text-green-50 mt-1">Tu solicitud ha sido enviada exitosamente</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusTab(false)}
                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                aria-label="Cerrar notificación"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {!isCompleted && <AnimationToggle onToggle={setAnimationsEnabled} />}

      {/* Botón "Finalizar" fijo en la parte inferior solo para formulario comercial - visible en todas las preguntas */}
      {!isCompleted && isCommercialForm && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-50 pt-4 pb-4 sm:pb-6 px-3 sm:px-6 md:px-8 lg:px-10">
          <div className="max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto flex justify-center">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isNextButtonDisabled}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-3.5 md:py-4 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white text-base sm:text-lg md:text-xl lg:text-2xl font-medium rounded-lg transition-all duration-300"
            >
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación para formulario comercial */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 md:p-10 max-w-md w-full mx-4">
            <h3 className="text-slate-900 text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">
              ¿Estás seguro de finalizar este cuestionario?
            </h3>
            <p className="text-slate-700 text-base sm:text-lg mb-6 sm:mb-8 text-center">
              Se va a generar una propuesta comercial con base en tus respuestas.
            </p>

            {validationMessage && (
              <div className="mb-4 sm:mb-6 p-4 bg-red-50 rounded-lg">
                <p className="text-red-700 text-sm sm:text-base text-center leading-relaxed">
                  {validationMessage}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleFinalize}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 sm:py-4 px-6 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 disabled:bg-purple-500/50 disabled:cursor-not-allowed"
                disabled={!!validationMessage}
              >
                Sí, estoy seguro
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setValidationMessage(null);
                }}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-900 py-3 sm:py-4 px-6 rounded-xl font-medium transition-all duration-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
