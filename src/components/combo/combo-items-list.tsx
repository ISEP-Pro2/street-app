'use client';

import { ComboItem as ComboItemType } from '@/types';
import { Trash2 } from 'lucide-react';
import ComboItemCard from './combo-item-card';

interface ComboItemsListProps {
  items: ComboItemType[];
  assistanceGlobal: number;
  overridePerItem: boolean;
  bodyweight: number;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, updates: Partial<ComboItemType>) => void;
  highlightedItemId?: string | null;
}

export default function ComboItemsList({
  items,
  assistanceGlobal,
  overridePerItem,
  bodyweight,
  onRemoveItem,
  onUpdateItem,
  highlightedItemId,
}: ComboItemsListProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          id={`item-${item.id}`}
          className={`flex gap-2 transition-colors duration-300 rounded p-1 ${
            highlightedItemId === item.id
              ? 'bg-yellow-100 dark:bg-yellow-900/30'
              : ''
          }`}
        >
          <div className="flex-1">
            <ComboItemCard
              item={item}
              index={index}
              assistanceGlobal={assistanceGlobal}
              overridePerItem={overridePerItem}
              bodyweight={bodyweight}
              onUpdate={(updates) => onUpdateItem(index, updates)}
            />
          </div>
          <button
            onClick={() => onRemoveItem(index)}
            className="flex items-center justify-center w-10 h-10 text-destructive hover:bg-destructive/10 rounded transition"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
