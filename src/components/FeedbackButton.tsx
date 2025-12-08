'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackButton() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              onClick={() => setOpened(true)}
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="sr-only">Send Feedback</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Send Feedback</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <FeedbackModal opened={opened} onClose={() => setOpened(false)} />
    </>
  );
}
