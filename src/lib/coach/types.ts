export interface CoachContext {
  last_7d: {
    global_load: number;
    planche_load: number;
    front_load: number;
    hard_sets: number;
    pain_flags_count: number;
  };
  last_28d: {
    load_trend: number[];
    kpi_trend: number[];
  };
  kpis: {
    planche_hold_best: number;
    planche_press_best: number;
    front_hold_best: number;
    front_pullup_best: number;
  };
  last_session: {
    status: 'done' | 'skipped' | 'planned' | null;
    date: string | null;
  };
  exposure: {
    last_session: {
      raw_hold_seconds: number;
      etp_seconds: number;
      by_skill: {
        planche: number;
        front: number;
      };
    };
    last_7d: {
      raw_hold_seconds: number;
      etp_seconds: number;
      by_skill: {
        planche: number;
        front: number;
      };
    };
    trend_7d_vs_14d: {
      etp_change_percent: number;
    };
  };
}

export interface CoachSettings {
  focus_ratio_planche: number;
  focus_ratio_front: number;
  weekly_cap_increase: number;
}

export interface GeneratedPlan {
  verdict: 'push' | 'maintain' | 'deload';
  summary: {
    why: string;
    targets: {
      weekly_cap_increase: number;
      focus_ratio_planche: number;
      focus_ratio_front: number;
    };
    signals: {
      weekly_load_change: number;
      pain_flags: ('none' | 'wrist' | 'elbow' | 'shoulder' | 'scapula')[];
      hard_sets_week: number;
    };
  };
  clipboard_text: string;
  plan: {
    blocks: Array<{
      name: string;
      items: Array<{
        type: 'set' | 'combo';
        set: {
          skill: 'planche' | 'front';
          technique: string;
          movement: 'hold' | 'press' | 'negative' | 'pushup' | 'pullup';
          assistance_kg: 0 | 5 | 15 | 25;
          target_rpe: number;
          sets: number;
          seconds: number | null;
          reps: number | null;
        } | null;
        combo: {
          assistance_global_kg: 0 | 5 | 15 | 25;
          target_rpe: number;
          items: Array<{
            skill: 'planche' | 'front';
            technique: string;
            movement: 'hold' | 'press' | 'negative' | 'pushup' | 'pullup';
            seconds: number | null;
            reps: number | null;
          }>;
        } | null;
      }>;
    }>;
    stop_rules: string[];
  };
}
