import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Name */}
          <Link
            href="/"
            className="text-white text-xl font-semibold hover:text-gray-200 transition-colors"
          >
            Yorticia
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/portfolio"
              className="text-white hover:text-gray-200 transition-colors"
            >
              Portfolio
            </Link>
            <Link
              href="/about"
              className="text-white hover:text-gray-200 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-gray-200 transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white hover:text-gray-200 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}
