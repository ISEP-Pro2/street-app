// Technique options per skill
export const TECHNIQUES: Record<string, string[]> = {
  planche: ['lean', 'tuck', 'adv_tuck', 'straddle', 'full', 'maltese'],
  front: ['tuck', 'adv_tuck', 'full'],
};

// Movement options per skill
export const MOVEMENTS: Record<string, string[]> = {
  planche: ['hold', 'press', 'pushup', 'negative', 'combo'],
  front: ['hold', 'press', 'pullup', 'negative', 'combo'],
};

// Movements that require duration (seconds)
export const DURATION_MOVEMENTS = ['hold', 'negative'];

// Movements that require reps
export const REP_MOVEMENTS = ['press', 'pushup', 'pullup'];

// Assistance types
export const ASSISTANCE_TYPES = ['none', 'band_5', 'band_15', 'band_25'];

// Form quality options
export const FORM_QUALITIES = ['clean', 'ok', 'ugly'];

// Pain tags
export const PAIN_TAGS = ['wrist', 'elbow', 'shoulder', 'scap'];

// Primary focus options
export const PRIMARY_FOCUS_OPTIONS = ['planche_first', 'front_first', 'balanced'];

// Display labels
export const SKILL_LABELS: Record<string, string> = {
  planche: 'Planche',
  front: 'Front Lever',
};

export const TECHNIQUE_LABELS: Record<string, string> = {
  lean: 'Lean',
  tuck: 'Tuck',
  adv_tuck: 'Adv Tuck',
  straddle: 'Straddle',
  full: 'Full',
  maltese: 'Maltese',
};

export const MOVEMENT_LABELS: Record<string, string> = {
  hold: 'Hold',
  press: 'Press',
  pushup: 'Push-up',
  pullup: 'Pull-up',
  negative: 'Negative',
  combo: 'Combo',
};

export const ASSISTANCE_LABELS: Record<string, string> = {
  none: 'No Band',
  band_5: 'Band 5kg',
  band_15: 'Band 15kg',
  band_25: 'Band 25kg',
};

export const FORM_QUALITY_LABELS: Record<string, string> = {
  clean: 'Clean',
  ok: 'OK',
  ugly: 'Ugly',
};

export const PAIN_TAG_LABELS: Record<string, string> = {
  wrist: 'Wrist',
  elbow: 'Elbow',
  shoulder: 'Shoulder',
  scap: 'Scapula',
};

export const PRIMARY_FOCUS_LABELS: Record<string, string> = {
  planche_first: 'Planche First',
  front_first: 'Front First',
  balanced: 'Balanced',
};
