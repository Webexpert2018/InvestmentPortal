'use client';

import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}