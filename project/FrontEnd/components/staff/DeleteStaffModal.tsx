'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';

interface DeleteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  staffName?: string;
  staffRole?: string;
}

export const DeleteStaffModal: React.FC<DeleteStaffModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  staffName,
  staffRole = 'staff member',
}) => {
  // Format the role to display correctly in the title (e.g. "Accountant")
  const displayRole = staffRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[460px] px-10 py-6 rounded-[16px] border-none shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <AlertDialogHeader className="mb-4 text-left">
          <AlertDialogTitle className="text-[24px] font-serif font-bold text-[#1F1F1F] mb-2 leading-tight">
            Delete {displayRole}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] text-[#4B4B4B] leading-relaxed space-y-2">
            <p>
              Are you sure you want to delete this {staffRole?.replace(/_/g, ' ') || 'staff member'}? This action cannot be undone.
            </p>
            <p className="font-bold text-[#1F1F1F]">
              All assigned investors will be unassigned.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-row justify-center gap-4 sm:justify-center mt-4">
          <AlertDialogCancel
            onClick={onClose}
            className="flex-1 max-w-[130px] px-6 py-2.5 rounded-full bg-[#FFFBEB] hover:bg-[#FEF3C7] text-gray-500 font-semibold border-none transition-all h-[44px] text-[14px]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 max-w-[150px] px-6 py-2.5 rounded-full bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1F1F1F] font-bold border-none shadow-sm transition-all h-[44px] text-[14px]"
          >
            Yes, Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
