'use client';

import { useRouter } from 'next/navigation';
import { ComboMode } from '@/components/combo/combo-mode';

export default function ComboNewPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <ComboMode 
        onCancel={() => router.back()}
        onSave={() => {
          // Will be navigated by ComboMode component
        }}
      />
    </div>
  );
}
