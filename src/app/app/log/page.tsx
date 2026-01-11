import { ProtectedRoute } from '@/lib/auth/protected-route';
import { LogForm } from '@/components/log/log-form';

export const metadata = {
  title: 'Log - Street Workout',
  description: 'Log a new set',
};

export const dynamic = 'force-dynamic';

export default function LogPage() {
  return (
    <ProtectedRoute>
      <main className="max-w-2xl mx-auto px-4 pt-4">
        <h1 className="text-2xl font-bold mb-4">Quick Add</h1>
        <LogForm />
      </main>
    </ProtectedRoute>
  );
}
