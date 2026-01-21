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

type OnboardingFormProps = {
  config: FormConfig;
};

// Servicios disponibles para la pregunta de servicios - REORDERED
const SERVICES = [
  { name: "Autenticación", description: "Autenticación segura y gestión de accesos" },
  { name: "Identidad", description: "Verificación y validación de identidad" },
  { name: "AML (prevención de lavado de dinero)", description: "Prevención de lavado de activos/antifraude y cumplimiento" },
  { name: "Conexión", description: "Integración y conexión con sistemas externos" },
  { name: "Transferencias", description: "Transferencias bancarias y transacciones" },
  { name: "Transacciones Internacionales", description: "Procesamiento de transacciones financieras internacionales" },
  { name: "Pagos", description: "Sistema de pagos y cobros digitales" },
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
  Transferencias: [PDF_FILES.TRANSFERS],
  "Transacciones Internacionales": [PDF_FILES.TX_INT],
  Pagos: [PDF_FILES.PAYMENTS],
  Descuentos: [PDF_FILES.DISCOUNT],
  "Alaiza IA": [PDF_FILES.ALAIZA],
  Tarjetas: [PDF_FILES.CARDS],
};

const THANK_YOU_MESSAGE =
  "Muchas gracias por tus respuestas. Estamos procesando tu información. Un ejecutivo coordinará una reunión introductoria para la presentación de los productos y servicios de Zelify en Ecuador.";

