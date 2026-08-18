import React from 'react';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogBody, useDisclosure, Button, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface DocumentData {
  title: string;
  sections: { id: string; title: string; content: string }[];
}

interface DocumentPreviewProps {
  documentData: DocumentData;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewProps> = ({
  documentData,
  isOpen,
  isLoading,
  onClose,
}) => {
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <DialogOverlay>
        <Dialog onClose={handleClose}>
          <DialogHeader>
            <DialogTitle>Loading Document...</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Spinner />
          </DialogBody>
        </Dialog>
      </DialogOverlay>
    );
  }

  return (
    <DialogOverlay>
      <Dialog onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>{documentData.title}</DialogTitle>
          <Button onClick={handleClose} variant="secondary" size="sm">
            Close
          </Button>
        </DialogHeader>
        <DialogBody className="p-4 space-y-4">
          {documentData.sections.map((section) => (
            <Box key={section.id} mb={4}>
              <Typography variant="subtitle2" fontWeight="medium">
                {section.title}
              </Typography>
              <Typography variant="body2">{section.content}</Typography>
            </Box>
          ))}
        </DialogBody>
      </Dialog>
    </DialogOverlay>
  );
};