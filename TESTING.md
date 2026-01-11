# Street Workout Tracker - Manual Testing Checklist

Complete the following test cases to verify all functionality works correctly.

## Pre-Testing Setup

- [ ] Supabase project is configured (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- [ ] `.env.local` has correct SUPABASE_URL and ANON_KEY
- [ ] `npm run dev` is running on http://localhost:3000
- [ ] Browser is Chrome/Firefox/Safari (recent version)
- [ ] No browser extensions blocking requests

---

## 1. Authentication Tests

### 1.1 Sign Up (New Account)
- [ ] Navigate to http://localhost:3000 - redirects to `/auth/login`
- [ ] Click "Create Account" link
- [ ] Enter valid email (e.g., test@example.com)
- [ ] Enter password (8+ chars)
- [ ] Confirm password matches
- [ ] Click "Create Account"
- [ ] Success message shows
- [ ] Redirected to login page
- [ ] Check Supabase Dashboard → Table Editor → `user_preferences` shows new user row

### 1.2 Sign Up Validation
- [ ] Try creating account with invalid email format → shows error
- [ ] Try mismatched passwords → shows "Passwords do not match" error
- [ ] Try duplicate email → shows error
- [ ] Try empty fields → form prevents submission

### 1.3 Login
- [ ] Go to /auth/login
- [ ] Enter email and password from signup
- [ ] Click "Sign In"
- [ ] Redirected to `/app/log` automatically
- [ ] Header shows logged-in email
- [ ] Bottom nav visible

### 1.4 Login Validation
- [ ] Try invalid email format → shows error
- [ ] Try wrong password → shows error message
- [ ] Try non-existent email → shows error

### 1.5 Logout
- [ ] Click logout button (icon in top-right header)
- [ ] Redirected to `/auth/login`
- [ ] Session cleared

---

## 2. Log Screen Tests (Quick Add)

### 2.1 UI Elements
- [ ] Skill toggle shows "Planche" and "Front Lever"
- [ ] Technique chips change when skill changes
  - Planche: lean, tuck, adv_tuck, straddle, full, maltese
  - Front: tuck, adv_tuck, full
- [ ] Movement chips change when skill changes
  - Planche: hold, press, pushup, negative, combo
  - Front: hold, press, pullup, negative, combo
- [ ] Assistance buttons: none, band_5, band_15, band_25
- [ ] RPE slider works (1-10)
- [ ] Form quality dropdown: clean, ok, ugly
- [ ] Lockout toggle (default ON)
- [ ] Deadstop toggle (default OFF)
- [ ] Pain tag options: none, wrist, elbow, shoulder, scap
- [ ] Notes textarea
- [ ] "Save" button
- [ ] "+Same" button

### 2.2 Conditional Inputs
- [ ] Select "Hold" movement → Duration input appears
- [ ] Select "Negative" movement → Duration input appears
- [ ] Select "Press" movement → Reps input appears
- [ ] Select "Pushup" movement → Reps input appears
- [ ] Select "Pullup" movement → Reps input appears (Front Lever only)
- [ ] Select "Combo" movement → NO duration or reps required
- [ ] Select assistance type (not "none") → custom kg input appears

### 2.3 Timer Functionality
- [ ] For "Hold" movement: Start button appears
- [ ] Click Start → timer counts up
- [ ] Click Stop → timer pauses
- [ ] Duration input field disabled while timer running
- [ ] Click "Reset Timer" → resets to 00:00
- [ ] Timer value populates duration input when saving

### 2.4 Form Submission
- [ ] Fill complete "Hold Planche Tuck" set with duration
- [ ] Click "Save"
- [ ] Form clears
- [ ] Success (no error message)
- [ ] Supabase `sets` table shows new row

### 2.5 Duplicate Function ("+Same")
- [ ] Log a set with all fields filled
- [ ] Click "+Same"
- [ ] Set saves
- [ ] Form clears
- [ ] Values for skill, technique, movement, assistance preserved for next entry
- [ ] RPE, duration, reps reset for next entry

### 2.6 Validation
- [ ] Try saving Hold without duration → shows error
- [ ] Try saving Press without reps → shows error
- [ ] Try saving with RPE = 0 → should prevent (slider min is 1)
- [ ] Form prevents submission while saving (button disabled)

### 2.7 Various Movement Combinations
- [ ] Planche + Tuck + Press + 3 reps + RPE 6 → saves ✓
- [ ] Planche + Full + Hold + 45 seconds + RPE 8 → saves ✓
- [ ] Front + Adv Tuck + Pullup + 8 reps + RPE 9 → saves ✓
- [ ] Front + Full + Hold + 20 seconds + Band 15kg + RPE 7 → saves ✓

---

## 3. Session (Today) Screen Tests

### 3.1 View Today's Sets
- [ ] Go to `/app/session`
- [ ] Page shows "Today's Session"
- [ ] Sets list shows all sets logged today
- [ ] Sets ordered chronologically (earliest first)

### 3.2 Summary Statistics
- [ ] "Total Hold Time" shows sum of all seconds
  - Format: MM:SS (e.g., 02:35)
- [ ] "Total Reps" shows sum of all reps
- [ ] "Hard Sets (RPE≥8)" shows count of sets with RPE >= 8
- [ ] Stats are in cards at top with large font

### 3.3 Set Display
- [ ] Each set shows skill (Planche/Front)
- [ ] Technique displayed
- [ ] Movement displayed
- [ ] Duration or reps shown (appropriate field)
- [ ] RPE shown
- [ ] Form quality shown
- [ ] Added weight shown if applicable
- [ ] Pain tag shown in red if applicable
- [ ] Notes shown in italic if present
- [ ] Lockout/deadstop status shown as badges

### 3.4 Delete Functionality
- [ ] Click delete icon on a set
- [ ] Confirm dialog appears
- [ ] Cancel → set remains
- [ ] Confirm → set deleted
- [ ] Verify deleted in Supabase `sets` table
- [ ] Statistics update

### 3.5 Empty State
- [ ] Sign out
- [ ] Sign in (different account, no sets)
- [ ] Go to Session tab
- [ ] Shows "No sets logged yet today"
- [ ] "Go to Log tab" message displayed

### 3.6 Real-time Updates
- [ ] Log a set from Log screen
- [ ] Switch to Session tab
- [ ] New set appears automatically (within 2 seconds)

---

## 4. History Screen Tests

### 4.1 Sessions List
- [ ] Go to `/app/history`
- [ ] Shows sessions from last 30 days
- [ ] Ordered most recent first
- [ ] Each session shows date (e.g., "Fri, Jan 10")
- [ ] Shows count of sets per session

### 4.2 Expand Session
- [ ] Click a session card
- [ ] Session expands
- [ ] Shows chevron rotated down
- [ ] Sets for that session load
- [ ] Shows movement, technique, skill for each set
- [ ] Shows RPE, duration/reps

### 4.3 Collapse Session
- [ ] Click expanded session again
- [ ] Session collapses
- [ ] Chevron rotates up
- [ ] Set details hidden

### 4.4 Multiple Sessions
- [ ] Create sets on different days
  - Today: 3 sets
  - Yesterday: 2 sets
  - 2 days ago: 4 sets
- [ ] History shows all 3 sessions
- [ ] Each has correct set counts
- [ ] Each expands independently

### 4.5 Empty State
- [ ] New account with no sets
- [ ] History shows "No sessions yet"

---

## 5. Insights Screen Tests (Palier 2)

### 5.1 Navigation to Insights
- [ ] Bottom nav has "Insights" tab (TrendingUp icon)
- [ ] Click Insights tab
- [ ] Navigate to `/app/insights`
- [ ] Page loads successfully
- [ ] Header shows "Street Workout"

### 5.2 KPI Cards Display
- [ ] 4 KPI cards visible: Planche Hold, Planche Dynamic, Front Hold, Front Dynamic
- [ ] Each card shows assistance tabs: None, 5kg, 15kg, 25kg
- [ ] Default tab is "None"
- [ ] Each card shows metrics for Today, 7 days, 28 days

### 5.3 KPI Tab Switching
- [ ] Click "5kg" tab on Planche Hold
- [ ] KPI card updates to show 5kg-specific metrics
- [ ] Click "15kg" tab
- [ ] Metrics update correctly
- [ ] Each tab shows different (or same if no data) values

### 5.4 PR Metrics (Absolute vs Clean)
- [ ] For each timeframe (Today/7d/28d), see two values:
  - Large number = PR Absolute (best regardless of form)
  - Small text below = PR Clean (best with clean form)
- [ ] PR Absolute ≥ PR Clean (always)
- [ ] If PR Clean > PR Absolute, that's a bug (report it)
- [ ] "—" shows when no data for that timeframe

### 5.5 Global Score Chart
- [ ] Bar chart shows last 8 weeks of scores
- [ ] Current week score shows in large text
- [ ] Delta % shows:
  - 🟢 Green + percentage if score increased
  - 🔴 Red - percentage if score decreased
  - Gray if no change
- [ ] Chart axes labeled correctly
- [ ] Bars are proportional to score values

### 5.6 Hard Sets Chart
- [ ] Bar chart shows hard sets (RPE ≥ 8) per week
- [ ] Last 8 weeks visible
- [ ] Week labels shown on X-axis
- [ ] Y-axis shows count

### 5.7 Best of Day Charts
- [ ] 4 line charts (one per KPI)
- [ ] Each shows last 30 days
- [ ] X-axis shows dates
- [ ] Y-axis shows best value (seconds or reps)
- [ ] One point per day (best of that day, not all sets)
- [ ] Line shows trend direction

### 5.8 Data Accuracy
- [ ] Log a few sets: e.g., Planche hold 20s (None), 25s (None), 15s (None)
- [ ] Go to Insights
- [ ] Planche Hold KPI "Today" shows 25 (the max)
- [ ] Wait 1 minute, log another: 22s
- [ ] Refresh Insights
- [ ] Still shows 25 (max is preserved)

### 5.9 With Form Quality
- [ ] Log 20s Planche hold with form_quality='ok'
- [ ] Log 18s Planche hold with form_quality='clean'
- [ ] Go to Insights
- [ ] PR Absolute = 20 (max all)
- [ ] PR Clean = 18 (max clean only)

### 5.10 Empty State
- [ ] New account with 0 sets logged
- [ ] Go to Insights
- [ ] KPI cards show "—" (no data)
- [ ] Charts show empty grid
- [ ] No crashes or errors

### 5.11 Load Time
- [ ] Navigate to Insights
- [ ] Page loads within 3 seconds (typical < 1s)
- [ ] No spinner/loading state that hangs indefinitely

### 5.12 Mobile View
- [ ] On mobile (or DevTools with mobile viewport):
- [ ] KPI cards stack vertically (1 column)
- [ ] Charts responsive and readable
- [ ] Bottom nav items fit on screen (may be smaller text)
- [ ] Tap tabs work smoothly

### 5.13 Security
- [ ] User A logs into account, views Insights
- [ ] User B's data not visible anywhere
- [ ] Only own sets counted in KPIs
- [ ] Global Score based only on own sets

---

## 5.14 Palier 3 - Training Warnings

### 5.14.1 Warnings Display
- [ ] Scroll down on Insights page
- [ ] See "Training Warnings" section (if warnings exist)
- [ ] See "This Week Summary" section with 4 metric cards
- [ ] Cards show: Global Score, Hard Sets, Planche Load, Front Load
- [ ] Each card displays value and delta % (↑↓→)

### 5.14.2 Warning Card Styling
- [ ] Red warning has red left border
- [ ] Orange warning has orange left border
- [ ] Each warning shows:
  - Title (e.g., "Hard sets overload")
  - Description message
  - Threshold value
  - Your current value
  - Recommendation

### 5.14.3 Rapid Ramp Warning (Orange)
- [ ] Log sets for 3 weeks to build baseline
  - Week 1: 7,500 pts global score
  - Week 2: 7,300 pts
  - Week 3: 7,200 pts
  - Average: 7,333 pts
- [ ] In week 4, log sets for total ≥ 9,200 pts (> 7,333 × 1.25)
- [ ] Refresh Insights
- [ ] Orange "Rapid Ramp" warning appears
- [ ] Threshold shows 9,166 pts
- [ ] Current shows > 9,200

### 5.14.4 Hard Overload Warning (Red)
- [ ] Build baseline: 3 weeks with avg 5 hard sets
  - Week 1: 5 sets with RPE ≥ 8
  - Week 2: 4 sets
  - Week 3: 6 sets
- [ ] In week 4, log ≥ 7 sets with RPE ≥ 8 (> 5 × 1.3)
- [ ] Refresh Insights
- [ ] Red "Hard sets overload" warning appears
- [ ] Threshold shows 6.5 sets
- [ ] Current shows ≥ 7

### 5.14.5 Too Many Max Efforts Warning (Orange)
- [ ] Log 15 total sets in a week
- [ ] Log 7+ with RPE ≥ 8 (hard ratio > 45%)
- [ ] Refresh Insights
- [ ] Orange "Too many max efforts" warning appears
- [ ] Hard Ratio shows > 45%
- [ ] Threshold shows 45%

### 5.14.6 Multiple Warnings
- [ ] Trigger all 3 warnings simultaneously
- [ ] All 3 appear in Warnings section
- [ ] Each properly styled and explained
- [ ] Order: Red warnings first, then orange

### 5.14.7 No Warnings State
- [ ] Have normal training week (safe levels)
- [ ] No warnings section appears
- [ ] Only "This Week Summary" visible
- [ ] No errors in console

### 5.14.8 Weekly Metrics Accuracy

#### Global Score Calculation
- [ ] Log: 20s planche hold (no assist, BW 75kg)
  - Score = 20 × 75 = 1,500
- [ ] Log: 5 reps planche press (15kg band, BW 75kg)
  - Score = 5 × (75 - 15) = 300
- [ ] Go to Insights, week view
- [ ] This Week Global Score ≥ 1,800 ✓

#### Hard Sets Counting
- [ ] Log set with RPE 7 → hard_sets not incremented
- [ ] Log set with RPE 8 → hard_sets incremented
- [ ] Log set with RPE 9 → hard_sets incremented
- [ ] Hard Sets count matches manually calculated count ✓

#### Hold Seconds Aggregation
- [ ] Log: 20s planche hold
- [ ] Log: 15s planche hold
- [ ] Log: 12s front hold
- [ ] Planche Load shows: 35s holds
- [ ] Front Load shows: 12s holds

#### Dynamic Reps Aggregation
- [ ] Log: 5 planche press reps
- [ ] Log: 8 planche press reps
- [ ] Log: 6 front press reps
- [ ] Planche Load shows: 13 reps
- [ ] Front Load shows: 6 reps

### 5.14.9 Delta Calculation
- [ ] Previous 3 weeks avg Global Score: 7,500
- [ ] This week: 7,650
- [ ] Delta shows: +2% (green ↑)
- [ ] Previous 3 weeks avg: 7,500
- [ ] This week: 7,350
- [ ] Delta shows: -2% (red ↓)
- [ ] Previous 3 weeks avg: 7,500
- [ ] This week: 7,500
- [ ] Delta shows: 0% (gray →)

### 5.14.10 Hard Ratio Percentage
- [ ] 12 total sets, 4 hard sets → shows 33%
- [ ] 10 total sets, 5 hard sets → shows 50%
- [ ] 8 total sets, 2 hard sets → shows 25%
- [ ] Ratio always between 0-100%

### 5.14.11 Mobile Responsive
- [ ] On mobile view
- [ ] Metric cards stack vertically (1 column on small, 2 on medium)
- [ ] Warning cards readable
- [ ] Values and deltas not truncated
- [ ] Threshold explanations visible (may be collapsed/expanded)

### 5.14.12 Edge Cases

#### Partial Week
- [ ] Early in the week (Monday):
- [ ] This Week data shows only Monday's sets
- [ ] Delta compares to full 3-week average (fair)
- [ ] No warnings triggered on incomplete week

#### First 4 Weeks of Account
- [ ] New account, logged sets for only 1 week
- [ ] This Week Summary shows metrics
- [ ] No delta (no previous weeks to compare)
- [ ] Shows "—" or "N/A" for delta

#### No Hard Sets This Week
- [ ] Log only easy sets (RPE ≤ 6)
- [ ] Hard Sets shows 0
- [ ] Hard Ratio shows 0%
- [ ] No "Too many max efforts" warning

#### No Sets This Week
- [ ] This week with 0 logged sets
- [ ] Global Score shows 0
- [ ] All other metrics show 0 or "—"
- [ ] No warnings (no data)

#### Deload Week
- [ ] Week with much lower volume (40% of avg)
- [ ] No rapid ramp warning (volume down)
- [ ] No hard overload warning (fewer hard sets)
- [ ] Delta shows large negative % (red ↓) - expected

### 5.14.13 Warning Thresholds Accuracy

**Scenario: Testing Exact Threshold Boundaries**
- [ ] Set week 1-3 avg Global Score to exactly 10,000
- [ ] This week score = 12,499 (just below threshold)
  - 12,499 / 10,000 = 1.2499 < 1.25
  - No warning ✓
- [ ] This week score = 12,500
  - 12,500 / 10,000 = 1.25 ≥ 1.25
  - Warning triggers ✓

**Scenario: Hard Sets Threshold**
- [ ] Avg hard sets = 5
- [ ] This week hard sets = 6 (just below 6.5)
  - 6 < 5 × 1.3 = 6.5
  - No warning ✓
- [ ] This week hard sets = 7
  - 7 > 5 × 1.3 = 6.5
  - Warning triggers ✓

**Scenario: Hard Ratio Threshold**
- [ ] Total = 20, hard = 8
  - 8/20 = 0.40 < 0.45
  - No warning ✓
- [ ] Total = 20, hard = 9
  - 9/20 = 0.45 ≥ 0.45
  - Warning triggers ✓

### 5.14.14 Data Persistence
- [ ] Log sets, view Insights, warnings appear
- [ ] Refresh browser (F5)
- [ ] Same warnings still present (data persisted)
- [ ] Logout, login again
- [ ] Data still there and warnings recalculated

### 5.14.15 Performance
- [ ] Go to Insights with 500+ sets logged
- [ ] Page loads in < 3 seconds
- [ ] No freezing or lag
- [ ] Warnings calculated and displayed

---

## 6. Settings Screen Tests

### 6.1 Load Preferences
- [ ] Go to `/app/settings`
- [ ] Current bodyweight loaded (default 75)
- [ ] Current primary focus loaded (default balanced)
- [ ] Current sessions target loaded (default 4)
- [ ] Account email displayed

### 6.2 Bodyweight
- [ ] Change bodyweight to 80
- [ ] Click "Save Settings"
- [ ] Success message
- [ ] Refresh page
- [ ] Bodyweight still 80
- [ ] Verify in Supabase `user_preferences` table

### 5.3 Primary Focus
- [ ] Change to "Planche First"
- [ ] Save
- [ ] Change to "Front First"
- [ ] Save
- [ ] Change to "Balanced"
- [ ] Save
- [ ] Persists across refresh

### 5.4 Sessions Target
- [ ] Drag slider from 3 → 6
- [ ] Shows current value (e.g., "Sessions per Week Target: 5")
- [ ] Save
- [ ] Persists across refresh

### 5.5 Account Info
- [ ] Email shown correctly
- [ ] Join date shown in format (e.g., "1/11/2026")

---

## 6. Navigation Tests

### 6.1 Bottom Navigation
- [ ] Bottom nav always visible (fixed)
- [ ] Has 4 items: Log, Session, History, Settings
- [ ] Current tab highlighted (primary color + border-top)
- [ ] Can click between tabs

### 6.2 Navigation Flow
- [ ] Log → Session → History → Settings → Log (cycle works)
- [ ] Page content changes correctly
- [ ] URL updates correctly (`/app/log`, `/app/session`, etc.)

### 6.3 Header
- [ ] Header always at top
- [ ] Shows "Street Workout"
- [ ] Shows logged-in email (truncated if long)
- [ ] Logout button accessible

---

## 7. Mobile Responsiveness Tests

Test on actual mobile device or use browser DevTools (F12 → Device Toolbar)

### 7.1 iPhone 13/14/15 (390px width)
- [ ] All content readable
- [ ] Bottom nav not overlapping content
- [ ] Form inputs full-width and easy to tap
- [ ] Chips/buttons properly spaced (no overlap)
- [ ] Timer display clear and large

### 7.2 iPad (768px width)
- [ ] Layout still works
- [ ] Content centered
- [ ] Buttons sized for touch (min 44px)

### 7.3 Landscape Orientation
- [ ] Content adjusts properly
- [ ] No horizontal scrollbar
- [ ] Bottom nav still accessible

---

## 8. Data Persistence Tests

### 8.1 Refresh Page
- [ ] Log a set
- [ ] Refresh page (F5)
- [ ] Still logged in
- [ ] Set still visible in Session view

### 8.2 Close & Reopen Browser
- [ ] Close browser completely
- [ ] Reopen app
- [ ] Should be redirected to login if session expired
- [ ] Or automatically logged in if recent

### 8.3 Multiple Devices
- [ ] Log set on Device A
- [ ] Check Device B
- [ ] Set appears immediately (within 2 sec)

---

## 9. Error Handling Tests

### 9.1 Network Errors
- [ ] Open DevTools Network tab
- [ ] Throttle to "Offline"
- [ ] Try to save a set
- [ ] Shows error message
- [ ] Restore connection
- [ ] Try again → works

### 9.2 Database Errors
- [ ] (Requires Supabase collaboration)
- [ ] Simulate database error
- [ ] App shows error message
- [ ] User can retry

---

## 10. Edge Cases

### 10.1 Large Values
- [ ] Log 300 seconds duration → displays "05:00"
- [ ] Log 50 reps → displays correctly
- [ ] Log 150 kg added weight → displays correctly

### 10.2 Long Text
- [ ] Enter very long notes
- [ ] Form submits
- [ ] Notes display correctly in Session/History
- [ ] Text wraps properly (no overflow)

### 10.3 Special Characters
- [ ] Notes with emoji: "🔥 Great workout!" → saves & displays
- [ ] Notes with unicode characters → saves correctly

---

## 11. Performance Tests

### 11.1 Form Responsiveness
- [ ] Fill form quickly (all fields in <5 seconds)
- [ ] No lag or freezing
- [ ] Buttons respond immediately

### 11.2 List Performance
- [ ] Log 20+ sets
- [ ] Session view still smooth
- [ ] Scrolling is smooth (60fps)

### 11.3 Startup Time
- [ ] Cold start (clear cache) → < 3 seconds to login page
- [ ] After login → < 2 seconds to log page

---

## 12. Browser Compatibility

Test on multiple browsers:

### Chrome/Edge (Latest)
- [ ] All features work
- [ ] No console errors

### Firefox (Latest)
- [ ] All features work
- [ ] No console errors

### Safari (Latest)
- [ ] All features work
- [ ] No console errors

### Mobile Safari (iPhone)
- [ ] Can install as PWA
- [ ] Works when offline (basic)

---

## 13. Accessibility Tests

### 13.1 Keyboard Navigation
- [ ] Tab through form fields
- [ ] Can reach all buttons with Tab
- [ ] Enter key submits forms
- [ ] Can navigate tabs with Tab/Shift+Tab

### 13.2 Screen Reader
- [ ] Labels associated with inputs
- [ ] Button purposes clear
- [ ] Form sections labeled

---

## Test Results Summary

| Category | Status | Notes |
|----------|--------|-------|
| Authentication | ✓/✗ | |
| Log Screen | ✓/✗ | |
| Session Screen | ✓/✗ | |
| History Screen | ✓/✗ | |
| Insights Screen | ✓/✗ | |
| Settings Screen | ✓/✗ | |
| Navigation | ✓/✗ | |
| Mobile | ✓/✗ | |
| Data Persistence | ✓/✗ | |
| Error Handling | ✓/✗ | |
| Edge Cases | ✓/✗ | |
| Performance | ✓/✗ | |
| Browser Compat | ✓/✗ | |
| Accessibility | ✓/✗ | |

---

## Known Limitations (Out of Scope - Palier 3+)

- [ ] No customizable KPI definitions (Palier 3)
- [ ] No per-KPI assistance level selection in charts (Palier 2+)
- [ ] No plateau detection (Palier 4)
- [ ] No auto-generated training plans (Palier 5)
- [ ] No CSV export (Palier 3)
- [ ] No sharing/social features (Future)
- [ ] No offline data sync (works offline but doesn't queue actions)

---

**Final Sign-Off**: _____________________________ Date: __________

All tests passed ✅ / Issues found ⚠️ (document above)
