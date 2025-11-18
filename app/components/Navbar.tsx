import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center bg-transparent w-full">
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 pt-3 pl-3 sm:pt-4 sm:pl-4 md:pt-6 md:pl-6 lg:pt-8 lg:pl-8 xl:pt-10 xl:pl-10">
        <Image
          src="/iconAlaiza.svg"
          alt="Alaiza AI Logo"
          width={32}
          height={32}
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"
        />
        <span className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-medium">
          Al<span className="text-purple-500">ai</span>za
        </span>
      </div>
    </nav>
  );
}
