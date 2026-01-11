import { UserAlertSummary } from '@/types';
import { AlertCard } from './alert-card';

interface AlertSummaryProps {
  summary: UserAlertSummary;
}

export function AlertSummary({ summary }: AlertSummaryProps) {
  if (summary.total_alerts === 0) {
    return (
      <div className="bg-green-50 border-l-4 border-l-green-500 p-4 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2">✅ All Clear!</h3>
        <p className="text-sm text-green-700">
          No pain, fatigue, or plateau detected. Your training is on track!
        </p>
        <p className="text-xs text-green-600 mt-2">
          Keep logging consistently and you'll get personalized alerts here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Alerts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total_alerts}</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Critical</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{summary.critical_alerts}</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Warnings</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{summary.warning_alerts}</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">By Type</p>
          <div className="flex gap-2 mt-2 text-xs font-medium">
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
              Pain {summary.by_type.pain}
            </span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
              Fatigue {summary.by_type.fatigue}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
              Plateau {summary.by_type.plateau}
            </span>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-lg">Active Alerts</h3>
        {summary.alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      {/* Guidance */}
      {summary.critical_alerts > 0 && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <p className="text-sm font-medium text-red-900">⚠️ Critical Alerts Detected</p>
          <p className="text-xs text-red-800 mt-2">
            You have {summary.critical_alerts} critical alert(s). Follow the recommendations immediately to avoid injury.
          </p>
        </div>
      )}

      {summary.warning_alerts > 0 && summary.critical_alerts === 0 && (
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900">⚠️ Training Adjustments Needed</p>
          <p className="text-xs text-yellow-800 mt-2">
            You have {summary.warning_alerts} plateau alert(s). Consider switching stimulus or adding recovery.
          </p>
        </div>
      )}
    </div>
  );
}
