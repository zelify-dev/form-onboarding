'use client';

interface ProgressBarProps {
  currentQuestionIndex: number; // Progreso real
  viewingQuestionIndex: number; // Pregunta que se está viendo
  totalQuestions: number;
}

export default function ProgressBar({ currentQuestionIndex, viewingQuestionIndex, totalQuestions }: ProgressBarProps) {
  return (
    <div className="flex w-full items-center justify-center pb-3 sm:pb-4 md:pb-6 lg:pb-8 px-4 sm:px-6 md:px-8 overflow-x-auto">
      <div className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const questionNumber = index + 1;
          const isCompleted = index < currentQuestionIndex;
          const isCurrent = index === currentQuestionIndex;
          const isViewing = index === viewingQuestionIndex;
          const isUpcoming = index > currentQuestionIndex;

          return (
            <div key={index} className="flex items-center">
              {/* Círculo de pregunta */}
              <div
                className={`relative flex h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 items-center justify-center rounded-full border-2 transition-all duration-500 flex-shrink-0 ${
                  isCompleted && isViewing
                    ? 'border-purple-400 bg-purple-500 text-white shadow-lg shadow-purple-400/60 ring-2 ring-purple-400/60 scale-110'
                    : isCompleted
                    ? 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                    : isCurrent && isViewing
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/30 ring-2 ring-purple-500/50'
                    : isViewing && !isCurrent
                    ? 'border-blue-400 bg-blue-400/20 text-blue-300 shadow-lg shadow-blue-400/30 ring-2 ring-blue-400/50'
                    : 'border-white/20 bg-transparent text-white/20 opacity-40'
                }`}
              >
                {/* Checkmark para preguntas completadas */}
                {isCompleted ? (
                  <svg
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  /* Número para pregunta actual y futuras */
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold">{questionNumber}</span>
                )}
                {/* Indicador de pulso para la pregunta actual o la que se está viendo */}
                {(isCurrent && isViewing) && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-purple-500 opacity-20" />
                )}
                {(isViewing && !isCurrent && isCompleted) && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-30" />
                )}
                {isViewing && !isCurrent && !isCompleted && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20" />
                )}
              </div>

              {/* Línea conectora (no mostrar después de la última pregunta) */}
              {index < totalQuestions - 1 && (
                <div
                  className={`h-0.5 w-4 sm:w-6 md:w-8 lg:w-12 transition-all duration-500 flex-shrink-0 ${
                    isCompleted ? 'bg-purple-500' : 'bg-white/20 opacity-40'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

