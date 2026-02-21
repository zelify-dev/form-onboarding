"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AnimatedHalftoneBackground from "../components/AnimatedHalftoneBackground";
import Navbar from "../components/Navbar";
import ContactForm from "../components/ContactForm";
import { BriefcaseIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<"selection" | "auth" | "contact">("selection");
  const [selectedProfile, setSelectedProfile] = useState<"tech" | "commercial" | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const companyId = localStorage.getItem("onboarding_company_id");
      const userRole = localStorage.getItem("onboarding_role");

      if (companyId && userRole) {
        if (userRole === "commercial") {
          router.replace("/comercial");
        } else if (userRole === "technical") {
          router.replace("/tecnologico");
        }
      }
    }
  }, [router]);

  const cardSpecs = {
    opacity: 0.9,
    blur: 2,
    roundness: 24,
    borderOpacity: 0.2,
    shadowOpacity: 0.2
  };

  const commonCardStyle = {
    borderRadius: `${cardSpecs.roundness}px`,
    backgroundColor: `rgba(248, 250, 252, ${cardSpecs.opacity})`,
  };

  const handleProfileSelect = (profile: "tech" | "commercial") => {
    setSelectedProfile(profile);
    setView("auth");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const normalizedProfile = selectedProfile === "tech" ? "technical" : "commercial";
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, role: normalizedProfile })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.message || "Credenciales inválidas.");
        return;
      }

      const role = result.role;
      if (typeof window !== 'undefined') {
        localStorage.setItem("onboarding_role", role);
        localStorage.setItem("onboarding_company_id", "session_active");
      }

      let targetPath = "";
      if (role === "technical") targetPath = "/tecnologico";
      else if (role === "commercial") targetPath = "/comercial";

      router.push(targetPath);
    } catch (e) {
      setError("Error de red. Intenta nuevamente.");
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
    if (error) {
      setError("");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div className="absolute inset-0 animated-gradient" />
      <AnimatedHalftoneBackground isDark={false} fullScreen={true} intensity={0.8} brightness={1} className="z-0" />

      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar showExitButton={false} />
        <div className="flex-1 flex items-center justify-center px-6 py-12">

          <LayoutGroup>
            <AnimatePresence mode="popLayout" initial={false}>
              {view === "selection" ? (
                <div key="selection-container" className="flex flex-col items-center gap-8 max-w-4xl w-full z-10">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2">Bienvenido</h1>
                    <p className="text-slate-600 text-lg uppercase tracking-widest">Selecciona tu perfil</p>
                  </motion.div>

                  <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-stretch perspective-1000">
                    {/* Tarjeta Negocio / Comercial */}
                    <motion.button
                      layoutId="card-commercial"
                      onClick={() => handleProfileSelect("commercial")}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 }
                      }}
                      className="group relative flex-1 min-h-[300px] p-8 flex flex-col items-center justify-center gap-6 text-center transition-transform duration-300 hover:scale-[1.02] overflow-hidden"
                      style={commonCardStyle}
                    >
                      <motion.div
                        layout="position"
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="p-4 rounded-full bg-purple-100 text-purple-700 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                          <BriefcaseIcon className="w-12 h-12" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Negocio</h2>
                          <p className="text-slate-600 text-sm">Perfil Negocio y Comercial</p>
                        </div>
                      </motion.div>
                    </motion.button>

                    {/* Tarjeta Tecnologico */}
                    <motion.button
                      layoutId="card-tech"
                      onClick={() => handleProfileSelect("tech")}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 }
                      }}
                      className="group relative flex-1 min-h-[300px] p-8 flex flex-col items-center justify-center gap-6 text-center transition-transform duration-300 hover:scale-[1.02] overflow-hidden"
                      style={commonCardStyle}
                    >
                      <motion.div
                        layout="position"
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="p-4 rounded-full bg-blue-100 text-blue-700 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                          <ComputerDesktopIcon className="w-12 h-12" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Tecnológico</h2>
                          <p className="text-slate-600 text-sm">Perfil Técnico y Desarrollo</p>
                        </div>
                      </motion.div>
                    </motion.button>
                  </div>
                </div>
              ) : view === "auth" ? (
                <motion.div
                  key="auth-container"
                  layoutId={`card-${selectedProfile}`}
                  className="w-full max-w-md p-8 overflow-hidden relative z-20"
                  style={commonCardStyle}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                >
                  {/* Background Elements to match card style during transition */}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex flex-col gap-2 text-center">
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-600">
                        {selectedProfile === "commercial" ? "Perfil Negocio" : "Perfil Tecnológico"}
                      </p>
                      <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Portal de ingreso</h1>
                      <p className="text-slate-600 text-sm sm:text-base">
                        Ingresa tu código de acceso para continuar al formulario.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
                      <input
                        value={code}
                        onChange={(event) => handleChange(event.target.value)}
                        placeholder="Código de acceso"
                        className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-slate-600 placeholder-slate-400 text-base sm:text-lg outline-none transition focus:ring-2 focus:ring-purple-400/30"
                        autoComplete="off"
                        aria-label="Código de acceso"
                        type="password"
                      />
                      {error && <p className="text-sm text-red-300">{error}</p>}
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-purple-500 py-3 text-base sm:text-lg font-semibold text-white shadow-lg shadow-purple-500/40 transition hover:bg-purple-600"

                      >
                        Continuar
                      </button>

                      <button
                        type="button"
                        onClick={() => setView("contact")}
                        className="text-slate-600 text-sm hover:text-slate-900 transition-colors text-center underline decoration-slate-300 underline-offset-4 block mt-4 mb-2 w-full"
                      >
                        Solicitar código de acceso
                      </button>

                      <button
                        type="button"
                        onClick={() => setView("selection")}
                        className="text-slate-500 text-sm hover:text-slate-900 transition-colors"
                      >
                        ← Cambiar perfil
                      </button>
                    </form>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="contact-container"
                  layoutId={`card-${selectedProfile}`}
                  className="w-full max-w-md p-8 overflow-hidden relative z-20"
                  style={commonCardStyle}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex flex-col gap-2 text-center mb-6">
                      <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Solicitar Acceso</h1>
                      <p className="text-slate-600 text-sm">
                        Envíanos tus datos y te contactaremos.
                      </p>
                    </div>

                    <ContactForm
                      onCancel={() => setView("auth")}
                      onSubmit={async (data) => {
                        try {
                          const res = await fetch('/api/contact', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                          });
                          const result = await res.json();

                          if (res.ok && result.success) {
                            alert(result.message || "¡Solicitud enviada con éxito! Te contactaremos pronto.");
                            setView("auth");
                          } else {
                            if (result.fieldErrors) {
                              alert(`Error en el formulario: ${Object.values(result.fieldErrors).flat().join(", ")}`);
                            } else {
                              alert(result.message || "Error al enviar la solicitud.");
                            }
                          }
                        } catch (err) {
                          alert("Ocurrió un error inesperado.");
                        }
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}

