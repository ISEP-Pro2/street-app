# 🚀 Quick Palier 3 Overview

## What Is Palier 3?

**Palier 3** adds **training load monitoring** to catch overtraining before it happens.

After you log your sets, the app automatically:
1. ✅ Calculates your weekly volume metrics
2. ✅ Compares to your last 3 weeks
3. ✅ Detects if you're ramping volume too fast
4. ✅ Warns if you're doing too many hard sets
5. ✅ Shows if your intensity is unbalanced

---

## New Features

### 📊 Weekly Metrics

Every week shows:
- **Total sets** - How many sets you logged
- **Hard sets** - Sets at RPE ≥ 8
- **Hold seconds** - Planche vs Front breakdown
- **Dynamic reps** - Planche vs Front breakdown
- **Global score** - Weighted by your bodyweight
- **Hard ratio** - % of sets that were hard

### ⚠️ Three Smart Warnings

1. **Rapid Ramp** 🟠
   - Volume jumped 25%+ vs last 3 weeks
   - Means: Too much increase too fast
   - Action: Dial back or take easy week

2. **Hard Overload** 🔴
   - Hard sets jumped 30%+ vs last 3 weeks
   - Means: Too many max efforts
   - Action: Reduce hard sets, add recovery

3. **Too Many Max Efforts** 🟠
   - More than 45% of your sets are hard
   - Means: Unsustainable intensity
   - Action: Add easier RPE 5-7 sessions

### 💡 Smart Cards

"This Week Summary" shows your metrics at a glance:
- Global Score (with weekly change %)
- Hard Sets (with trend arrow)
- Planche Load (seconds + reps)
- Front Load (seconds + reps)

---

## How It Works

```
You log sets
    ↓
Every day, metrics update
    ↓
Each week, warnings calculated
    ↓
You see: "Rapid ramp! Dial back"
    ↓
You adjust training
    ↓
Next week: no warning
```

---

## Examples

### Safe Week ✅
- 3-week avg: 7,500 pts
- This week: 7,650 pts (+2%)
- Hard ratio: 35%
- **Result**: No warnings, you're good

### Ramping Too Fast ⚠️
- 3-week avg: 7,500 pts
- This week: 9,500 pts (+27%)
- Threshold: 9,375 pts (7,500 × 1.25)
- **Result**: 🟠 Rapid Ramp warning

### Too Many Hard Sets 🔴
- 3-week avg: 5 hard sets
- This week: 7 hard sets (+40%)
- Threshold: 6.5 sets (5 × 1.3)
- **Result**: 🔴 Hard Overload warning

### Unbalanced Intensity 🟠
- Total sets: 20
- Hard sets: 10
- Hard ratio: 50%
- Threshold: 45%
- **Result**: 🟠 Too Many Max Efforts warning

---

## Integration with Palier 2

| Feature | Palier 2 | Palier 3 |
|---------|----------|---------|
| Best-of-day KPIs | ✅ | (shows performance) |
| Global score tracking | ✅ | ✅ (watches for spikes) |
| Weekly charts | ✅ | (shows trends) |
| Training warnings | ❌ | ✅ **NEW** |
| Hard set counting | ✅ | ✅ (used for warnings) |
| Recovery guidance | ❌ | ✅ **NEW** |

---

## Documentation

### For Users
📖 **[PALIER_3.md](./PALIER_3.md)**
- Complete user guide
- Real training examples
- How to interpret warnings
- Best practices

### For Developers
🔧 **[PALIER_3_REFERENCE.md](./PALIER_3_REFERENCE.md)**
- Technical architecture
- Function reference
- Database queries
- Testing guide

### Test Coverage
✅ **40+ test cases in [TESTING.md](./TESTING.md#514-palier-3---training-warnings)**
- All warning scenarios
- Edge cases
- Mobile responsiveness
- Performance checks

---

## Getting Started

### Just Works Out of the Box
1. Go to `/app/insights`
2. Scroll down
3. See "Training Warnings" (if warnings exist)
4. See "This Week Summary" with your metrics

### No Setup Required
- No database migrations
- No new settings
- Uses existing data
- Works immediately

---

## FAQ

**Q: Why did I get a warning when I feel fine?**  
A: Warnings are conservative. The system catches overtraining early, before you feel it.

**Q: Can I ignore orange warnings?**  
A: Not recommended. Orange often becomes red if you keep the same pace.

**Q: How is Global Score calculated?**  
A: `score = seconds/reps × (bodyweight - band + extra weight)`  
Aggregated per week.

**Q: What's a healthy hard ratio?**  
A: 30-40%. Below 30% = too easy. Above 45% = unsustainable.

**Q: Can I adjust thresholds?**  
A: Currently hardcoded at 25%/30%/45%. Future versions will make it customizable.

**Q: Does this affect my KPI rankings?**  
A: No. Warnings are separate from KPIs.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/insights.ts` | Metrics & warning logic |
| `src/components/insights/warning-card.tsx` | Warning display |
| `src/components/insights/training-metric-card.tsx` | Metric cards |
| `src/app/app/insights/page.tsx` | Insights page |
| `PALIER_3.md` | User guide |
| `PALIER_3_REFERENCE.md` | Developer guide |

---

## Next Steps

### Try It Out
1. Log sets over 3-4 weeks
2. Go to Insights
3. Watch warnings appear/disappear based on your training

### Provide Feedback
- Does this help prevent overtraining?
- Are thresholds too strict/loose?
- Want more metrics?

### Future Ideas (Palier 4+)
- Deload week detection
- Injury risk scoring
- Sleep/recovery integration
- Personalized thresholds

---

## Build Status

```
✅ Compiled successfully
✅ TypeScript strict mode
✅ Zero errors
✅ Production ready
```

---

**Palier 3 is live!** 🎉

See [PALIER_3.md](./PALIER_3.md) for complete user guide.
