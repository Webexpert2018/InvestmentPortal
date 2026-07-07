'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  Shield, TrendingUp, FileText, ArrowRight, Facebook, Instagram,
  Linkedin, Twitter, Menu, X, CheckCircle, Coins, Phone, BarChart2,
  Users, Building2, ChevronRight, Star, Handshake, PiggyBank, Mail, MapPin
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function HomePage() {
  const { isAuthenticated, isAdmin, isAccountant, loading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = ['home', 'funds', 'portfolio', 'about', 'insights', 'contact'];

    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Rely on video onCanPlay rather than a blind timer so the image doesn't vanish prematurely
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, isAccountant, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020817]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto"></div>
          <p className="mt-4 text-gray-400 tracking-wider">Welcome to Investment Portal...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen font-sans overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-white">
      <style dangerouslySetInnerHTML={{
        __html: `
        .font-serif {
          font-family: GoudyOldStyle, 'Goudy Old Style', Georgia, serif !important;
        }
        .font-sans {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          font-weight: 400;
        }
        .step-number {
          font-family: GoudyOldStyle, 'Goudy Old Style', Georgia, serif;
          font-size: 5rem;
          line-height: 1;
          color: rgba(212,175,55,0.15);
          font-weight: 700;
          position: absolute;
          top: -1rem;
          left: 0;
        }
        .invest-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .invest-card:hover {
          border-color: rgba(212,175,55,0.3);
        }
      `}} />

      {/* Decorative Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#1e3a8a]/20 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"></div>
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] pointer-events-none z-0 animate-pulse delay-700"></div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${(isScrolled || isMenuOpen)
        ? 'bg-[#020817]/90 backdrop-blur-xl border-b border-white/10 shadow-lg'
        : 'bg-transparent border-b border-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src="/images/logo.png"
                alt="Ovalia Capital"
                width={60}
                height={60}
                className="object-contain filter drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]"
              />
            </a>

            <div className="hidden lg:flex items-center space-x-8">
              <a href="#home" className={`relative transition-colors text-base font-semibold py-2 ${activeSection === 'home' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>
                Home
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] transition-all duration-300 ${activeSection === 'home' ? 'scale-x-100' : 'scale-x-0'}`} />
              </a>
              <a href="#funds" className={`relative transition-colors text-base font-semibold py-2 ${activeSection === 'funds' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>
                Funds
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] transition-all duration-300 ${activeSection === 'funds' ? 'scale-x-100' : 'scale-x-0'}`} />
              </a>
              <a href="#portfolio" className={`relative transition-colors text-base font-semibold py-2 ${activeSection === 'portfolio' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>
                Portfolio
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] transition-all duration-300 ${activeSection === 'portfolio' ? 'scale-x-100' : 'scale-x-0'}`} />
              </a>
              <a href="#about" className={`relative transition-colors text-base font-semibold py-2 ${activeSection === 'about' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>
                About Us
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] transition-all duration-300 ${activeSection === 'about' ? 'scale-x-100' : 'scale-x-0'}`} />
              </a>
              <a href="#insights" className={`relative transition-colors text-base font-semibold py-2 ${activeSection === 'insights' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>
                Insights
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] transition-all duration-300 ${activeSection === 'insights' ? 'scale-x-100' : 'scale-x-0'}`} />
              </a>
              <a href="#contact" className={`relative transition-colors text-base font-semibold py-2 ${activeSection === 'contact' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>
                Contact
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] transition-all duration-300 ${activeSection === 'contact' ? 'scale-x-100' : 'scale-x-0'}`} />
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 font-semibold transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-white/5 data-[state=open]:text-[#D4AF37]"
                    >
                      Sign In
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 p-1 bg-[#0B132B]/95 backdrop-blur-md border border-white/10 text-white shadow-2xl" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                    <DropdownMenuItem
                      className="cursor-pointer text-white hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 transition-colors px-3 py-2 rounded-md"
                      onSelect={() => router.push('/auth/login?flow=admin')}
                    >
                      Admin login
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-white hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 transition-colors px-3 py-2 rounded-md"
                      onSelect={() => router.push('/auth/login?flow=account')}
                    >
                      Accountant login
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-white hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 transition-colors px-3 py-2 rounded-md"
                      onSelect={() => router.push('/auth/login?flow=investor')}
                    >
                      Investor login
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* <Link href="/auth/signup">
                  <Button
                    className="bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-[#020817] hover:brightness-110 font-bold px-6 py-2.5 rounded-lg shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_25px_rgba(212,175,55,0.5)] transition-all duration-300"
                  >
                    Log In
                  </Button>
                </Link> */}
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden flex items-center">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-300 hover:text-[#D4AF37] focus:outline-none p-2 rounded-lg border border-white/20 hover:border-[#D4AF37]/50 hover:bg-white/5 transition-colors"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-[#020817]/95 backdrop-blur-xl border border-white/10 px-6 pt-4 pb-6 space-y-3 shadow-2xl mx-4 mt-2 rounded-2xl"
          >
            <a href="#home" onClick={() => setIsMenuOpen(false)} className={`block py-2 font-semibold text-base transition-colors ${activeSection === 'home' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>Home</a>
            <a href="#funds" onClick={() => setIsMenuOpen(false)} className={`block py-2 font-semibold text-base transition-colors ${activeSection === 'funds' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>Funds</a>
            <a href="#portfolio" onClick={() => setIsMenuOpen(false)} className={`block py-2 font-semibold text-base transition-colors ${activeSection === 'portfolio' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>Portfolio</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)} className={`block py-2 font-semibold text-base transition-colors ${activeSection === 'about' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>About Us</a>
            <a href="#insights" onClick={() => setIsMenuOpen(false)} className={`block py-2 font-semibold text-base transition-colors ${activeSection === 'insights' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>Insights</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className={`block py-2 font-semibold text-base transition-colors ${activeSection === 'contact' ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]'}`}>Contact</a>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-[#D4AF37] text-[#070A13] hover:bg-[#F3E5AB] font-bold border-white/20"
                  >
                    Sign In
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  sideOffset={10}
                  className="w-[var(--radix-dropdown-menu-trigger-width)] p-2 bg-[#0B132B]/95 backdrop-blur-md border border-white/10 text-white shadow-2xl"
                  style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
                >
                  <DropdownMenuItem
                    className="w-full text-center py-3.5 text-white hover:text-white focus:text-white cursor-pointer hover:bg-white/10 rounded-xl mb-1 font-semibold text-base transition-colors"
                    onSelect={() => router.push('/auth/login?flow=admin')}
                  >
                    Admin login
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full text-center py-3.5 text-white hover:text-white focus:text-white cursor-pointer hover:bg-white/10 rounded-xl mb-1 font-semibold text-base transition-colors"
                    onSelect={() => router.push('/auth/login?flow=account')}
                  >
                    Accountant login
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full text-center py-3.5 text-white hover:text-white focus:text-white cursor-pointer hover:bg-white/10 rounded-xl font-semibold text-base transition-colors"
                    onSelect={() => router.push('/auth/login?flow=investor')}
                  >
                    Investor login
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* <Link href="/auth/signup" className="w-full">
                <Button className="w-full bg-[#D4AF37] text-[#070A13] hover:bg-[#F3E5AB] font-bold">
                  Log In
                </Button>
              </Link> */}
            </div>
          </motion.div>
        )}
      </nav>

      <main className="relative z-10">

        {/* ── HERO SECTION ── */}
        <section id="home" className="relative py-40 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[90vh] overflow-hidden">

          {/* 🔹 Background Image (always visible as fallback / base layer) */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/investor_meeting.jpg" // your image
              alt="background"
              className="w-full h-full object-cover opacity-70 transition-opacity duration-1000"
            />
          </div>

          {/* 🔹 Background Video */}
          <video
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-80' : 'opacity-0'
            }`}
            src="/video/intro_video.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/images/investor_meeting.jpg"
            onCanPlay={() => {
              setVideoLoaded(true);
            }}
          />

          <div className="absolute inset-0 bg-black/60 z-0"></div>

          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeIn}
            className="max-w-5xl mx-auto text-center relative z-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-block border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] px-6 py-2 rounded-full text-sm font-medium tracking-widest uppercase backdrop-blur-sm shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                Institutional-Grade Bitcoin IRA
              </span>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tighter font-serif"
            >
              Build Your Future with
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA8C2C] filter drop-shadow-[0_2px_10px_rgba(212,175,55,0.2)]">
                Bitcoin Retirement Accounts
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed tracking-wide"
            >
              Transform your retirement strategy with secure, compliant Bitcoin IRAs. Professional custody, tax advantages, and transparent investing.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-6"
            >
              <a href="https://investmentportalfrontend.vercel.app/auth/investor-signup?flow=investor">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-[#020817] hover:brightness-110 text-lg px-12 py-7 rounded-xl font-bold shadow-[0_4px_30px_rgba(212,175,55,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                >
                  Open Your IRA Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a href="https://investmentportalfrontend.vercel.app/auth/login?flow=investor">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/5 backdrop-blur-md text-lg px-12 py-7 rounded-xl border border-white/10 text-white hover:bg-white/10 hover:border-white/20 font-semibold transition-all duration-300 transform hover:-translate-y-1"
                >
                  Access Your Account
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* ── TRUST & FEATURES BAR ── */}
        <section className="bg-[#0B132B] border-y border-white/5 relative z-20 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-center justify-between">
              {/* Lower Risk */}
              <div className="flex items-center justify-center md:justify-start gap-4 group">
                <div className="bg-[#D4AF37]/10 p-3 rounded-xl text-[#D4AF37] group-hover:bg-[#D4AF37]/20 group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <PiggyBank className="h-6 w-6" />
                </div>
                <span className="text-base font-bold tracking-widest text-white uppercase group-hover:text-[#D4AF37] transition-colors">
                  Lower Risk
                </span>
              </div>

              {/* Higher Yield */}
              <div className="flex items-center justify-center md:justify-center gap-4 group">
                <div className="bg-[#D4AF37]/10 p-3 rounded-xl text-[#D4AF37] group-hover:bg-[#D4AF37]/20 group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-base font-bold tracking-widest text-white uppercase group-hover:text-[#D4AF37] transition-colors">
                  Higher Yield
                </span>
              </div>

              {/* Personalized Service */}
              <div className="flex items-center justify-center md:justify-end gap-4 group">
                <div className="bg-[#D4AF37]/10 p-3 rounded-xl text-[#D4AF37] group-hover:bg-[#D4AF37]/20 group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <Handshake className="h-6 w-6" />
                </div>
                <span className="text-base font-bold tracking-widest text-white uppercase group-hover:text-[#D4AF37] transition-colors">
                  Personalized Service
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT WE OFFER ── */}
        <section id="funds" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <span className="text-[#D4AF37] font-semibold tracking-widest uppercase text-xs">What We Offer</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="grid md:grid-cols-2 gap-16 items-center"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-[#1b3a68] mb-8 leading-tight font-serif">
                  Reach Your Investment Goals With InvestmentPortal
                </h2>
                <p className="leading-relaxed mb-6">
                  Traditional investments like mutual funds, single stocks, and single-family real estate all have major disadvantages and leave you with lower returns or higher risk.
                </p>
                <p className="leading-relaxed">
                  We&apos;re taking a stand against weak investments with a different solution: Apartment Multifamily Investing.
                </p>
              </div>
              <div className="relative">
                <div className="relative bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden aspect-[4/3]">
                  <Image
                    src="/images/financial-goals-investment.jpg"
                    alt="Financial Goals"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="portfolio" className="py-32 bg-[#020817] px-4 sm:px-6 lg:px-8 border-y border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-4"
            >
              <span className="text-[#D4AF37] font-semibold tracking-widest uppercase text-xs">How It Works</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-white mb-6 font-serif"
            >
              Apartment real estate investing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-slate-400 leading-relaxed max-w-3xl mb-20"
            >
              Traditional investments like mutual funds and single stocks offer far too low returns for far too high risk. Apartment real estate investments already earn large percentages of the year. We'll send you our approach and give you a schedule of quarterly payments directly paid out. Check out our 3-step approach to multifamily real estate investing career.
            </motion.p>

            <div className="space-y-24">
              {/* Step 01 */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                <div className="relative pl-8">
                  <span className="step-number">01</span>
                  <div className="pt-12">
                    <h3 className="text-2xl font-bold text-white mb-4 font-serif">Multiple investors pool funds for a downpayment</h3>
                    <p className="text-slate-400 leading-relaxed mb-3">
                      Multiple investors pool funds for a down payment and Ovalia serves as the General Partner of an Apartment Real Estate Investment property.
                    </p>
                    <p className="text-slate-500 text-sm italic">
                      "The majority of the income comes from the pool."
                    </p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden aspect-video relative">
                  <Image
                    src="/images/group_investment_meeting.jpg"
                    alt="Multiple investors pooling funds"
                    fill
                    className="object-cover"
                  />
                </div>
              </motion.div>

              {/* Step 02 */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                <div className="order-2 md:order-1 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden aspect-video">
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden aspect-video relative">
                    <Image
                      src="/images/property_renovated_increased.jpg"
                      alt="Property is Renovated"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="order-1 md:order-2 relative pl-8">
                  <span className="step-number">02</span>
                  <div className="pt-12">
                    <h3 className="text-2xl font-bold text-white mb-4 font-serif">The property is renovated and rents increased</h3>
                    <p className="text-slate-400 leading-relaxed">
                      The property is renovated, rents are increased, and better tenants arrive through aggressive marketing.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Step 03 */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                <div className="relative pl-8">
                  <span className="step-number">03</span>
                  <div className="pt-12">
                    <h3 className="text-2xl font-bold text-white mb-4 font-serif">Investors receive quarterly distributions of profits</h3>
                    <p className="text-slate-400 leading-relaxed mb-3">
                      Investors receive quarterly distributions of profits. Once the apartment complex has maintained profitability, it is sold for a much higher price.
                    </p>
                    <p className="text-slate-500 text-sm italic">
                      "All profits are paid out to investors."
                    </p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden aspect-video">
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden aspect-video relative">
                    <Image
                      src="/images/investors_receive_quarterly.jpg"
                      alt="Investors Receive Quarterly"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── INVESTMENT STRATEGY ── */}
        <section id="about" className="py-32 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-4"
            >
              <span className="text-[#D4AF37] font-semibold tracking-widest uppercase text-xs">Get Started</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-[#1b3a68] mb-6 font-serif"
            >
              Investment strategy tailored to your needs
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="leading-relaxed max-w-3xl mb-16"
            >
              We believe in a plan where your money into something that doesn't suits your tolerance as much as possible. We understand investing can be filled with fear. It can be challenging when you're going to get your most advanced opportunity. We've helped people just like you invest in apartment real estate investment structures and achieve high returns with low risk.
            </motion.p>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  num: '01',
                  title: 'Schedule Intro Call',
                  desc: 'We want to understand your goals to see if this investment is right for you. (15–30 Minutes)',
                  icon: <Phone className="h-6 w-6" />,
                },
                {
                  num: '02',
                  title: 'Investment Strategy Check & Plan',
                  desc: 'Receive a complimentary investment strategy check to maximize the use of tax savings and investing structures.',
                  icon: <FileText className="h-6 w-6" />,
                },
                {
                  num: '03',
                  title: 'Invest in Apartment Real Estate',
                  desc: "You'll receive the next investment opportunity with a complete plan including when you get paid, how much, and when the complex is sold.",
                  icon: <Building2 className="h-6 w-6" />,
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  className="bg-[#0B132B] border border-white/5 hover:border-[#D4AF37]/30 p-8 rounded-3xl transition-all duration-500 group hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[#D4AF37]/40 font-serif text-3xl font-bold">{card.num}</span>
                    <div className="bg-[#D4AF37]/10 p-2 rounded-xl text-[#D4AF37] group-hover:bg-[#D4AF37]/20 transition-all duration-300">
                      {card.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-serif">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 2 WAYS TO INVEST ── */}
        <section id="insights" className="py-32 bg-[#020817] px-4 sm:px-6 lg:px-8 border-t border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-4"
            >
              <span className="text-[#D4AF37] font-semibold tracking-widest uppercase text-xs">How To Invest</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white font-serif">2 ways to invest</h2>
              <Link href="https://investmentportalfrontend.vercel.app/auth/investor-signup?flow=investor">
                <Button
                  className="bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-[#020817] hover:brightness-110 font-bold px-8 py-3 rounded-lg shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-300"
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-slate-400 leading-relaxed max-w-3xl mb-16"
            >
              We offer you different ways to invest in apartment real estate syndications. One small investment treats this as the property grows and profits will always 15% return to final price even though right for you? We'll help you decide.
            </motion.p>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Growth Plan */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="invest-card rounded-3xl overflow-hidden transition-all duration-500 group"
              >
                <div className="p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-[#D4AF37]/30 font-serif text-5xl font-bold leading-none">01</span>
                    <h3 className="text-3xl font-bold text-white font-serif">Growth plan</h3>
                  </div>
                  <p className="text-[#D4AF37] font-semibold text-sm tracking-wide uppercase mb-4">
                    Invest in this opportunity for full returns
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Historical Average of 15-17% Return on Investment',
                      'You Profit as the Property Profits',
                      'Fastest Way to Build Your Fortune',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-400 text-sm">
                        <ChevronRight className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/[0.02] overflow-hidden aspect-video relative">
                  <Image
                    src="/images/growth_plan.jpg"
                    alt="Growth plan"
                    fill
                    className="object-cover"
                  />
                </div>
              </motion.div>

              {/* Steady Returns */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="invest-card rounded-3xl overflow-hidden transition-all duration-500 group"
              >
                <div className="bg-white/[0.02] overflow-hidden aspect-video relative">
                  <Image
                    src="/images/steady_returns.jpg"
                    alt="Steady returns"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-[#D4AF37]/30 font-serif text-5xl font-bold leading-none">02</span>
                    <h3 className="text-3xl font-bold text-white font-serif">Steady returns</h3>
                  </div>
                  <p className="text-[#D4AF37] font-semibold text-sm tracking-wide uppercase mb-4">
                    10% returns paid on time
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Paid no Matter How the Property Profits',
                      'Steady Returns',
                      'Safest Way to Get Cash Flow',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-400 text-sm">
                        <ChevronRight className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── WHY CHOOSE / FEATURES ── */}
        <section id="insights" className="py-32 px-4 sm:px-6 lg:px-8 bg-white/[0.01] backdrop-blur-sm border-y border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-24"
            >
              <span className="text-[#D4AF37] font-semibold tracking-widest uppercase text-sm">Benefits</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-[#1b3a68] font-serif">Why Choose InvestmentPortal</h2>
              <p className="text-xl max-w-3xl mx-auto leading-relaxed">
                Industry-leading platform trusted by thousands of investors
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              className="grid md:grid-cols-2 gap-12"
            >
              {[
                {
                  icon: <Coins className="h-8 w-8 text-[#D4AF37]" />,
                  title: 'Bitcoin Investment',
                  desc: 'Direct Bitcoin ownership with full transparency and complete control over your assets.',
                },
                {
                  icon: <Shield className="h-8 w-8 text-[#D4AF37]" />,
                  title: 'Secure Custody',
                  desc: 'Institutional-grade security with multi-signature protection and cold storage.',
                },
                {
                  icon: <FileText className="h-8 w-8 text-[#D4AF37]" />,
                  title: 'Tax Advantages',
                  desc: 'Traditional and Roth IRA options with tax-deferred or tax-free growth potential.',
                },
                {
                  icon: <CheckCircle className="h-8 w-8 text-[#D4AF37]" />,
                  title: 'Full Compliance',
                  desc: 'Complete KYC/AML compliance and comprehensive regulatory reporting.',
                },
              ].map((feat, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  className="bg-[#020817] backdrop-blur-md p-10 rounded-3xl border border-white/5 hover:border-[#D4AF37]/30 shadow-2xl transition-all duration-500 group flex items-start gap-6 hover:-translate-y-1"
                >
                  <div className="bg-[#D4AF37]/10 rounded-2xl p-4 flex-shrink-0 group-hover:bg-[#D4AF37]/20 transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-white font-serif">{feat.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="py-40 bg-[#020817] px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-[#020817] relative overflow-hidden z-10">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none"></div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white leading-tight font-serif">
              Ready to Transform Your Retirement?
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed">
              Join thousands of investors who trust InvestmentPortal to secure their financial future with Bitcoin.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <a href="https://investmentportalfrontend.vercel.app/auth/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-[#020817] hover:brightness-110 text-xl px-16 py-8 rounded-xl font-bold shadow-[0_4px_30px_rgba(212,175,55,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                >
                  Open Your IRA Now
                </Button>
              </a>
              <a href="https://investmentportalfrontend.vercel.app/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/5 backdrop-blur-md text-xl px-16 py-8 rounded-xl border border-white/10 text-white hover:bg-white/10 hover:border-white/20 font-semibold transition-all duration-300 transform hover:-translate-y-1"
                >
                  Sign In to Your Account
                </Button>
              </a>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer id="contact" className="bg-[#020817] border-t border-white/10 py-24 relative z-20 overflow-hidden">
        {/* Premium Ambient Glow */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo.png"
                  alt="InvestmentPortal"
                  width={55}
                  height={55}
                  className="object-contain filter drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                />
                <span className="text-2xl font-extrabold text-white tracking-wider font-serif">Investment<span className="text-[#D4AF37]">Portal</span></span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Take control of your retirement strategy with the ultimate Institutional-Grade Bitcoin IRA platform. Secure, transparent, and high-growth.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase mb-6 border-l-2 border-[#D4AF37] pl-3">Funds</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><a href="#home" className="text-slate-300 hover:text-[#D4AF37] hover:translate-x-2 transition-all duration-300 inline-block">Home</a></li>
                <li><a href="#funds" className="text-slate-300 hover:text-[#D4AF37] hover:translate-x-2 transition-all duration-300 inline-block">Funds</a></li>
                <li><a href="#portfolio" className="text-slate-300 hover:text-[#D4AF37] hover:translate-x-2 transition-all duration-300 inline-block">Portfolio</a></li>
                <li><a href="#about" className="text-slate-300 hover:text-[#D4AF37] hover:translate-x-2 transition-all duration-300 inline-block">About Us</a></li>
                <li><a href="#insights" className="text-slate-300 hover:text-[#D4AF37] hover:translate-x-2 transition-all duration-300 inline-block">Insights</a></li>
                <li><a href="#contact" className="text-slate-300 hover:text-[#D4AF37] hover:translate-x-2 transition-all duration-300 inline-block">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase mb-6 border-l-2 border-[#D4AF37] pl-3">Legal</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><a href="/terms" className="text-slate-300 hover:text-[#D4AF37] hover:translate-x-2 transition-all duration-300 inline-block">Terms & Conditions</a></li>
                <li><a href="/privacy" className="text-slate-300 hover:text-[#D4AF37] hover:translate-x-2 transition-all duration-300 inline-block">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase mb-6 border-l-2 border-[#D4AF37] pl-3">Contact Us</h4>
              <ul className="space-y-4 text-sm text-slate-300 font-medium">
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <a href="mailto:invest@ovaliacapital.com" className="hover:text-[#D4AF37] transition-colors">invest@ovaliacapital.com</a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <span>New Location: Boca Raton, FL 33433</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12 flex flex-col items-center gap-8">
          {/* Social Icons Center */}
          <div className="flex items-center justify-center gap-5">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-white/5 text-slate-300 p-3.5 rounded-full hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300 border border-white/10 hover:border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white/5 text-slate-300 p-3.5 rounded-full hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300 border border-white/10 hover:border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-white/5 text-slate-300 p-3.5 rounded-full hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300 border border-white/10 hover:border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white/5 text-slate-300 p-3.5 rounded-full hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300 border border-white/10 hover:border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
              <Twitter className="h-5 w-5" />
            </a>
          </div>

          {/* Disclaimer Center */}
          <p className="text-slate-500 text-xs text-center max-w-4xl leading-relaxed tracking-wide">
            This is for informational purposes only and does not constitute an offer, solicitation, invitation or recommendation to buy, sell, subscribe for or issue any securities.
          </p>

          {/* Copyright */}
          <div className="text-slate-600 text-xs font-medium tracking-widest uppercase pt-4">
            © {new Date().getFullYear()} InvestmentPortal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}