import React from 'react';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogBody, useDisclosure, Button, List, ListItem, ListItemMeta, Avatar, ListItemText } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useState } from 'react';

interface Message {
  id: string;
  sender: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  messages,
}) => {
  const { isOpen: open, setOpen } = useDisclosure();
  const toast = useToast();

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  if (!open) return null;

  return (
    <DialogOverlay>
      <Dialog onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Message Center</DialogTitle>
          <Button onClick={handleClose} variant="secondary" size="sm">
            Close
          </Button>
        </DialogHeader>
        <DialogBody>
          <List>
            {messages.map((msg) => (
              <ListItem key={msg.id}>
                <ListItemMeta
                  avatar={<Avatar>{msg.sender[0]}</Avatar>}
                  title={msg.sender}
                  description={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(msg.timestamp).toLocaleString()}
                      </Typography>
                      <span className="text-xs font-medium">
                        {msg.status}
                      </span>
                    </Box>
                  }
                />
                <ListItemText primary={msg.content} />
              </ListItem>
            ))}
          </List>
        </DialogBody>
      </Dialog>
    </DialogOverlay>
  );
};