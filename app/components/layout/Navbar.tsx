import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <nav className="flex items-start justify-between pt-12 sm:pt-14 md:pt-16 lg:pt-20 pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6 md:px-8">
      <Logo />
      <ThemeToggle />
    </nav>
  );
}

