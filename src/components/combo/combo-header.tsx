'use client';

import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComboHeaderProps {
  comboType: string;
  itemCount: number;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function ComboHeader({
  comboType,
  itemCount,
  onCancel,
  onSave,
  isSaving,
}: ComboHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between p-4">
        {/* Left: Cancel */}
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel
        </button>

        {/* Center: Title & Badge */}
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-lg">COMBO</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-primary text-primary-foreground font-medium">
              {comboType}
            </span>
            {itemCount > 0 && (
              <span className="text-muted-foreground">{itemCount} items</span>
            )}
          </div>
        </div>

        {/* Right: Save */}
        <button
          onClick={onSave}
          disabled={itemCount === 0 || isSaving}
          className="flex items-center gap-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-primary hover:text-primary/80"
        >
          <Check className="w-4 h-4" />
          {isSaving ? 'Saving' : 'Save'}
        </button>
      </div>
    </div>
  );
}
