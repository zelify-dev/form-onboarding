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
import { supabase } from "../lib/supabase";
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

        // Para formulario técnico, no esperar tiempo de procesamiento
        if (!isTechnicalForm) {
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
        
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


      } catch (error) {
        console.error("❌ [ENVÍO] Error al enviar las respuestas:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [questions, storageKey, isTechnicalForm],
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
                console.error("Error al generar PDF en segundo plano:", err);
              });
            }
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
    isTechnicalForm,
  ]);


  // Sync with Supabase on answer change
  useEffect(() => {
    const companyId = localStorage.getItem("onboarding_company_id");
    const role = localStorage.getItem("onboarding_role");

    if (companyId && role && answers.some(a => a !== "")) {
      const handler = setTimeout(async () => {
        try {
          await supabase
            .from('form_submissions')
            .upsert(
              {
                company_id: companyId,
                role: role,
                answers: JSON.stringify(answers),
                updated_at: new Date().toISOString()
              },
              { onConflict: 'company_id, role' }
            );
        } catch (err) {
          console.error("Error syncing to Supabase:", err);
        }
      }, 1000); // Debounce saves

      return () => clearTimeout(handler);
    }
  }, [answers]);

  // Load from Supabase on mount
  useEffect(() => {
    const fetchSupabaseData = async () => {
      const companyId = localStorage.getItem("onboarding_company_id");
      const role = localStorage.getItem("onboarding_role");

      if (companyId && role) {
        const { data, error } = await supabase
          .from('form_submissions')
          .select('answers')
          .eq('company_id', companyId)
          .eq('role', role)
          .single();

        if (data && data.answers) {
          try {
            // Handle if answers is string (JSON) or object (JSONB auto-parsed)
            const parsed = typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers;
            // Verify it's an array
            if (Array.isArray(parsed)) {
              setAnswers(parsed);
              if (parsed[0]) setCurrentAnswer(parsed[0]);
            }
          } catch (e) {
            console.error("Error parsing Supabase answers", e);
          }
        }
      }
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

  // Verificar si es la última pregunta
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Función para verificar si ambos formularios están completos
  const checkBothFormsComplete = async (): Promise<{ bothComplete: boolean; missingForms: string[] }> => {
    const companyId = localStorage.getItem("onboarding_company_id");
    if (!companyId) {
      console.log("❌ [VALIDACIÓN] No hay company_id");
      return { bothComplete: false, missingForms: ['commercial', 'technical'] };
    }

    try {
      // Obtener ambos formularios
      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select('role, answers')
        .eq('company_id', companyId)
        .in('role', ['commercial', 'technical']);

      if (error) {
        console.error("❌ [VALIDACIÓN] Error checking forms:", error);
        return { bothComplete: false, missingForms: ['commercial', 'technical'] };
      }

      console.log("📋 [VALIDACIÓN] Submissions encontradas:", submissions?.length || 0);

      const commercialSubmission = submissions?.find(s => s.role === 'commercial');
      const technicalSubmission = submissions?.find(s => s.role === 'technical');

      const missingForms: string[] = [];
      
      // Verificar formulario comercial - usar la longitud real del array de preguntas del formulario comercial
      const expectedCommercialQuestions = COMERCIAL_FORM.questions.length;
      
      if (!commercialSubmission || !commercialSubmission.answers) {
        console.log("❌ [VALIDACIÓN] Formulario comercial no existe o no tiene respuestas");
        missingForms.push('commercial');
      } else {
        let commercialAnswers: string[] = [];
        try {
          commercialAnswers = typeof commercialSubmission.answers === 'string' 
            ? JSON.parse(commercialSubmission.answers) 
            : commercialSubmission.answers;
          
          if (!Array.isArray(commercialAnswers)) {
            console.log("❌ [VALIDACIÓN] Respuestas comerciales no son un array:", commercialAnswers);
            missingForms.push('commercial');
          } else {
            const answerCount = commercialAnswers.length;
            // Verificar que todas las preguntas hasta el número esperado tengan respuestas no vacías
            const filledAnswers = commercialAnswers
              .slice(0, expectedCommercialQuestions)
              .filter((a: any) => {
                if (a === null || a === undefined) return false;
                const str = String(a).trim();
                return str !== '' && str !== 'null' && str !== 'undefined';
              }).length;
            
            console.log(`📊 [VALIDACIÓN] Comercial: ${filledAnswers}/${expectedCommercialQuestions} preguntas respondidas (total en array: ${answerCount})`);
            console.log(`📊 [VALIDACIÓN] Respuestas comerciales:`, commercialAnswers.slice(0, 5), '...');
            
            // Verificar que tenga al menos el número esperado de respuestas y que todas estén llenas
            const commercialComplete = answerCount >= expectedCommercialQuestions &&
              filledAnswers === expectedCommercialQuestions;
            
            if (!commercialComplete) {
              console.log(`❌ [VALIDACIÓN] Formulario comercial incompleto: ${filledAnswers}/${expectedCommercialQuestions} (array length: ${answerCount})`);
              // Mostrar qué preguntas están vacías
              const emptyIndices: number[] = [];
              for (let i = 0; i < expectedCommercialQuestions; i++) {
                const answer = commercialAnswers[i];
                if (!answer || String(answer).trim() === '' || String(answer).trim() === 'null' || String(answer).trim() === 'undefined') {
                  emptyIndices.push(i + 1);
                }
              }
              if (emptyIndices.length > 0) {
                console.log(`❌ [VALIDACIÓN] Preguntas vacías en comercial:`, emptyIndices.slice(0, 10));
              }
              missingForms.push('commercial');
            } else {
              console.log("✅ [VALIDACIÓN] Formulario comercial completo");
            }
          }
        } catch (parseError) {
          console.error("❌ [VALIDACIÓN] Error parseando respuestas comerciales:", parseError);
          missingForms.push('commercial');
        }
      }

      // Verificar formulario técnico - necesitamos obtener el número correcto de preguntas
      // Para el técnico, usamos 13 como está definido en TECH_QUESTIONS
      const expectedTechnicalQuestions = 13;
      
      if (!technicalSubmission || !technicalSubmission.answers) {
        console.log("❌ [VALIDACIÓN] Formulario técnico no existe o no tiene respuestas");
        missingForms.push('technical');
      } else {
        let technicalAnswers: string[] = [];
        try {
          technicalAnswers = typeof technicalSubmission.answers === 'string' 
            ? JSON.parse(technicalSubmission.answers) 
            : technicalSubmission.answers;
          
          if (!Array.isArray(technicalAnswers)) {
            console.log("❌ [VALIDACIÓN] Respuestas técnicas no son un array:", technicalAnswers);
            missingForms.push('technical');
          } else {
            const answerCount = technicalAnswers.length;
            const filledAnswers = technicalAnswers
              .slice(0, expectedTechnicalQuestions)
              .filter((a: any) => {
                if (a === null || a === undefined) return false;
                const str = String(a).trim();
                return str !== '' && str !== 'null' && str !== 'undefined';
              }).length;
            
            console.log(`📊 [VALIDACIÓN] Técnico: ${filledAnswers}/${expectedTechnicalQuestions} preguntas respondidas (total en array: ${answerCount})`);
            
            const technicalComplete = answerCount >= expectedTechnicalQuestions &&
              filledAnswers === expectedTechnicalQuestions;
            
            if (!technicalComplete) {
              console.log(`❌ [VALIDACIÓN] Formulario técnico incompleto: ${filledAnswers}/${expectedTechnicalQuestions} (array length: ${answerCount})`);
              missingForms.push('technical');
            } else {
              console.log("✅ [VALIDACIÓN] Formulario técnico completo");
            }
          }
        } catch (parseError) {
          console.error("❌ [VALIDACIÓN] Error parseando respuestas técnicas:", parseError);
          missingForms.push('technical');
        }
      }

      console.log(`📋 [VALIDACIÓN] Resultado final: ${missingForms.length === 0 ? '✅ Ambos completos' : '❌ Faltan: ' + missingForms.join(', ')}`);

      return {
        bothComplete: missingForms.length === 0,
        missingForms
      };
    } catch (error) {
      console.error("❌ [VALIDACIÓN] Error checking forms:", error);
      return { bothComplete: false, missingForms: ['commercial', 'technical'] };
    }
  };

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

    // Guardar en Supabase antes de verificar
    const companyId = localStorage.getItem("onboarding_company_id");
    const role = localStorage.getItem("onboarding_role");
    if (companyId && role) {
      try {
        await supabase
          .from('form_submissions')
          .upsert(
            {
              company_id: companyId,
              role: role,
              answers: JSON.stringify(newAnswers),
              updated_at: new Date().toISOString()
            },
            { onConflict: 'company_id, role' }
          );
      } catch (err) {
        console.error("Error saving to Supabase:", err);
      }
    }

    // Esperar un momento para asegurar que el guardado se complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verificar si ambos formularios están completos
    const { bothComplete, missingForms } = await checkBothFormsComplete();

    if (!bothComplete) {
      // Mostrar mensaje de error más claro y específico
      let errorMessage = "";
      if (missingForms.length === 2) {
        errorMessage = "Faltan preguntas por responder en el perfil comercial y en el perfil técnico. Por favor, completa todas las preguntas de ambos formularios antes de finalizar.";
      } else if (missingForms.includes('commercial')) {
        errorMessage = "Faltan preguntas por responder en el perfil comercial. Por favor, completa todas las preguntas del formulario comercial antes de finalizar.";
      } else if (missingForms.includes('technical')) {
        errorMessage = "Faltan preguntas por responder en el perfil técnico. Por favor, completa todas las preguntas del formulario técnico antes de finalizar.";
      }
      console.log("⚠️ [FINALIZAR] Mensaje de error:", errorMessage);
      console.log("⚠️ [FINALIZAR] Formularios faltantes:", missingForms);
      setValidationMessage(errorMessage);
      return;
    }

    // Si ambos están completos, proceder con el flujo final
    setValidationMessage(null);
    setShowConfirmModal(false);
    
    // Mostrar estado de carga
    setIsSubmitting(true);
    
    try {
      // 1. Evaluar perfil comercial
      console.log("📤 [FINALIZAR] Evaluando perfil comercial...");
      const evaluationResult = await evaluateBusinessProfile(newAnswers, questions);
      
      if (evaluationResult.status !== "next") {
        console.log("ℹ️ [FINALIZAR] Perfil comercial evaluado, no procede con propuesta:", evaluationResult.status);
        // Mostrar pantalla de agradecimiento simple
        setSubmissionStatus("decline");
        setIsCompleted(true);
        setIsExiting(false);
        setShowQuestion(true);
        setIsSubmitting(false);
        setShowConfirmModal(false);
        return;
      }
      
      // 2. Generar propuesta (PDF)
      console.log("📄 [FINALIZAR] Generando propuesta comercial...");
      const proposalResult = await generateProposal(newAnswers, questions);
      
      if (!proposalResult.pdfUrl) {
        console.error("❌ [FINALIZAR] No se recibió URL del PDF");
        setValidationMessage("Error al generar la propuesta. Por favor, intenta nuevamente.");
        setIsSubmitting(false);
        return;
      }
      
      console.log("✅ [FINALIZAR] PDF generado:", proposalResult.pdfUrl);
      
      // 3. Obtener información de la compañía y el nombre del formulario
      const companyData = await supabase
        .from('companies')
        .select('contact_email, contact_name')
        .eq('id', companyId)
        .single();
      
      if (companyData.error || !companyData.data) {
        console.error("❌ [FINALIZAR] Error obteniendo datos de la compañía:", companyData.error);
        setValidationMessage("Error al obtener información de la compañía.");
        setIsSubmitting(false);
        return;
      }
      
      // Obtener el nombre del formulario (primera pregunta)
      const formName = newAnswers[0] || companyData.data.contact_name || "Cliente";
      const recipientEmail = companyData.data.contact_email;
      
      if (!recipientEmail) {
        console.error("❌ [FINALIZAR] No hay email de contacto en la compañía");
        setValidationMessage("No se encontró un email de contacto para enviar la propuesta.");
        setIsSubmitting(false);
        return;
      }
      
      // 4. Enviar correo con la propuesta
      console.log("📧 [FINALIZAR] Enviando correo con propuesta...");
      await sendProposalEmail({
        recipientEmail,
        recipientName: formName,
        pdfUrl: proposalResult.pdfUrl,
      });
      
      console.log("✅ [FINALIZAR] Correo enviado exitosamente");
      
      // 5. Finalizar y mostrar pantalla de agradecimiento
      setIsCompleted(true);
      setIsExiting(false);
      setShowQuestion(true);
      setIsSubmitting(false);
      hasSubmittedRef.current = false;
      
    } catch (error) {
      console.error("❌ [FINALIZAR] Error en el flujo final:", error);
      setValidationMessage("Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.");
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
      <AnimatedHalftoneBackground isDark={true} fullScreen={true} intensity={0.6} brightness={0.8} className="z-0" />
      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
        {!isCompleted && (
          <div className="pt-2 pb-1 sm:pt-3 sm:pb-2 md:pt-4 md:pb-2 lg:pt-5 lg:pb-3">
            <FocusedProgressBar totalSteps={totalSteps} currentStep={currentStep} completedSteps={completedSteps} />
          </div>
        )}

        <div className="flex-1 flex items-start justify-center py-2 sm:py-4 md:py-8 overflow-y-auto">
          <div className="flex flex-col px-3 sm:px-6 md:px-8 lg:px-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl pb-24 sm:pb-28 md:pb-32">
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
                              <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 text-center">
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
                                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-4 px-6 rounded-xl font-medium transition-all duration-300"
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
                                        {isGeneratingPDF ? (
                                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        )}
                                        Generar Propuesta
                                      </>
                                    )}
                                  </button>
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
                                    className={`flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
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
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent pt-4 pb-4 sm:pb-6 px-3 sm:px-6 md:px-8 lg:px-10">
          <div className="max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto flex justify-center">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isNextButtonDisabled}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-3.5 md:py-4 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white text-base sm:text-lg md:text-xl lg:text-2xl font-medium rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
            >
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación para formulario comercial */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 sm:p-8 md:p-10 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">
              ¿Estás seguro de finalizar este cuestionario?
            </h3>
            <p className="text-white/80 text-base sm:text-lg mb-6 sm:mb-8 text-center">
              Se va a generar una propuesta comercial en base a tus respuestas.
            </p>
            
            {validationMessage && (
              <div className="mb-4 sm:mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm sm:text-base text-center leading-relaxed">
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
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 sm:py-4 px-6 rounded-xl font-medium transition-all duration-300"
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
