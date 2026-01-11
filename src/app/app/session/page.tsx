import { ProtectedRoute } from '@/lib/auth/protected-route';
import { SessionView } from '@/components/session/session-view';

export const metadata = {
  title: 'Session - Street Workout',
};

export const dynamic = 'force-dynamic';

export default function SessionPage() {
  return (
    <ProtectedRoute>
      <SessionView />
    </ProtectedRoute>
  );
}
