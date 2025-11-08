"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, LogOut, Users, GraduationCap, FileText, Settings, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  userEmail: string;
  onSignOut: () => void;
}

export function DashboardNav({ userEmail, onSignOut }: DashboardNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/tutors', label: 'Tutors', icon: GraduationCap },
    { href: '/students', label: 'Students', icon: Users },
    { href: '/dashboard/sessions', label: 'Sessions', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    { href: '/dashboard/generate', label: 'Generate', icon: Database },
  ];

  return (
    <header className="border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">TutorReview</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === link.href || pathname.startsWith(link.href + '/');

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Sign Out */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-muted-foreground">
            {userEmail}
          </span>
          <Button variant="ghost" size="sm" className="gap-2" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-border px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
