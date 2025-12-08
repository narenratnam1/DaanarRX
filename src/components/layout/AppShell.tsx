'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { restoreAuth, logout } from '../../store/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { ClinicSwitcher } from '../ClinicSwitcher';
import { AppInitializer } from '../AppInitializer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  PackageCheck,
  PackageMinus,
  QrCode,
  Package,
  FileText,
  Settings,
  LogOut,
  MapPin,
  Menu,
  Loader2,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
}

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {item.badge}
        </span>
      )}
    </button>
  );
}

function Sidebar({ navItems, pathname, onNavigate }: { 
  navItems: NavItem[]; 
  pathname: string; 
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="px-3">
        <h2 className="mb-2 px-3 text-lg font-semibold tracking-tight">
          Navigation
        </h2>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              onClick={() => onNavigate(item.href)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isAuthenticated, hasHydrated } = useAuth();

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout(undefined));
    router.push('/auth/signin');
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems: NavItem[] = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: PackageCheck, label: 'Check In', href: '/checkin' },
    { icon: PackageMinus, label: 'Check Out', href: '/checkout' },
    { icon: QrCode, label: 'Scan/Lookup', href: '/scan' },
    { icon: Package, label: 'Inventory', href: '/inventory' },
    { icon: FileText, label: 'Reports', href: '/reports' },
  ];

  // Add Admin for admin and superadmin
  if (user?.userRole === 'admin' || user?.userRole === 'superadmin') {
    navItems.push({ icon: MapPin, label: 'Admin', href: '/admin' });
  }

  // Add Settings for admin and superadmin
  if (user?.userRole === 'admin' || user?.userRole === 'superadmin') {
    navItems.push({ icon: Settings, label: 'Settings', href: '/settings' });
  }

  return (
    <AppInitializer>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r bg-card lg:block">
          <div className="flex h-16 items-center border-b px-6">
            <h1 className="text-xl font-bold">DaanaRX</h1>
          </div>
          <Sidebar navItems={navItems} pathname={pathname} onNavigate={handleNavigation} />
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-6">
                  <h1 className="text-xl font-bold">DaanaRX</h1>
                </div>
                <Sidebar navItems={navItems} pathname={pathname} onNavigate={handleNavigation} />
              </SheetContent>
            </Sheet>

            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="hidden text-xl font-bold lg:block">DaanaRX</h1>
                <ClinicSwitcher />
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden text-sm md:block">
                  <span className="font-medium">{user?.username}</span>
                  <span className="ml-2 text-muted-foreground">({user?.userRole})</span>
                </div>
                <Separator orientation="vertical" className="hidden h-6 md:block" />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AppInitializer>
  );
}
