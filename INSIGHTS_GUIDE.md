# 📊 Insights Feature Guide (Palier 2)

## Quick Start

### View Your Insights
1. Open the app and log in
2. Click **Insights** in the bottom navigation (TrendingUp icon)
3. See your KPIs, scores, and charts

### Understanding Your Data

#### KPI Cards (Top)
Shows your best performance for 4 key metrics:

**Planche — Hold**  
Score: Seconds held at full planche, no movement

**Planche — Dynamic**  
Score: Reps of planche press (full technique)

**Front — Hold**  
Score: Seconds held at full front lever

**Front — Dynamic**  
Score: Reps of front lever pullup (advanced tuck)

Each card shows:
- **Best Today** — Best performance today
- **Best 7 days** — Best this week
- **Best 28 days** — Best this month

**Two metrics for each:**
- **Large number** = PR Absolute (best regardless of form)
- **Small text** = PR Clean (best with proper form)

🎯 If they match, you're executing cleanly!

#### Assistance Tabs
Switch between weight assistance levels:
- **None** — No band assistance
- **5kg** — 5kg resistance band
- **15kg** — 15kg resistance band
- **25kg** — 25kg resistance band

This helps you see progress on different variations.

#### Global Score
**What it measures**: Total training volume weighted by your bodyweight

**Formula**:
- Your bodyweight - band assistance + any added weight = effective load
- Then: seconds (holds) OR reps (dynamics) × effective load = score per set
- Sum all sets per week = weekly score

**Example**:
- You: 75kg, no band
- Set 1: 20 second hold → 20 × 75 = 1,500 points
- Set 2: 8 reps with 15kg band → 8 × (75-15) = 480 points
- Total (if only 2 sets that week): 1,980 points

**Green arrow** ↗️ = Score increased (you did more volume)  
**Red arrow** ↘️ = Score decreased (less volume this week)  
**% number** = Percent change from last week

#### Hard Sets Chart
Shows how many "hard" sets you did per week (RPE ≥ 8)

- Typical: 4-8 hard sets per week
- Too high: Risk of overtraining
- Too low: May not trigger adaptation

#### Best Performance Charts
Line graphs showing your **best of each day** for 30 days

- One dot per day (not all sets)
- Shows upward trends or plateaus
- Helps identify when you had good days vs hard days

---

## 🔍 Data Accuracy

### KPI Metrics Are Based On:
✅ Sets logged in the Log tab  
✅ Specific skill, technique, movement  
✅ Form quality (for PR Clean)  
✅ Assistance level selected  

### Global Score Uses:
✅ Your bodyweight (from Settings)  
✅ Band assistance type  
✅ Any added weight you log  
✅ Seconds or reps based on movement  
✅ ISO week grouping  

### Hard Sets Count:
✅ Only sets with RPE ≥ 8  
✅ Grouped by calendar week  

---

## 💡 Tips & Tricks

### Track Progress
Log sets consistently so you can:
- See PR trends
- Monitor volume (Global Score)
- Identify your strengths/weaknesses

### Form Quality Matters
- Log with `form_quality='clean'` when executing perfectly
- Compare "PR Absolute" vs "PR Clean" to see form consistency
- If they're the same, you're being honest! 👏

### Assistance Progression
- Start with higher assistance (25kg)
- Move down as you get stronger (15kg → 5kg → None)
- Track each level independently using tabs

### Weekly Targets
- Aim for **4-8 hard sets** per week
- Build volume gradually (Global Score trend)
- Don't spike too fast (overtraining risk)

---

## ❓ FAQ

**Q: Why is my PR Absolute > PR Clean?**  
A: You've done harder reps/holds but with sloppy form. Compare to see where you need form work.

**Q: Why are all my KPIs "—" (no data)?**  
A: You haven't logged sets matching that KPI yet. Log a Planche Full Hold to see Planche Hold KPI.

**Q: Can I change my bodyweight?**  
A: Yes! Go to Settings tab, update bodyweight, save. Global Score will recalculate.

**Q: Why is the Global Score so different between weeks?**  
A: Could be due to:
- More/fewer sets logged
- Higher/lower difficulty (more/less assistance)
- Different rep/second counts
- Different bodyweight logged

**Q: Can I delete or edit data?**  
A: Not in Insights (read-only). Go to History tab to delete sets, then Insights updates automatically.

---

## 📱 Mobile Tips

- Scroll down to see all 4 KPI cards
- Swipe left/right to navigate tabs
- Charts are interactive (tap points for values)
- Portrait view: KPI cards stack vertically
- Landscape view: Cards side-by-side

---

## 🐛 Troubleshooting

**Charts not loading?**  
→ Refresh page (F5)  
→ Check browser console for errors (F12)

**Numbers look wrong?**  
→ Verify you logged sets for that KPI  
→ Check your bodyweight in Settings  
→ Ensure form_quality is set correctly

**Page is slow?**  
→ It should load < 1 second  
→ If not, check your internet connection  
→ Try refreshing the page

---

## 📞 Need Help?

See the full documentation:
- [INSIGHTS.md](../INSIGHTS.md) — Technical details
- [TESTING.md](../TESTING.md) — Test cases & procedures
- [QUICKSTART.md](../QUICKSTART.md) — Getting started

---

**Happy training!** 💪

Your progress is your best motivation.
