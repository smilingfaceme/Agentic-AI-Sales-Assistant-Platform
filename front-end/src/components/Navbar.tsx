import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur bg-white/80 border-b border-gray-200 shadow-sm py-3">
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8">
        {/* Logo + Brand */}
        <div className="flex items-center gap-2">
          <span className="inline-block h-8 sm:h-10 md:h-12 lg:h-14">
            <Image src="/log.svg" alt="DoshiAI Logo" width={40} height={40} className="w-full h-full object-contain" />
          </span>
        </div>
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/auth/login">
            <button className="px-6 py-2.5 rounded-lg font-semibold text-lg sm:text-xl text-black hover:bg-gray-200 focus:bg-gray-200 transition">
              Login
            </button>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button className="p-3 rounded-lg hover:bg-gray-200 focus:bg-gray-200 transition">
            {/* Hamburger Icon */}
            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
