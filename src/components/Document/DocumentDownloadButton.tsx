import React from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import axios from 'axios';

interface DocumentDownloadButtonProps {
  documentId: string;
  fileType: 'pdf' | 'docx';
  isLoading?: boolean;
  onError?: () => void;
}

export const DocumentDownloadButton: React.FC<DocumentDownloadButtonProps> = ({
  documentId,
  fileType,
  isLoading,
  onError,
}) => {
  const toast = useToast();

  const handleDownload = async () => {
    if (isLoading) return;
    try {
      const response = await axios.get(`/api/documents/${documentId}/${fileType}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentId}.${fileType}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      onError?.();
      toast({
        title: 'Download failed',
        description: 'Could not download the document.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      className="w-full"
      loading={isLoading}
    >
      {isLoading ? 'Generating...' : `Download ${fileType.toUpperCase()} (${documentId})`}
    </Button>
  );
};