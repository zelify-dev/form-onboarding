"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

import iconAlaiza from "../assets/icons/iconAlaiza.svg";
import zelifyLogoLight from "../assets/icons/zelifyLogo_ligth.svg";
import { clearOnboardingFormDrafts } from "../lib/formLocalStorage";

export default function Navbar({ showExitButton = true }: { showExitButton?: boolean }) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear session
    if (typeof window !== "undefined") {
      localStorage.removeItem("onboarding_company_id");
      localStorage.removeItem("onboarding_role");
      clearOnboardingFormDrafts();
    }
    router.push("/");
  };

    return (
    <nav className="flex justify-between items-center bg-transparent w-full pr-4 sm:pr-8 pt-3 sm:pt-4 md:pt-6 lg:pt-8 xl:pt-10">
      <div className="flex items-center gap-3 sm:gap-4 md:gap-5 pl-3 sm:pl-4 md:pl-6 lg:pl-8 xl:pl-10">
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm ring-1 ring-slate-200/80">
          <Image
            src={iconAlaiza}
            alt="Alaiza Icon"
            width={32}
            height={32}
            className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
          />
        </div>
        <div className="flex flex-col items-start justify-center leading-none">
          <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.18em] text-slate-500">
            by
          </span>
          <Image
            src={zelifyLogoLight}
            alt="Zelify Logo"
            width={122}
            height={35}
            priority
            className="h-3.5 w-auto sm:h-4 md:h-4.5 lg:h-5 opacity-90"
          />
        </div>
      </div>

      {showExitButton && (
        <button
          onClick={handleLogout}
          className="group flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors"
          title="Salir"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 group-hover:text-red-500 transition-colors" />
          <span className="text-slate-700 text-sm sm:text-base font-medium group-hover:text-red-500 transition-colors">
            Salir
          </span>
        </button>
      )}
    </nav>
  );
}
