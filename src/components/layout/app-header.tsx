'use client';

import { useAuth } from '@/lib/auth/provider';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">Street Workout</h1>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="h-8 w-8"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
