import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center bg-transparent w-full">
      <div className="flex items-center gap-2 sm:gap-3 pt-4 pl-4 sm:pt-6 sm:pl-6 md:pt-8 md:pl-8 lg:pt-10 lg:pl-10">
        <Image
          src="/iconAlaiza.svg"
          alt="Alaiza AI Logo"
          width={32}
          height={32}
          className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
        />
        <span className="text-white text-lg sm:text-xl md:text-2xl font-medium">
          Al<span className="text-purple-500">ai</span>za
        </span>
      </div>
    </nav>
  );
}
