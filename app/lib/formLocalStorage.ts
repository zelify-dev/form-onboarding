import { COMERCIAL_FORM, MAIN_FORM, TECNOLOGICO_FORM } from "./formConfigs";

/** Incluye MAIN_FORM por borradores antiguos. */
const STORAGE_KEYS = [MAIN_FORM.storageKey, TECNOLOGICO_FORM.storageKey, COMERCIAL_FORM.storageKey];

/** Borra índice de pregunta y respaldo de respuestas al cerrar sesión / salir. */
export function clearOnboardingFormDrafts(): void {
  if (typeof window === "undefined") return;
  try {
    for (const sk of STORAGE_KEYS) {
      localStorage.removeItem(`${sk}-current-index`);
      localStorage.removeItem(`${sk}-answers-backup`);
    }
  } catch {
    // ignore
  }
}
