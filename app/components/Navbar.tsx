"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

import iconAlaiza from "../assets/icons/iconAlaiza.svg";

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
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 pl-3 sm:pl-4 md:pl-6 lg:pl-8 xl:pl-10">
        <Image
          src={iconAlaiza}
          alt="Alaiza AI Logo"
          width={32}
          height={32}
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"
        />
        <span className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-medium">
          Al<span className="text-purple-500">ai</span>za
        </span>
      </div>

      {showExitButton && (
        <button
          onClick={handleLogout}
          className="group flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
          title="Salir"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-red-500 transition-colors" />
          <span className="text-white text-sm sm:text-base font-medium group-hover:text-red-500 transition-colors">
            Salir
          </span>
        </button>
      )}
    </nav>
  );
}
