'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export default function AlertModal({ 
  open, 
  onOpenChange, 
  title,
  message,
  variant = 'info'
}: AlertModalProps) {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-orange-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getDefaultTitle = () => {
    switch (variant) {
      case 'success':
        return '성공';
      case 'warning':
        return '경고';
      case 'error':
        return '오류';
      default:
        return '알림';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title || getDefaultTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// 편리한 훅 제공
export function useAlertModal() {
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title?: string;
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
  });

  const showAlert = (
    message: string, 
    options?: { 
      title?: string; 
      variant?: 'info' | 'success' | 'warning' | 'error';
    }
  ) => {
    setAlertState({
      open: true,
      message,
      title: options?.title,
      variant: options?.variant || 'info',
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, open: false }));
  };

  return {
    alertState,
    showAlert,
    closeAlert,
  };
}

import { useState } from 'react';
