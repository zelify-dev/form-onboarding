interface ProgressBarProps {
  totalSteps: number;
  currentStep: number;
  completedSteps: number[];
  viewingStep?: number;
}

export default function ProgressBar({
  totalSteps,
  currentStep,
  completedSteps,
  viewingStep,
}: ProgressBarProps) {
  const getStepState = (step: number) => {
    const stepNumber = step + 1;
    const isCompleted = completedSteps.includes(stepNumber);
    const isCurrent = stepNumber === currentStep;
    const isViewing = stepNumber === viewingStep;
    const isFuture = stepNumber > currentStep && !isViewing;

    if (isCompleted && !isCurrent && !isViewing) {
      return "completed";
    }
    if (isCurrent) {
      return "current";
    }
    if (isViewing) {
      return isCompleted ? "viewing-completed" : "viewing-future";
    }
    if (isFuture) {
      return "future";
    }
    return "future";
  };

  const renderStep = (step: number) => {
    const stepNumber = step + 1;
    const state = getStepState(step);
    const isCompleted = completedSteps.includes(stepNumber);
    const isLast = step === totalSteps - 1;
    // Para la línea conectora, verificamos si el paso anterior está completado
    const prevStepNumber = step; // El paso anterior (sin +1 porque step ya es 0-indexed)
    const prevIsCompleted = step > 0 && completedSteps.includes(prevStepNumber);
    const prevIsPast = step > 0 && prevStepNumber < currentStep;

    return (
      <div key={step} className="flex items-center">
        {/* Línea conectora anterior - solo si no es el primer paso */}
        {step > 0 && (
          <div
            className={`h-0.5 transition-all duration-500 ${
              prevIsCompleted || prevIsPast
                ? "bg-purple-500"
                : "bg-white/20"
            }`}
            style={{ width: 'clamp(3px, 0.6vw, 8px)' }}
          />
        )}

        {/* Contenedor del círculo */}
        <div className="relative flex items-center justify-center p-1 sm:p-1.5 md:p-2">
          {/* Anillo exterior para pulso */}
          {(state === "current" ||
            state === "viewing-completed" ||
            state === "viewing-future") && (
            <div
              className={`absolute inset-0 rounded-full animate-ping ${
                state === "current" || state === "viewing-completed"
                  ? "bg-purple-500/30"
                  : "bg-blue-500/30"
              }`}
              style={{
                width: "calc(100% + 1px)",
                height: "calc(100% + 1px)",
                margin: "-1px",
              }}
            />
          )}

          {/* Círculo principal */}
          {/* 
            ⚙️ CONFIGURACIÓN DE TAMAÑOS DE CÍRCULOS
            Puedes modificar los tamaños aquí. Formato: w-[tamaño] h-[tamaño] sm:w-[tamaño] sm:h-[tamaño] md:w-[tamaño] md:h-[tamaño] lg:w-[tamaño] lg:h-[tamaño]
            Tamaños disponibles en Tailwind: 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, etc.
            Ejemplo para hacerlos más grandes: cambiar w-5 por w-6, w-7 por w-8, etc.
            Ejemplo para hacerlos más pequeños: cambiar w-5 por w-4, w-7 por w-6, etc.
          */}
          <div
            className={`relative flex items-center justify-center rounded-full transition-all duration-500 ${
              state === "completed"
                ? "bg-purple-600 border border-purple-500 shadow-md shadow-purple-500/50 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                : state === "current"
                ? "bg-purple-500/30 border border-purple-500 shadow-md shadow-purple-500/50 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
                : state === "viewing-completed"
                ? "bg-purple-400 border border-purple-400 shadow-md shadow-purple-400/50 scale-110 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
                : state === "viewing-future"
                ? "bg-blue-500/30 border border-blue-500 shadow-md shadow-blue-500/50 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
                : "bg-transparent border border-white/20 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
            }`}
          >
            {/* Checkmark para completadas */}
            {isCompleted && state !== "viewing-future" && (
              <svg
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}

            {/* Número para no completadas */}
            {!isCompleted && (
              <span
                className={`text-[7px] sm:text-[8px] md:text-[9px] font-medium transition-all duration-500 ${
                  state === "current"
                    ? "text-purple-300"
                    : state === "viewing-future"
                    ? "text-blue-300"
                    : "text-white/40"
                }`}
              >
                {stepNumber}
              </span>
            )}

            {/* Anillo brillante para viewing-completed */}
            {state === "viewing-completed" && (
              <div className="absolute inset-0 rounded-full border-2 border-purple-300/50 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex justify-center items-center w-full px-1 sm:px-2 md:px-3 py-2 sm:py-3 md:py-4 overflow-visible">
      <div className="flex items-center justify-center overflow-y-visible w-full max-w-full" style={{ gap: 'clamp(4px, 0.9vw, 20px)' }}>
        {Array.from({ length: totalSteps }, (_, index) => renderStep(index))}
      </div>
    </div>
  );
}

