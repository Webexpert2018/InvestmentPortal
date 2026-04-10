'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bitcoin, Shield, TrendingUp, FileText, ArrowRight, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function HomePage() {
  const { isAuthenticated, isAdmin, isAccountant, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, isAccountant, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F3B6E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-26">
            <a href="/" className="flex justify-center" style={{ width: '160px', height: '120px' }}>
              <Image 
                src="/images/logo.png" 
                alt="Ovalia Capital" 
                width={100} 
                height={100}
                className="object-contain mx-auto logo-con"
              />
            </a>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-[#1F3B6E] hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Sign In
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 p-1">
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 active:bg-slate-100 transition-colors px-3 py-2"
                    onSelect={() => router.push('/auth/login?flow=admin')}
                  >
                    Admin login
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 active:bg-slate-100 transition-colors px-3 py-2"
                    onSelect={() => router.push('/auth/login?flow=account')}
                  >
                    Accountant login
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 active:bg-slate-100 transition-colors px-3 py-2"
                    onSelect={() => router.push('/auth/login?flow=investor')}
                  >
                    Investor login
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/auth/signup">
                <Button 
                  className="bg-[#1F3B6E] text-white hover:bg-[#2F4B7E] font-semibold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F8FAFC] via-white to-[#EEF2FF]">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-block bg-[#1F3B6E]/10 text-[#1F3B6E] px-6 py-2 rounded-full text-sm font-semibold tracking-wide uppercase">
                Institutional-Grade Bitcoin IRA
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#1F3B6E] mb-8 leading-tight">
              Build Your Future with
              <br />
              <span className="text-[#FCD34D]">Bitcoin</span> Retirement Accounts
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Transform your retirement strategy with secure, compliant Bitcoin IRAs. 
              Professional custody, tax advantages, and transparent investing.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="bg-[#1F3B6E] text-white hover:bg-[#2F4B7E] text-lg px-12 py-7 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                >
                  Open Your IRA Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-12 py-7 rounded-xl border-2 border-[#1F3B6E] text-[#1F3B6E] hover:bg-[#1F3B6E] hover:text-white font-semibold transition-all"
                >
                  Access Your Account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-28 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1F3B6E]">
                Why Choose Ovalia Capital
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Industry-leading platform trusted by thousands of investors
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Bitcoin Investment */}
              <div className="bg-gradient-to-br from-orange-50 to-white p-10 rounded-2xl hover:shadow-2xl transition-all border border-orange-100 hover:border-orange-200">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
                  <Bitcoin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1F3B6E]">Bitcoin Investment</h3>
                <p className="text-gray-600 leading-relaxed">
                  Direct Bitcoin ownership with full transparency and complete control over your assets
                </p>
              </div>

              {/* Secure Custody */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-10 rounded-2xl hover:shadow-2xl transition-all border border-blue-100 hover:border-blue-200">
                <div className="bg-gradient-to-br from-[#6B7FBA] to-[#1F3B6E] rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1F3B6E]">Secure Custody</h3>
                <p className="text-gray-600 leading-relaxed">
                  Institutional-grade security with multi-signature protection and cold storage
                </p>
              </div>

              {/* Tax Advantages */}
              <div className="bg-gradient-to-br from-green-50 to-white p-10 rounded-2xl hover:shadow-2xl transition-all border border-green-100 hover:border-green-200">
                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1F3B6E]">Tax Advantages</h3>
                <p className="text-gray-600 leading-relaxed">
                  Traditional and Roth IRA options with tax-deferred or tax-free growth potential
                </p>
              </div>

              {/* Full Compliance */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-10 rounded-2xl hover:shadow-2xl transition-all border border-gray-200 hover:border-gray-300">
                <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1F3B6E]">Full Compliance</h3>
                <p className="text-gray-600 leading-relaxed">
                  Complete KYC/AML compliance and comprehensive regulatory reporting
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1F3B6E] to-[#2F4B7E] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Retirement?
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed">
              Join thousands of investors who trust Ovalia Capital to secure their financial future with Bitcoin
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="bg-[#FCD34D] text-[#1F3B6E] hover:bg-[#FDE68A] text-lg px-14 py-7 rounded-xl font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:-translate-y-1"
                >
                  Open Your IRA Now
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button 
                  size="lg" 
                  className="bg-[#1F3B6E] text-white hover:bg-[#2F4B7E] text-lg px-14 py-7 rounded-xl font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:-translate-y-1"
                >
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1F3B6E] border-t border-[#2F4B7E] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110"
              >
                <Linkedin className="h-5 w-5 text-white" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110"
              >
                <Twitter className="h-5 w-5 text-white" />
              </a>
            </div>
            
            {/* Footer Text */}
            <div className="text-center">
              <p className="text-blue-200 text-sm mb-2 font-medium">
                Secure Bitcoin IRA Solutions
              </p>
              <p className="text-blue-300 text-xs">
                &copy; 2024 Ovalia Capital. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