const DECLINE_MESSAGE =
  "Muchas gracias por tus respuestas. Estaremos revisando la información proporcionada, nos pondremos en contacto.";

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

  const loadAnswersFromStorage = (): string[] => {
    if (typeof window === "undefined") return Array(questions.length).fill("");
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedAnswers = Array(questions.length).fill("");
        parsed.forEach((answer: string, index: number) => {
          if (index < questions.length) {
            loadedAnswers[index] = answer;
          }
        });
        return loadedAnswers;
      }
    } catch (error) {
      console.error("Error al cargar respuestas desde localStorage:", error);
    }
    return Array(questions.length).fill("");
  };

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
  const [answers, setAnswers] = useState<string[]>(loadAnswersFromStorage);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(answers));
      } catch (error) {
        console.error("Error al guardar respuestas en localStorage:", error);
      }
    }
  }, [answers, storageKey]);

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
        console.error("❌ [PDF] Error al generar PDF plano:", error);
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
      console.error(" [PDF] Error al generar PDF combinado:", error);
      alert("Error al generar el PDF combinado. Por favor, intenta nuevamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [selectedServices, answers, preGeneratedPDF, getOrderedSelectedServices, getPDFFileName, servicesQuestionIndex]);

  const submitAnswers = useCallback(
    async (finalAnswers: string[]) => {
      setIsSubmitting(true);

      try {
        const data = {
          questions: questions.map((question, index) => ({
            questionNumber: index + 1,
            question,
            answer: finalAnswers[index] || "",
          })),
          submittedAt: new Date().toISOString(),
        };

        console.log("📤 [ENVÍO] Enviando respuestas a la API...", {
          totalPreguntas: data.questions.length,
          timestamp: data.submittedAt,
        });

        await new Promise((resolve) => setTimeout(resolve, 10000));
        const response = {
          ok: true,
          json: async () => ({ status: "next" }),
        };

        const result = await response.json();

        if (result.status === "next" || result.status === "decline") {
          setSubmissionStatus(result.status);
          if (result.status === "next") {
            setShowStatusTab(true);
          }
        }

        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(storageKey);
          } catch (error) {
            console.error("Error al limpiar localStorage:", error);
          }
        }
      } catch (error) {
        console.error("❌ [ENVÍO] Error al enviar las respuestas:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [questions, storageKey],
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

      timeoutRef.current = setTimeout(async () => {
        const answersToSend = currentQuestionIndex < questions.length ? finalAnswers : answersRef.current;

        try {
          await submitAnswers(answersToSend);

          const savedAnswer = answersToSend[servicesQuestionIndex] || "";
          const services = savedAnswer ? savedAnswer.split(",").map((s) => s.trim()).filter((s) => s) : [];
          const institutionName = answersToSend[2] || "";

          if (services.length > 0) {
            generatePDFInBackground(services, institutionName).catch((err) => {
              console.error("Error al generar PDF en segundo plano:", err);
            });
          }
        } catch (error) {
          console.error("❌ [ENVÍO] Error en el proceso:", error);
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
  ]);

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
        setNameError("Por favor ingresa tu nombre completo (nombre y apellido, mínimo 2 palabras)");
        return;
      }
      setNameError("");
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
      setIsExiting(true);
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
      return isExiting || selectedCountries.length === 0 || nameError !== "";
    }
    if (isServicesQuestion(currentQuestionIndex)) {
      return isExiting || selectedServices.length === 0;
    }
    if (isSelectQuestion(currentQuestionIndex)) {
      const selections = selectSelections[currentQuestionIndex] || [];
      return isExiting || selections.length === 0;
    }
    return isExiting || currentAnswer.trim() === "" || nameError !== "";
  }, [mounted, isExiting, currentAnswer, currentQuestionIndex, selectedCountries, selectedServices, nameError, selectSelections]);

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

      {isSubmitting && <HexagonLoader />}

      <div className="absolute inset-0 animated-gradient" />
      <AnimatedHalftoneBackground isDark={true} fullScreen={true} intensity={0.6} brightness={0.8} className="z-0" />
      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
        {!isCompleted && (
          <div className="pt-2 pb-1 sm:pt-3 sm:pb-2 md:pt-4 md:pb-2 lg:pt-5 lg:pb-3">
            <FocusedProgressBar totalSteps={totalSteps} currentStep={currentStep} completedSteps={completedSteps} />
          </div>
        )}

        <div className="flex-1 flex items-center justify-center py-2 sm:py-4 md:py-8">
          <div className="flex flex-col px-3 sm:px-6 md:px-8 lg:px-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
            {isCompleted && !isSubmitting ? (
              showQuestion && (
                <>
                  {submissionStatus === "decline" ? (
                    <AnimatedQuestion
                      question={DECLINE_MESSAGE}
                      isExiting={false}
                      isGoingBack={false}
                      isFirstQuestion={false}
                      animationsEnabled={animationsEnabled}
                      onAnimationComplete={() => { }}
                    />
                  ) : submissionStatus === "next" ? (
                    <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">
                      <AnimatedQuestion
                        question={THANK_YOU_MESSAGE}
                        isExiting={false}
                        isGoingBack={false}
                        isFirstQuestion={false}
                        animationsEnabled={animationsEnabled}
                        onAnimationComplete={() => { }}
                      />
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
                          <button
                            onClick={generateCombinedPDF}
                            disabled={
                              isGeneratingPDF ||
                              (() => {
                                const savedAnswer = answers[servicesQuestionIndex] || "";
                                const services = savedAnswer
                                  ? savedAnswer.split(",").map((s) => s.trim()).filter((s) => s)
                                  : selectedServices;
                                return services.filter((service) => SERVICE_PDF_MAP[service]).length === 0;
                              })()
                            }
                            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white text-base sm:text-lg md:text-xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70"
                            title={
                              preGeneratedPDF
                                ? "PDF listo para descargar (pre-generado)"
                                : isGeneratingPDF
                                  ? "Generando PDF..."
                                  : undefined
                            }
                          >
                            {preGeneratedPDF ? (
                              <>
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Generar Propuesta (Listo)
                              </>
                            ) : (
                              <>
                                <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                {isGeneratingPDF ? "Generando..." : "Generar Propuesta"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AnimatedQuestion
                      question={THANK_YOU_MESSAGE}
                      isExiting={false}
                      isGoingBack={false}
                      isFirstQuestion={false}
                      animationsEnabled={animationsEnabled}
                      onAnimationComplete={() => { }}
                    />
                  )}
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
                      <p className="text-white/60 text-sm sm:text-base mb-4">Selecciona uno o varios países</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {COUNTRY_OPTIONS.map((country) => (
                          <label
                            key={country}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedCountries.includes(country)
                              ? "bg-purple-500/20 border-purple-500 text-white"
                              : "bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10"
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
                        <p className="text-white/50 text-sm sm:text-base mt-4">Selecciona al menos un país</p>
                      )}
                    </div>
                  ) : isBudgetQuestion(currentQuestionIndex) ? (
                    <div className="w-full flex flex-col items-center">
                      <p className="text-white/50 text-sm sm:text-base mb-4">Selecciona una opción</p>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {["Sí", "No"].map((option) => (
                          <label
                            key={option}
                            className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 ${currentAnswer === option
                              ? "bg-purple-500/20 border-purple-500 text-white"
                              : "bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10"
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
                            className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedServices.includes(service.name)
                              ? "bg-purple-500/20 border-purple-500 text-white"
                              : "bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10"
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
                              <span className="text-xs sm:text-sm text-white/60 select-none leading-tight">
                                {service.description}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {selectedServices.length === 0 && (
                        <p className="text-white/50 text-sm sm:text-base mt-4">Selecciona al menos un servicio</p>
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
                            <p className="text-white/60 text-sm sm:text-base mb-4">
                              {selectConfig.multiple ? "Selecciona una o varias opciones" : "Selecciona una opción"}
                            </p>
                            <div
                              className={
                                hasDescriptions
                                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5"
                                  : selectConfig.multiple
                                    ? "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
                                    : "flex flex-col sm:flex-row gap-4 sm:gap-6"
                              }
                            >
                              {selectConfig.options.map((option) => {
                                const isSelected = currentSelections.includes(option.label);
                                return (
                                  <label
                                    key={option.label}
                                    className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
                                      ? "bg-purple-500/20 border-purple-500 text-white"
                                      : "bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10"
                                      } ${isExiting ? "opacity-50 cursor-not-allowed" : ""}`}
                                  >
                                    <input
                                      type={selectConfig.multiple ? "checkbox" : "radio"}
                                      name={selectConfig.multiple ? undefined : `select-${currentQuestionIndex}`}
                                      checked={isSelected}
                                      onChange={() => handleSelectToggle(currentQuestionIndex, option.label)}
                                      disabled={isExiting}
                                      className={`${selectConfig.multiple
                                        ? "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 accent-purple-500 cursor-pointer mt-0.5 sm:mt-1 flex-shrink-0"
                                        : "w-5 h-5 sm:w-6 sm:h-6 accent-purple-500 cursor-pointer"
                                        }`}
                                    />
                                    <div className="flex flex-col gap-1">
                                      <span className="text-sm sm:text-base md:text-lg font-medium select-none">
                                        {option.label}
                                      </span>
                                      {option.description && (
                                        <span className="text-xs sm:text-sm text-white/60 select-none leading-tight">
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
                      className={`w-full bg-transparent text-white text-lg sm:text-lg md:text-xl lg:text-2xl text-left outline-none border-none focus:border-none focus:ring-0 placeholder-white/50 focus:placeholder-white/30 transition-all resize-none overflow-hidden min-h-[1.5em] ${nameError ? "placeholder-red-400/70" : ""
                        }`}
                      placeholder={placeholders[currentQuestionIndex] || ""}
                      disabled={isExiting}
                      rows={1}
                    />
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
                      className="flex items-center gap-1 sm:gap-2 md:gap-3 px-4 sm:px-6 md:px-8 lg:px-10 py-1 sm:py-1.5 md:py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white text-sm sm:text-base md:text-lg lg:text-xl font-medium rounded-lg transition-all duration-300"
                      title="Retroceder"
                    >
                      &lt;
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                  )}

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
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
