'use client';

import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Text, 
  Title,
  Group, 
  Stack, 
  Loader, 
  Center, 
  Box,
  UnstyledButton,
  ThemeIcon,
  SimpleGrid,
  Badge,
} from '@mantine/core';
import {
  IconPackage,
  IconAlertTriangle,
  IconArrowUp,
  IconArrowDown,
  IconExclamationCircle,
  IconBoxSeam,
  IconShoppingCart,
  IconQrcode,
  IconFileAnalytics,
  IconStack2,
  IconChevronRight,
} from '@tabler/icons-react';
import { AppShell } from '../components/layout/AppShell';
import { PageHeader } from '../components/PageHeader';

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      totalUnits
      unitsExpiringSoon
      recentCheckIns
      recentCheckOuts
      lowStockAlerts
    }
  }
`;

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: string | number }>;
  color: string;
  href: string;
}

function QuickActionCard({ title, description, icon: Icon, color, href }: QuickActionCardProps) {
  const router = useRouter();

  return (
    <UnstyledButton
      onClick={() => router.push(href)}
      style={{
        width: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Card
        shadow="sm"
        padding="xl"
        radius="md"
        withBorder
        style={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group wrap="nowrap">
            <ThemeIcon size={50} radius="md" color={color} variant="light">
              <Icon size={28} />
            </ThemeIcon>
            <div>
              <Text size="lg" fw={600} mb={4}>
                {title}
              </Text>
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            </div>
          </Group>
          <IconChevronRight size={24} style={{ opacity: 0.5, flexShrink: 0 }} />
        </Group>
      </Card>
    </UnstyledButton>
  );
}

export default function HomePage() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS);

  return (
    <AppShell>
      <Stack gap="xl">
        <PageHeader title="Dashboard" description="Overview of your clinic's inventory" showBackButton={false} />

        {/* Compact Stats Bar */}
        {data && (
          <Card 
            shadow="sm" 
            padding="md" 
            radius="md" 
            withBorder
            style={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 100,
              backgroundColor: 'var(--mantine-color-body)'
            }}
          >
            <Group justify="space-between" wrap="wrap" gap="md">
              <Group gap="xs">
                <ThemeIcon size={32} radius="md" color="blue" variant="light">
                  <IconPackage size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Total</Text>
                  <Badge size="lg" color="blue" variant="filled">
                    {data.getDashboardStats.totalUnits}
                  </Badge>
                </div>
              </Group>

              <Group gap="xs">
                <ThemeIcon size={32} radius="md" color="orange" variant="light">
                  <IconAlertTriangle size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Expiring</Text>
                  <Badge size="lg" color="orange" variant="filled">
                    {data.getDashboardStats.unitsExpiringSoon}
                  </Badge>
                </div>
              </Group>

              <Group gap="xs">
                <ThemeIcon size={32} radius="md" color="red" variant="light">
                  <IconExclamationCircle size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Low Stock</Text>
                  <Badge size="lg" color="red" variant="filled">
                    {data.getDashboardStats.lowStockAlerts}
                  </Badge>
                </div>
              </Group>

              <Group gap="xs">
                <ThemeIcon size={32} radius="md" color="green" variant="light">
                  <IconArrowUp size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Check-ins</Text>
                  <Badge size="lg" color="green" variant="filled">
                    {data.getDashboardStats.recentCheckIns}
                  </Badge>
                </div>
              </Group>

              <Group gap="xs">
                <ThemeIcon size={32} radius="md" color="teal" variant="light">
                  <IconArrowDown size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Check-outs</Text>
                  <Badge size="lg" color="teal" variant="filled">
                    {data.getDashboardStats.recentCheckOuts}
                  </Badge>
                </div>
              </Group>
            </Group>
          </Card>
        )}

        {loading && (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        )}

        {error && (
          <Center h={200}>
            <Text c="red">Error loading dashboard: {error.message}</Text>
          </Center>
        )}

        <Box mt="xl">
          <Title order={2} mb="lg">
            Quick Actions
          </Title>
          <SimpleGrid
            cols={{ base: 1, sm: 2 }}
            spacing="md"
          >
            <QuickActionCard
              title="Check In Medications"
              description="Add new medications to inventory"
              icon={IconBoxSeam}
              color="blue"
              href="/checkin"
            />
            <QuickActionCard
              title="Check Out Medications"
              description="Dispense medications to patients"
              icon={IconShoppingCart}
              color="green"
              href="/checkout"
            />
            <QuickActionCard
              title="Scan QR Code"
              description="Quick lookup and actions"
              icon={IconQrcode}
              color="violet"
              href="/scan"
            />
            <QuickActionCard
              title="View Inventory"
              description="Browse all medications"
              icon={IconStack2}
              color="teal"
              href="/inventory"
            />
            <QuickActionCard
              title="Reports & Analytics"
              description="View detailed reports"
              icon={IconFileAnalytics}
              color="indigo"
              href="/reports"
            />
          </SimpleGrid>
        </Box>
      </Stack>
    </AppShell>
  );
}
