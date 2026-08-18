import React from 'react';
import { Box } from '@/components/ui';
import { Spinner } from '@/components/ui/Spinner';

interface LoadingOverlayProps {
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ children }) => (
  <Box className="flex h-screen w-full items-center justify-center bg-black bg-opacity-25">
    <Spinner />
  </Box>
);