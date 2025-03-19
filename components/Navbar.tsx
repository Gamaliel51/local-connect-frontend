'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Derive the flag based on whether the current route includes '/business'
  const busRoute = pathname.includes('/business');
  const dashRoute = pathname.includes('/dashboard')

  const logOut = () => {
    sessionStorage.removeItem('token');
    router.push('/');
    window.location.reload();
  };

  if (busRoute) {
    return (
      <nav className="fixed w-full top-0 z-50 bg-black/10 backdrop-blur-lg transition-colors duration-300 md:px-10 lg:px-10">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          {/* Logo and Home Link */}
          <Link href="/" className="flex items-center shrink-0">
            <Image 
              className="w-10 h-10 mx-4 rounded-full" 
              height={100} 
              width={100} 
              src="/logo.png" 
              alt="TailwindFlex logo"
            />
            <span className="md:flex text-2xl mt-0.5 font-bold text-primary-600 text-white">
              Local-Connect
            </span>
          </Link>
  
          {/* Desktop Menu Links */}
          <div className="hidden md:flex items-center md:gap-8 text-white">
            <Link href="/businessdashboard" className="text-sm font-medium hover:text-purple-400 transition">
              Home
            </Link>
            <button 
              onClick={logOut} 
              className="cursor-pointer rounded-full border-2 py-2 px-6 border-white bg-white text-purple-900 hover:bg-purple-900 hover:text-white hover:shadow-lg transition duration-300 ease-in-out"
            >
              Log Out
            </button>
          </div>
  
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              className="text-2xl text-white" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
  
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/10 backdrop-blur-lg transition-colors duration-300">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link 
                href="/businessdashboard" 
                className="block mb-2 text-sm font-medium text-white hover:text-purple-400 transition" 
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <button 
                className="block mb-2 text-sm font-medium text-white hover:text-purple-400 transition" 
                onClick={logOut}
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </nav>
    );
  }

  if (dashRoute) {
    return (
      <nav className="fixed w-full top-0 z-50 bg-black/10 backdrop-blur-lg transition-colors duration-300 md:px-10 lg:px-10">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          {/* Logo and Home Link */}
          <Link href="/" className="flex items-center shrink-0">
            <Image 
              className="w-10 h-10 mx-4 rounded-full" 
              height={100} 
              width={100} 
              src="/logo.png" 
              alt="TailwindFlex logo"
            />
            <span className="md:flex text-2xl mt-0.5 font-bold text-primary-600 text-white">
              Local-Connect
            </span>
          </Link>
  
          {/* Desktop Menu Links */}
          <div className="hidden md:flex items-center md:gap-8 text-white">
            <Link href="/businessdashboard" className="text-sm font-medium hover:text-purple-400 transition">
              Home
            </Link>
            <button 
              onClick={logOut} 
              className="cursor-pointer rounded-full border-2 py-2 px-6 border-white bg-white text-purple-900 hover:bg-purple-900 hover:text-white hover:shadow-lg transition duration-300 ease-in-out"
            >
              Log Out
            </button>
          </div>
  
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              className="text-2xl text-white" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
  
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/10 backdrop-blur-lg transition-colors duration-300">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link 
                href="/businessdashboard" 
                className="block mb-2 text-sm font-medium text-white hover:text-purple-400 transition" 
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <button 
                className="block mb-2 text-sm font-medium text-white hover:text-purple-400 transition" 
                onClick={logOut}
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className="fixed w-full top-0 z-50 bg-black/10 backdrop-blur-lg transition-colors duration-300 md:px-10 lg:px-10">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo and Home Link */}
        <Link href="/" className="flex items-center shrink-0">
          <Image 
            className="w-10 h-10 mx-4 rounded-full" 
            height={100} 
            width={100} 
            src="/logo.png" 
            alt="TailwindFlex logo"
          />
          <span className="md:flex text-2xl mt-0.5 font-bold text-primary-600 text-white">
            Local-Connect
          </span>
        </Link>

        {/* Desktop Menu Links */}
        <div className="hidden md:flex items-center md:gap-8 text-white">
          <Link href="/" className="text-sm font-medium hover:text-purple-400 transition">
            Home
          </Link>
          <Link href="#about" className="text-sm font-medium hover:text-purple-400 transition">
            About
          </Link>
          <Link href="/register" className="text-sm font-medium hover:text-purple-400 transition">
            Register
          </Link>
          <Link 
            href="/login" 
            className="cursor-pointer rounded-full border-2 py-2 px-6 border-white bg-white text-purple-900 hover:bg-purple-900 hover:text-white hover:shadow-lg transition duration-300 ease-in-out"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            className="text-2xl text-white" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/10 backdrop-blur-lg transition-colors duration-300">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link 
              href="/" 
              className="block mb-2 text-sm font-medium text-white hover:text-purple-400 transition" 
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="#about" 
              className="block mb-2 text-sm font-medium text-white hover:text-purple-400 transition" 
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/register" 
              className="block mb-2 text-sm font-medium text-white hover:text-purple-400 transition" 
              onClick={() => setIsMenuOpen(false)}
            >
              Register
            </Link>
            <Link 
              href="/login" 
              className="block mb-2 text-sm font-medium text-white hover:text-purple-400 transition" 
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
