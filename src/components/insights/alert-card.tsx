import { KPIAlert } from '@/types';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface AlertCardProps {
  alert: KPIAlert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const getBgColor = () => {
    switch (alert.level) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-l-red-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-l-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-l-blue-500';
    }
  };

  const getIcon = () => {
    switch (alert.level) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (alert.type) {
      case 'pain':
        return '🛑 Pain Alert';
      case 'fatigue':
        return '⚠️ Fatigue';
      case 'plateau':
        return '📊 Plateau';
      default:
        return 'Alert';
    }
  };

  const getBadgeColor = () => {
    switch (alert.level) {
      case 'critical':
        return 'bg-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`p-4 rounded-lg ${getBgColor()}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{alert.kpi_name}</h4>
            <span className={`text-xs font-medium px-2 py-1 rounded ${getBadgeColor()}`}>
              {getTypeLabel()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{alert.explanation}</p>
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-white bg-opacity-50 rounded p-3 mb-3 text-sm">
        <p className="font-medium text-gray-700 mb-2">Evidence:</p>
        <div className="space-y-1 text-gray-600">
          {alert.evidence.last_14d_best > 0 && (
            <p>
              • Last 14d best: <span className="font-mono">{alert.evidence.last_14d_best}</span>
              {alert.evidence.prev_14d_best > 0 && (
                <> vs prev: <span className="font-mono">{alert.evidence.prev_14d_best}</span></>
              )}
            </p>
          )}
          {alert.evidence.avg_rpe_14d > 0 && (
            <p>
              • Avg RPE (14d): <span className="font-mono">{alert.evidence.avg_rpe_14d}</span>
            </p>
          )}
          {alert.evidence.set_count_14d > 0 && (
            <p>
              • Sets logged: <span className="font-mono">{alert.evidence.set_count_14d}</span>
            </p>
          )}
          {alert.evidence.pain_count_7d && alert.evidence.pain_count_7d > 0 && (
            <p>
              • Pain sets (7d): <span className="font-mono">{alert.evidence.pain_count_7d}</span>
            </p>
          )}
          {alert.evidence.fatigue_indicators && alert.evidence.fatigue_indicators.length > 0 && (
            <p>
              • Indicators: {alert.evidence.fatigue_indicators.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-white bg-opacity-50 rounded p-3">
        <p className="font-medium text-gray-700 mb-2">Recommendation:</p>
        <p className="text-sm text-gray-700">{alert.recommendation}</p>
      </div>
    </div>
  );
}
