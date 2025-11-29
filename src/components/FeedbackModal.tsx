'use client';

import { useState } from 'react';
import { Modal, Select, Textarea, Button, Stack, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { gql, useMutation } from '@apollo/client';
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
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const [createFeedback, { loading: isSubmitting }] = useMutation<CreateFeedbackResponse>(
    CREATE_FEEDBACK,
    {
      onCompleted: () => {
        notifications.show({
          title: 'Success',
          message: 'Thank you for your feedback! We appreciate your input.',
          color: 'green',
        });
        // Reset form
        setFeedbackType(null);
        setFeedbackMessage('');
        onClose();
      },
      onError: (error) => {
        console.error('Error submitting feedback:', error);
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to submit feedback. Please try again.',
          color: 'red',
        });
      },
    }
  );

  const handleSubmit = () => {
    if (!feedbackType || !feedbackMessage.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please select a feedback type and enter a message',
        color: 'red',
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
      setFeedbackType(null);
      setFeedbackMessage('');
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Send Feedback"
      size="md"
      centered
    >
      <Stack gap="md">
        <Select
          label="Feedback Type"
          placeholder="Select a type"
          data={FEEDBACK_TYPES}
          value={feedbackType}
          onChange={(value) => setFeedbackType(value)}
          required
          disabled={isSubmitting}
        />

        <Textarea
          label="Message"
          placeholder="Tell us what's on your mind..."
          minRows={4}
          maxRows={8}
          value={feedbackMessage}
          onChange={(e) => setFeedbackMessage(e.currentTarget.value)}
          required
          disabled={isSubmitting}
        />

        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!feedbackType || !feedbackMessage.trim()}
          >
            Submit Feedback
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
