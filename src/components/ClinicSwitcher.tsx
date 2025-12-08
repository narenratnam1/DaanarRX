'use client';

import { useSelector, useDispatch } from 'react-redux';
import { Building2, ChevronDown } from 'lucide-react';
import { RootState } from '../store';
import { switchClinic } from '../store/authSlice';
import { Clinic } from '../types';
import { apolloClient } from '../lib/apollo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function ClinicSwitcher() {
  const dispatch = useDispatch();
  const { clinic, clinics } = useSelector((state: RootState) => state.auth);

  // If user only has one clinic, just show the clinic name without dropdown
  if (!clinics || clinics.length <= 1) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{clinic?.name || 'No Clinic'}</span>
      </div>
    );
  }

  const handleClinicSwitch = async (selectedClinic: Clinic) => {
    dispatch(switchClinic(selectedClinic));
    
    // Clear Apollo cache to ensure fresh data for the new clinic
    if (apolloClient) {
      await apolloClient.clearStore();
    }
    
    // Refresh the page to reload data for the new clinic
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">{clinic?.name || 'Select Clinic'}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>Switch Clinic</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {clinics.map((c) => (
          <DropdownMenuItem
            key={c.clinicId}
            onClick={() => handleClinicSwitch(c)}
            disabled={c.clinicId === clinic?.clinicId}
            className={cn(
              'cursor-pointer',
              c.clinicId === clinic?.clinicId && 'bg-accent'
            )}
          >
            <Avatar className="mr-2 h-6 w-6">
              <AvatarImage src={c.logoUrl} alt={c.name} />
              <AvatarFallback style={{ backgroundColor: c.primaryColor || '#3b82f6' }}>
                {c.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{c.name}</span>
              {c.userRole && (
                <span className="text-xs text-muted-foreground">{c.userRole}</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
