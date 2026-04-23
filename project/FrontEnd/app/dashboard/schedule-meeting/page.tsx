'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Calendar } from 'lucide-react';

export default function ScheduleMeetingPage() {
  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-160px)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF3D6] text-[#E29F3A]">
            <Calendar className="h-10 w-10" />
          </div>
          <h1 className="font-goudy text-4xl font-bold text-[#1F1F1F] md:text-5xl">
            Coming Soon
          </h1>
          <p className="mt-4 font-helvetica text-lg text-[#8E8E93]">
            We&apos;re working on something exciting. Stay tuned!
          </p>
          <div className="mt-8">
            <div className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-1/2 animate-[loading_2s_infinite] bg-[#FBCB4B]" />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </DashboardLayout>
  );
}
