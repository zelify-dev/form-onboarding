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
            className={`h-0.5 w-6 sm:w-10 md:w-14 lg:w-16 xl:w-20 2xl:w-24 transition-all duration-500 ${
              prevIsCompleted || prevIsPast
                ? "bg-purple-500"
                : "bg-white/20"
            }`}
          />
        )}

        {/* Contenedor del círculo */}
        <div className="relative flex items-center justify-center">
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
                width: "calc(100% + 12px)",
                height: "calc(100% + 12px)",
                margin: "-6px",
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
                ? "bg-purple-600 border sm:border-2 border-purple-500 shadow-md sm:shadow-lg shadow-purple-500/50 w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-11 lg:h-11"
                : state === "current"
                ? "bg-purple-500/30 border sm:border-2 border-purple-500 shadow-md sm:shadow-lg shadow-purple-500/50 w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12"
                : state === "viewing-completed"
                ? "bg-purple-400 border sm:border-2 border-purple-400 shadow-md sm:shadow-lg shadow-purple-400/50 scale-110 w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12"
                : state === "viewing-future"
                ? "bg-blue-500/30 border sm:border-2 border-blue-500 shadow-md sm:shadow-lg shadow-blue-500/50 w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12"
                : "bg-transparent border border-white/20 w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 lg:w-9 lg:h-9"
            }`}
          >
            {/* Checkmark para completadas */}
            {isCompleted && state !== "viewing-future" && (
              <svg
                className="w-[10px] h-[10px] sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white"
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
                className={`text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium transition-all duration-500 ${
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
    <div className="flex justify-center items-center w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 overflow-hidden">
      <div className="flex items-center overflow-x-auto overflow-y-hidden py-2 sm:py-3 md:py-4 lg:py-5">
        {Array.from({ length: totalSteps }, (_, index) => renderStep(index))}
      </div>
    </div>
  );
}

