import { ProtectedRoute } from '@/lib/auth/protected-route';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getGlobalScoreData,
  getHardSetsPerWeek,
  getWeeklyTrainingMetrics,
  getSkillLoadByWeek,
} from '@/lib/supabase/insights';
import { getUserLastNWeeksExposure } from '@/lib/supabase/exposure';
import { aggregateByWeek } from '@/lib/exposure';
import { GlobalScoreChart } from '@/components/insights/global-score-chart';
import { TrainingStatusCard } from '@/components/insights/training-status-card';
import { SkillContributionChart } from '@/components/insights/skill-contribution-chart';
import { SkillLoadTrend } from '@/components/insights/skill-load-trend';
import { SkillDrillDown } from '@/components/insights/skill-drill-down';
import { ExposureChart, SkillETPChart } from '@/components/insights/exposure-chart';
import { CoachPlanViewer } from '@/components/coach/coach-plan-viewer';

export const metadata = {
  title: 'Insights - Street Workout',
};

export const dynamic = 'force-dynamic';

async function InsightsPageContent() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch data in parallel
  const [globalScoreData, hardSetsData, trainingStats, skillLoadData, exposureEntries] = await Promise.all([
    getGlobalScoreData(user.id),
    getHardSetsPerWeek(user.id),
    getWeeklyTrainingMetrics(user.id),
    getSkillLoadByWeek(user.id),
    getUserLastNWeeksExposure(user.id, 8),
  ]);

  // Calculate exposure by week
  const weeklyExposure = aggregateByWeek(exposureEntries);

  // Calculate training status
  const currentWeekScore = globalScoreData[globalScoreData.length - 1]?.score || 0;
  const previousWeekScore = globalScoreData[globalScoreData.length - 2]?.score || currentWeekScore;
  const scoreChange = previousWeekScore > 0 ? ((currentWeekScore - previousWeekScore) / previousWeekScore) * 100 : 0;

  // Calculate skill contribution (based on sets count as proxy)
  const currentWeek = trainingStats.currentWeek;
  const planscheHoldLoad = currentWeek?.hold_seconds_planche || 0;
  const planscheDynamicLoad = currentWeek?.dynamic_reps_planche || 0;
  const frontHoldLoad = currentWeek?.hold_seconds_front || 0;
  const frontDynamicLoad = currentWeek?.dynamic_reps_front || 0;

  const planscheTotal = planscheHoldLoad + planscheDynamicLoad;
  const frontTotal = frontHoldLoad + frontDynamicLoad;
  const totalLoad = planscheTotal + frontTotal;
  const planschePercent = totalLoad > 0 ? (planscheTotal / totalLoad) * 100 : 50;
  const frontPercent = totalLoad > 0 ? (frontTotal / totalLoad) * 100 : 50;

  return (
    <div className="pb-20 px-4 pt-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold">Insights</h1>
        </div>

        {/* 1. TRAINING STATUS (Top Priority) */}
        <TrainingStatusCard
          currentScore={currentWeekScore}
          scoreChange={scoreChange}
          hardSets={trainingStats.currentWeek?.hard_sets || 0}
          rampPercentage={trainingStats.rampPercentage}
        />

        {/* 1.5 DAILY COACH PLAN */}
        <CoachPlanViewer />

        {/* 2. GLOBAL LOAD TREND (Central Element) */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Global Load Trend</h2>
          <GlobalScoreChart
            data={globalScoreData}
            currentWeekScore={currentWeekScore}
            previousWeekScore={previousWeekScore}
          />
        </div>

        {/* 3. SKILL CONTRIBUTION (Breakdown) */}
        <SkillContributionChart
          planschePercent={planschePercent}
          frontPercent={frontPercent}
        />

        {/* 3.5 SKILL LOAD TREND (Weekly Evolution) */}
        <SkillLoadTrend data={skillLoadData} />

        {/* 3.75 EXPOSURE TRACKING (ETP = Effective Technical Exposure) */}
        {weeklyExposure.length > 0 && (
          <>
            <ExposureChart weeklyData={weeklyExposure} />
            <SkillETPChart weeklyData={weeklyExposure} />
          </>
        )}

        {/* 4. SKILL DRILL-DOWN (Voluntary Analysis) */}
        <SkillDrillDown
          trainingStats={trainingStats}
          user={user}
        />
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <ProtectedRoute>
      <InsightsPageContent />
    </ProtectedRoute>
  );
}
