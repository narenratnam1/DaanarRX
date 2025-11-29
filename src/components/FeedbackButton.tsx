'use client';

import { useState } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackButton() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Tooltip label="Send Feedback" position="left">
        <ActionIcon
          size={56}
          radius="xl"
          variant="filled"
          color="blue"
          onClick={() => setOpened(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <IconMessageCircle size={28} />
        </ActionIcon>
      </Tooltip>

      <FeedbackModal opened={opened} onClose={() => setOpened(false)} />
    </>
  );
}
