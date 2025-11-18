import Image from 'next/image';

export default function Logo() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 ml-4 sm:ml-8 md:ml-12">
      <Image
        src="/icons/iconAlaiza.svg"
        alt="Alaiza Icon"
        width={24}
        height={24}
        className="flex-shrink-0 sm:w-7 sm:h-7 md:w-8 md:h-8"
      />
      <span className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
        Al<span className="text-purple-500">ai</span>za
      </span>
    </div>
  );
}

