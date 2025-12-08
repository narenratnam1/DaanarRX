'use client';

import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PackageCheck,
  PackageMinus,
  QrCode,
  FileText,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
}

function QuickActionCard({ title, description, icon: Icon, color, href }: QuickActionCardProps) {
  const router = useRouter();

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      onClick={() => router.push(href)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-lg p-2",
            color === "blue" && "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
            color === "green" && "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
            color === "violet" && "bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
            color === "teal" && "bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
            color === "indigo" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg mb-1">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  variant = 'default'
}: { 
  title: string; 
  value: number; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  variant?: 'default' | 'warning' | 'danger';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "rounded-lg p-2",
          color === "blue" && "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
          color === "orange" && "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
          color === "red" && "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
          color === "green" && "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
          color === "teal" && "bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        {variant === 'warning' && value > 0 && (
          <Badge variant="outline" className="mt-2 border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400">
            Needs attention
          </Badge>
        )}
        {variant === 'danger' && value > 0 && (
          <Badge variant="outline" className="mt-2 border-red-500 text-red-600 dark:border-red-400 dark:text-red-400">
            Action required
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS);
  const router = useRouter();

  // Only show loading skeleton if we have no data and are loading
  // This prevents flash of loading state when navigating with cached data
  const showLoading = loading && !data;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your clinic&apos;s inventory
          </p>
        </div>

        {/* Stats Grid */}
        {showLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading dashboard: {error.message}
            </AlertDescription>
          </Alert>
        ) : data ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total Units"
              value={data.getDashboardStats.totalUnits}
              icon={Package}
              color="blue"
            />
            <StatCard
              title="Expiring Soon"
              value={data.getDashboardStats.unitsExpiringSoon}
              icon={AlertTriangle}
              color="orange"
              variant="warning"
            />
            <StatCard
              title="Low Stock"
              value={data.getDashboardStats.lowStockAlerts}
              icon={AlertCircle}
              color="red"
              variant="danger"
            />
            <StatCard
              title="Recent Check-ins"
              value={data.getDashboardStats.recentCheckIns}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Recent Check-outs"
              value={data.getDashboardStats.recentCheckOuts}
              icon={TrendingDown}
              color="teal"
            />
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
              <p className="text-muted-foreground">
                Common tasks and workflows
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickActionCard
              title="Check In Medications"
              description="Add new medications to inventory"
              icon={PackageCheck}
              color="blue"
              href="/checkin"
            />
            <QuickActionCard
              title="Check Out Medications"
              description="Dispense medications to patients"
              icon={PackageMinus}
              color="green"
              href="/checkout"
            />
            <QuickActionCard
              title="Scan QR Code"
              description="Quick lookup and actions"
              icon={QrCode}
              color="violet"
              href="/scan"
            />
            <QuickActionCard
              title="View Inventory"
              description="Browse all medications"
              icon={LayoutGrid}
              color="teal"
              href="/inventory"
            />
            <QuickActionCard
              title="Reports & Analytics"
              description="View detailed reports"
              icon={FileText}
              color="indigo"
              href="/reports"
            />
          </div>
        </div>

        {/* Alerts Section */}
        {data && (data.getDashboardStats.unitsExpiringSoon > 0 || data.getDashboardStats.lowStockAlerts > 0) && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data.getDashboardStats.unitsExpiringSoon > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">
                      {data.getDashboardStats.unitsExpiringSoon} unit(s) expiring soon
                    </div>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/inventory')}
                      >
                        View in Inventory
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              {data.getDashboardStats.lowStockAlerts > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">
                      {data.getDashboardStats.lowStockAlerts} drug(s) with low stock
                    </div>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/inventory')}
                      >
                        View in Inventory
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
