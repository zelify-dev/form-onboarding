"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedHalftoneBackground from "../components/AnimatedHalftoneBackground";
import Navbar from "../components/Navbar";
import { BriefcaseIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<"selection" | "auth">("selection");
  const [selectedProfile, setSelectedProfile] = useState<"tech" | "commercial" | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // Variables numéricas para controlar el estilo de la tarjeta (Card Style Specs)
  const cardSpecs = {
    opacity: 0.04,    // 0.0 - 1.0 (Opacidad del fondo)
    blur: 2,        // px (Desenfoque)
    roundness: 24,   // px (Redondeo de esquinas)
    borderOpacity: 0.1, // 0.0 - 1.0 (Opacidad del borde)
    shadowOpacity: 0.2  // 0.0 - 1.0 (Opacidad de la sombra)
  };

  const commonCardStyle = {
    borderRadius: `${cardSpecs.roundness}px`,
    borderColor: `rgba(255, 255, 255, ${cardSpecs.borderOpacity})`,
    backgroundColor: `rgba(255, 255, 255, ${cardSpecs.opacity})`,
    backdropFilter: `blur(${cardSpecs.blur}px)`,
    WebkitBackdropFilter: `blur(${cardSpecs.blur}px)`,
    boxShadow: `0 25px 50px -12px rgba(168, 85, 247, ${cardSpecs.shadowOpacity})`
  };

  const handleProfileSelect = (profile: "tech" | "commercial") => {
    setSelectedProfile(profile);
    setView("auth");
    // Pre-fill code based on selection logic? For now, we just let them enter it.
    // If we wanted to auto-route, we could do it here, but the request says "show code input".
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toLowerCase();

    const routes: Record<string, string> = {
      tech: "/tecnologico",
      commercial: "/comercial",
    };

    // Optional: Validate that the code matches the selected profile relative to expected codes?
    // For now, keep original logic which maps code directly to route.

    const target = routes[normalized];

    if (!target) {
      setError("Codigo invalido. Intenta con uno valido.");
      return;
    }

    setError("");
    router.push(target);
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
      <AnimatedHalftoneBackground isDark={true} fullScreen={true} intensity={0.6} brightness={0.8} className="z-0" />

      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
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
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">Bienvenido</h1>
                    <p className="text-white/60 text-lg uppercase tracking-widest">Selecciona tu perfil</p>
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
                      className="group relative flex-1 min-h-[300px] border p-8 flex flex-col items-center justify-center gap-6 text-center transition-shadow duration-300 hover:scale-[1.02] hover:bg-white/[0.05] border-beam-container overflow-hidden"
                      style={commonCardStyle}
                    >
                      <div className="border-beam" />
                      <motion.div
                        layout="position"
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="p-4 rounded-full bg-purple-500/20 text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                          <BriefcaseIcon className="w-12 h-12" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-white mb-2">Negocio</h2>
                          <p className="text-white/50 text-sm">Perfil Negocio y Comercial</p>
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
                      className="group relative flex-1 min-h-[300px] border p-8 flex flex-col items-center justify-center gap-6 text-center transition-shadow duration-300 hover:scale-[1.02] hover:bg-white/[0.05] border-beam-container overflow-hidden"
                      style={commonCardStyle}
                    >
                      <div className="border-beam" />
                      <motion.div
                        layout="position"
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="p-4 rounded-full bg-blue-500/20 text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                          <ComputerDesktopIcon className="w-12 h-12" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-white mb-2">Tecnológico</h2>
                          <p className="text-white/50 text-sm">Perfil Técnico y Desarrollo</p>
                        </div>
                      </motion.div>
                    </motion.button>
                  </div>
                </div>
              ) : (
                <motion.div
                  key="auth-container"
                  layoutId={`card-${selectedProfile}`}
                  className="w-full max-w-md border p-8 shadow-2xl overflow-hidden relative z-20"
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
                      <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                        {selectedProfile === "commercial" ? "Perfil Negocio" : "Perfil Tecnológico"}
                      </p>
                      <h1 className="text-3xl sm:text-4xl font-semibold text-white">Portal de ingreso</h1>
                      <p className="text-white/60 text-sm sm:text-base">
                        Ingresa tu codigo de acceso para continuar al formulario.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
                      <input
                        value={code}
                        onChange={(event) => handleChange(event.target.value)}
                        placeholder="Codigo de acceso"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white text-base sm:text-lg outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                        autoComplete="off"
                        aria-label="Codigo de acceso"
                        type="password"
                      />
                      {error && <p className="text-sm text-red-300">{error}</p>}
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-purple-500 py-3 text-base sm:text-lg font-semibold text-white shadow-lg shadow-purple-500/40 transition hover:bg-purple-600"
                      
                      >
                        Continuar
                      </button>

                      <a
                        href="mailto:soporte@alaiza.com?subject=Solicitud%20de%20C%C3%B3digo%20de%20Acceso"
                        className="text-white/60 text-sm hover:text-white transition-colors text-center underline decoration-white/30 underline-offset-4 block mt-4 mb-2"
                      >
                        Solicitar código de acceso
                      </a>

                      <button
                        type="button"
                        onClick={() => setView("selection")}
                        className="text-white/40 text-sm hover:text-white transition-colors"
                      >
                        ← Cambiar perfil
                      </button>
                    </form>
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
