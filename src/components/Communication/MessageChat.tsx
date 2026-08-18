import React, { useState } from 'react';
import clsx from 'clsx';
import { Chat, ChatHeader, ChatMessage, ChatInput, TextInput } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import axios from 'axios';

interface Message {
  id: string;
  sender: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

interface MessageChatProps {
  initialMessages: Message[];
  onMessageSend: (content: string) => void;
}

export const MessageChat: React.FC<MessageChatProps> = ({
  initialMessages,
  onMessageSend,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const toast = useToast();

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'User',
      content: input.trim(),
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    try {
      await axios.post('/api/messages', newMessage);
      // Optionally handle delivery status updates here
    } catch (err) {
      toast({
        title: 'Send failed',
        description: 'Could not deliver message.',
        variant: 'destructive',
      });
      // Update status if needed
    }
  };

  return (
    <Chat>
      <ChatHeader>
        <ChatMessage>
          {messages.map((msg) => (
            <ChatMessage key={msg.id}>
              <div className={clsx(
                'flex justify-between mt-1',
                msg.status === 'sent' && 'justify-end',
                msg.status === 'delivered' && 'justify-end text-gray-500',
                msg.status === 'read' && 'justify-end text-gray-400',
                msg.status === 'failed' && 'text-red-500'
              )}>
                <div className={clsx(
                  'max-w-xs p-2 rounded bg-white shadow',
                  msg.status === 'sent' && 'bg-blue-100',
                  msg.status === 'delivered' && 'bg-gray-100',
                  msg.status === 'read' && 'bg-gray-200',
                  msg.status === 'failed' && 'bg-red-100'
                )}>
                  <p className="text-sm">{msg.content}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </ChatMessage>
          ))}
        </ChatHeader>
      </ChatHeader>
      <ChatInput>
        <TextInput
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSend}
        />
      </ChatInput>
    </Chat>
  );
};