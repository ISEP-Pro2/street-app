import { ProtectedRoute } from '@/lib/auth/protected-route';
import { SettingsView } from '@/components/settings/settings-view';

export const metadata = {
  title: 'Settings - Street Workout',
};

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsView />
    </ProtectedRoute>
  );
}
