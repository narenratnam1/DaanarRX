'use client';

import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { CreateFeedbackResponse } from '../types/graphql';

interface FeedbackModalProps {
  opened: boolean;
  onClose: () => void;
}

const CREATE_FEEDBACK = gql`
  mutation CreateFeedback($input: CreateFeedbackInput!) {
    createFeedback(input: $input) {
      feedbackId
      feedbackType
      feedbackMessage
      createdAt
    }
  }
`;

const FEEDBACK_TYPES: { value: string; label: string }[] = [
  { value: 'Feature_Request', label: 'Feature Request' },
  { value: 'Bug', label: 'Bug' },
  { value: 'Other', label: 'Other' },
];

export function FeedbackModal({ opened, onClose }: FeedbackModalProps) {
  const { toast } = useToast();
  const [feedbackType, setFeedbackType] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const [createFeedback, { loading: isSubmitting }] = useMutation<CreateFeedbackResponse>(
    CREATE_FEEDBACK,
    {
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Thank you for your feedback! We appreciate your input.',
        });
        // Reset form
        setFeedbackType('');
        setFeedbackMessage('');
        onClose();
      },
      onError: (error) => {
        console.error('Error submitting feedback:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit feedback. Please try again.',
          variant: 'destructive',
        });
      },
    }
  );

  const handleSubmit = () => {
    if (!feedbackType || !feedbackMessage.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a feedback type and enter a message',
        variant: 'destructive',
      });
      return;
    }

    createFeedback({
      variables: {
        input: {
          feedbackType,
          feedbackMessage: feedbackMessage.trim(),
        },
      },
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFeedbackType('');
      setFeedbackMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={opened} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            We&apos;d love to hear your thoughts on how we can improve.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback Type</Label>
            <Select
              value={feedbackType}
              onValueChange={setFeedbackType}
              disabled={isSubmitting}
            >
              <SelectTrigger id="feedback-type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              placeholder="Tell us what's on your mind..."
              rows={5}
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !feedbackType || !feedbackMessage.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
