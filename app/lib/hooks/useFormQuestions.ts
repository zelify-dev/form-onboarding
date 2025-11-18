'use client';

import { useState, useCallback } from 'react';
import { QUESTIONS, PLACEHOLDERS } from '../questions';

export interface FormAnswer {
  question: string;
  answer: string;
  questionIndex: number;
}

export function useFormQuestions() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Progreso real (solo avanza al responder)
  const [viewingQuestionIndex, setViewingQuestionIndex] = useState(0); // Pregunta que se está viendo (puede navegar con scroll)
  const [answers, setAnswers] = useState<FormAnswer[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayQuestion, setDisplayQuestion] = useState(QUESTIONS[0]);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  const currentQuestion = QUESTIONS[viewingQuestionIndex]; // Usa viewingQuestionIndex para mostrar
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const canNavigateBack = viewingQuestionIndex > 0;
  const canNavigateForward = viewingQuestionIndex < currentQuestionIndex;

  // Maneja la respuesta del usuario
  const handleAnswer = useCallback((answer: string) => {
    // Solo permite responder si estás viendo la pregunta actual de progreso
    if (viewingQuestionIndex !== currentQuestionIndex || !answer.trim() || isTransitioning) return;

    // Guarda la respuesta
    const formAnswer: FormAnswer = {
      question: QUESTIONS[viewingQuestionIndex],
      answer: answer.trim(),
      questionIndex: viewingQuestionIndex,
    };

    // Verifica si ya existe una respuesta para esta pregunta
    const existingAnswerIndex = answers.findIndex(a => a.questionIndex === viewingQuestionIndex);
    
    if (existingAnswerIndex >= 0) {
      // Actualiza respuesta existente
      setAnswers((prev) => {
        const updated = [...prev];
        updated[existingAnswerIndex] = formAnswer;
        return updated;
      });
    } else {
      // Nueva respuesta
      setAnswers((prev) => [...prev, formAnswer]);
    }

    // Solo avanza el progreso si no es la última pregunta
    if (!isLastQuestion) {
      setIsExiting(true);
      setIsTransitioning(true);
    } else {
      // Última pregunta completada
      console.log('Formulario completado:', [...answers, formAnswer]);
      // Aquí puedes manejar el envío final del formulario
    }
  }, [viewingQuestionIndex, currentQuestionIndex, isLastQuestion, isTransitioning, answers]);

  // Navega hacia atrás para revisar respuestas anteriores (solo cambia la vista)
  const navigateBack = useCallback(() => {
    if (canNavigateBack && !isTransitioning) {
      setIsNavigatingBack(true);
      setIsExiting(true);
      setIsTransitioning(true);
    }
  }, [canNavigateBack, isTransitioning]);

  // Navega hacia adelante para volver a la pregunta actual
  const navigateForward = useCallback(() => {
    if (canNavigateForward && !isTransitioning) {
      setIsNavigatingBack(false);
      setIsExiting(true);
      setIsTransitioning(true);
    }
  }, [canNavigateForward, isTransitioning]);

  // Se llama cuando la animación de salida termina (tanto para avanzar como retroceder)
  const handleExitComplete = useCallback(() => {
    if (isExiting) {
      if (isNavigatingBack) {
        // Navegación hacia atrás (solo cambia la vista)
        const prevIndex = viewingQuestionIndex - 1;
        setViewingQuestionIndex(prevIndex);
        setDisplayQuestion(QUESTIONS[prevIndex]);
        setIsNavigatingBack(false);
      } else {
        // Navegación hacia adelante (puede ser progreso o volver a la pregunta actual)
        if (viewingQuestionIndex < currentQuestionIndex) {
          // Volviendo a la pregunta actual desde una anterior
          const nextIndex = viewingQuestionIndex + 1;
          setViewingQuestionIndex(nextIndex);
          setDisplayQuestion(QUESTIONS[nextIndex]);
        } else if (!isLastQuestion) {
          // Avanzando el progreso (respondió una pregunta nueva)
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          setViewingQuestionIndex(nextIndex); // También actualiza la vista
          setDisplayQuestion(QUESTIONS[nextIndex]);
        }
      }
      setIsExiting(false);
      // Pequeño delay antes de permitir la siguiente interacción
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }
  }, [isExiting, isLastQuestion, currentQuestionIndex, viewingQuestionIndex, isNavigatingBack]);

  // Reinicia el formulario
  const resetForm = useCallback(() => {
    setCurrentQuestionIndex(0);
    setViewingQuestionIndex(0);
    setDisplayQuestion(QUESTIONS[0]);
    setAnswers([]);
    setIsExiting(false);
    setIsTransitioning(false);
    setIsNavigatingBack(false);
  }, []);

  const currentPlaceholder = PLACEHOLDERS[viewingQuestionIndex] || 'Escribe tu respuesta aquí...';
  const currentAnswer = answers.find(a => a.questionIndex === viewingQuestionIndex)?.answer || '';
  const isViewingCurrentQuestion = viewingQuestionIndex === currentQuestionIndex;

  return {
    currentQuestion: displayQuestion, // Usa displayQuestion para la animación
    currentPlaceholder, // Placeholder personalizado para la pregunta actual
    currentAnswer, // Respuesta actual si existe
    currentQuestionIndex, // Progreso real
    viewingQuestionIndex, // Pregunta que se está viendo
    isViewingCurrentQuestion, // Si está viendo la pregunta actual (puede responder)
    answers,
    isExiting,
    isTransitioning,
    isLastQuestion,
    isFirstQuestion,
    totalQuestions: QUESTIONS.length,
    handleAnswer,
    handleExitComplete,
    navigateBack,
    navigateForward,
    resetForm,
  };
}

