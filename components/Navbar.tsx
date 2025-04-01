'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const busRoute = pathname.includes('/business');
  const dashRoute = pathname.includes('/dashboard');

  const logOut = () => {
    sessionStorage.removeItem('token');
    router.push('/');
    window.location.reload();
  };

  const NavContent = ({ variant }: { variant: 'default' | 'business' | 'dashboard' }) => (
    <nav className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-blue-100 transition-colors duration-300 md:px-10 lg:px-10">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image 
            className="w-10 h-10 mx-4 rounded-full" 
            height={100} 
            width={100} 
            src="/logo.png" 
            alt="Local-Connect logo"
          />
          <span className="md:flex text-2xl mt-0.5 font-bold text-blue-900">
            Local-Connect
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center md:gap-8 text-blue-900">
          {variant === 'default' ? (
            <>
              <Link href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link href="#about" className="text-sm font-medium hover:text-blue-600 transition-colors">
                About
              </Link>
              <Link href="/register" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Register
              </Link>
              <Link 
                href="/login" 
                className="cursor-pointer rounded-full bg-blue-600 py-2 px-6 text-white hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <Link 
                href={variant === 'business' ? "/businessdashboard" : "/dashboard"} 
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Home
              </Link>
              <button 
                onClick={logOut} 
                className="cursor-pointer rounded-full border-2 py-2 px-6 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-lg transition-all duration-300"
              >
                Log Out
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            className="text-2xl text-blue-900" 
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
        <div className="md:hidden bg-white/95 backdrop-blur-lg">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {variant === 'default' ? (
              <>
                <Link href="/" className="block mb-2 text-sm font-medium text-blue-900 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>
                  Home
                </Link>
                <Link href="#about" className="block mb-2 text-sm font-medium text-blue-900 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>
                  About
                </Link>
                <Link href="/register" className="block mb-2 text-sm font-medium text-blue-900 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Link>
                <Link href="/login" className="block mb-2 text-sm font-medium text-blue-900 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href={variant === 'business' ? "/businessdashboard" : "/dashboard"} 
                  className="block mb-2 text-sm font-medium text-blue-900 hover:text-blue-600" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <button 
                  className="block mb-2 text-sm font-medium text-blue-900 hover:text-blue-600 w-full text-left" 
                  onClick={logOut}
                >
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );

  if (busRoute) return <NavContent variant="business" />;
  if (dashRoute) return <NavContent variant="dashboard" />;
  return <NavContent variant="default" />;
}