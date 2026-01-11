'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pencil, Calendar, TrendingUp, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/app/log', icon: Pencil, label: 'Log', key: 'log' },
  { href: '/app/session', icon: Calendar, label: 'Session', key: 'session' },
  { href: '/app/insights', icon: TrendingUp, label: 'Insights', key: 'insights' },
  { href: '/app/history', icon: BarChart3, label: 'History', key: 'history' },
  { href: '/app/settings', icon: Settings, label: 'Settings', key: 'settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.includes(item.key);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
