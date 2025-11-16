'use client';

import { useRouter } from 'next/navigation';
import { Group, Title, Text, ActionIcon, Box } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
}

export function PageHeader({ title, description, showBackButton = true }: PageHeaderProps) {
  const router = useRouter();

  return (
    <Box mb="xl">
      <Group gap="md" align="flex-start">
        {showBackButton && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => router.back()}
            aria-label="Go back"
            mt={4}
          >
            <IconArrowLeft size={24} />
          </ActionIcon>
        )}
        <div style={{ flex: 1 }}>
          <Title order={1}>{title}</Title>
          {description && (
            <Text c="dimmed" size="sm" mt={4}>
              {description}
            </Text>
          )}
        </div>
      </Group>
    </Box>
  );
}
