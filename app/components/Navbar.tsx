"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

import zelifyLogoLight from "../assets/icons/zelifyLogo_ligth.svg";

export default function Navbar({ showExitButton = true }: { showExitButton?: boolean }) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear session
    if (typeof window !== "undefined") {
      localStorage.removeItem("onboarding_company_id");
      localStorage.removeItem("onboarding_role");
      // Optional: Clear form answers if desired, but maybe user wants to resume later?
      // For security "Exit", better to clear sensitive access.
    }
    router.push("/");
  };

    return (
    <nav className="flex justify-between items-center bg-transparent w-full pr-4 sm:pr-8 pt-3 sm:pt-4 md:pt-6 lg:pt-8 xl:pt-10">
      <div className="flex items-center pl-3 sm:pl-4 md:pl-6 lg:pl-8 xl:pl-10">
        <Image
          src={zelifyLogoLight}
          alt="Zelify Logo"
          width={122}
          height={35}
          priority
          className="h-7 w-auto sm:h-8 md:h-9 lg:h-10 xl:h-11"
        />
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
