import { ProtectedRoute } from '@/lib/auth/protected-route';
import { HistoryView } from '@/components/history/history-view';

export const metadata = {
  title: 'History - Street Workout',
};

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryView />
    </ProtectedRoute>
  );
}
