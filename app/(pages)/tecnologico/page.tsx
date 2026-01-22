"use client";

import OnboardingForm from "../../components/OnboardingForm";
import { TECNOLOGICO_FORM } from "../../lib/formConfigs";

import { useProtectedPage } from "../../lib/auth";

export default function TecnologicoPage() {
  const isAuthorized = useProtectedPage("technical");

  if (!isAuthorized) {
    return null;
  }

  return <OnboardingForm config={TECNOLOGICO_FORM} />;
}
