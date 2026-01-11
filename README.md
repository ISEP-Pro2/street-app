# Street Workout Tracker

Une web app PWA mobile-first pour tracker la progression en **planche** et **front lever**, construite avec Next.js, TypeScript, Tailwind CSS et Supabase.

## 🚀 Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Mobile**: PWA-ready (manifest.json)

## 📋 Fonctionnalités (Palier 0-1)

### ✅ Auth
- Email/password authentication via Supabase
- Sign up & sign in pages
- Persistent session management
- Logout button in header

### ✅ Navigation Mobile
- Bottom tab navigation (Log, Session, History, Settings)
- Responsive design optimized for mobile
- Active state indicators

### ✅ Log (Quick Add)
- **Skill toggle**: Planche / Front Lever
- **Technique chips**: 
  - Planche: Lean, Tuck, Adv Tuck, Straddle, Full, Maltese
  - Front: Tuck, Adv Tuck, Full
- **Movement chips**:
  - Planche: Hold, Press, Push-up, Negative, Combo
  - Front: Hold, Press, Pull-up, Negative, Combo
- **Assistance chips**: No Band, Band 5kg, Band 15kg, Band 25kg
- **Duration input** (Timer or manual seconds)
- **Reps input** (for dynamic movements)
- **RPE slider** (1-10)
- **Form Quality select**: Clean, OK, Ugly
- **Lockout toggle** (default true)
- **Deadstop toggle** (default false)
- **Pain tag quick select**: Wrist, Elbow, Shoulder, Scapula
- **Notes** (optional)
- **Save & +Same Again** buttons

### ✅ Session (Today)
- Display today's sets with timestamps
- Totals:
  - Total hold time (seconds)
  - Total dynamic reps
  - Hard sets count (RPE ≥ 8)
- Edit/delete per set
- Real-time updates

### ✅ History (Last 30 Days)
- List sessions by date
- Expandable session details
- Lazy load set details on expand

### ✅ Settings
- Bodyweight (kg) - default 75
- Primary focus (Planche First, Front First, Balanced)
- Sessions per week target (3-6)
- Account info display (email, member since)
- Save preferences button

## 🗄️ Base de données

### Tables

#### `sessions`
```sql
id (uuid, pk)
user_id (uuid, fk → auth.users)
session_date (date)
notes (text, nullable)
created_at (timestamptz)
```

#### `sets`
```sql
id (uuid, pk)
user_id (uuid, fk → auth.users)
session_id (uuid, fk → sessions, cascade delete)
performed_at (timestamptz)
skill (text: 'planche' | 'front')
technique (text)
movement (text)
assistance_type (text: 'none' | 'band_5' | 'band_15' | 'band_25')
assistance_kg (numeric, nullable)
added_weight_kg (numeric, nullable)
seconds (numeric, nullable)
reps (int, nullable)
rpe (int, 1-10)
form_quality (text: 'clean' | 'ok' | 'ugly')
lockout (boolean, default true)
deadstop (boolean, default false)
pain_tag (text: 'wrist' | 'elbow' | 'shoulder' | 'scap', nullable)
notes (text, nullable)
created_at (timestamptz)
```

#### `user_preferences`
```sql
user_id (uuid, pk, fk → auth.users)
bodyweight_kg (numeric, default 75)
primary_focus (text: 'planche_first' | 'front_first' | 'balanced', default 'balanced')
sessions_per_week_target (int, 3-6, default 4)
created_at (timestamptz)
updated_at (timestamptz)
```

### Row Level Security (RLS)
- Strict policies on all tables
- Users can only view/edit their own data
- Auto-create user_preferences on signup via trigger

## 🛠️ Installation & Setup

### 1. Clone & Install

```bash
cd street-app
npm install
```

### 2. Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Copy your project URL and anon key
4. Create `.env.local` at project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Setup Database

1. Go to Supabase SQL Editor
2. Run the migration script in `supabase/migrations/001_init_schema.sql`
3. Enable Auth in Supabase dashboard (Email provider enabled by default)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start using the app!

## 📁 Project Structure

```
street-app/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── app/               # Protected app routes
│   │   │   ├── log/           # Quick log page
│   │   │   ├── session/       # Today's session
│   │   │   ├── history/       # Session history
│   │   │   ├── settings/      # User preferences
│   │   │   └── layout.tsx     # App layout with nav
│   │   ├── auth/              # Auth routes
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── layout.tsx         # Root layout with provider
│   │   └── page.tsx           # Home redirect
│   ├── components/
│   │   ├── log/               # Log form component
│   │   ├── session/           # Session view
│   │   ├── history/           # History view
│   │   ├── settings/          # Settings view
│   │   ├── layout/            # Header, bottom nav
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth/              # Auth provider, protected route
│   │   ├── supabase/          # Client & server utils
│   │   ├── constants.ts       # Skills, movements, labels
│   │   └── utils.ts           # TailwindCSS utilities
│   └── types/                 # TypeScript types
├── public/
│   └── manifest.json          # PWA manifest
├── supabase/
│   └── migrations/
│       └── 001_init_schema.sql # Database migration
└── package.json
```

## 🧪 Manuel Testing Checklist

### Auth Flow
- [ ] Sign up with email/password
- [ ] Confirm email (check inbox)
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password (error shown)
- [ ] Logout from settings header button
- [ ] Protected routes redirect to login when not authenticated

### Log Page (Quick Add)
- [ ] Skill toggle switches between Planche/Front
- [ ] Technique chips update based on skill
- [ ] Movement chips update based on skill
- [ ] Assistance chips selection works
- [ ] Assistance custom kg input appears when band selected
- [ ] Added weight kg input works
- [ ] Duration input + timer works (for hold/negative)
- [ ] Timer start/stop/reset buttons functional
- [ ] Reps input works (for press/pushup/pullup)
- [ ] RPE slider 1-10 works
- [ ] Form quality dropdown works
- [ ] Lockout toggle works
- [ ] Deadstop toggle works
- [ ] Pain tag selection works
- [ ] Notes textarea works
- [ ] Save button creates set in database
- [ ] +Same Again button saves & clears form
- [ ] Multiple sets can be logged in one session
- [ ] Form validation (required fields)

### Session Page (Today)
- [ ] Shows today's date
- [ ] Lists all sets from today
- [ ] Displays totals: hold time, reps, hard sets count
- [ ] Delete set button works
- [ ] Form shows "No sets logged yet" when empty
- [ ] Updated when new set is logged from other page

### History Page
- [ ] Shows sessions from last 30 days
- [ ] Sessions ordered by date (newest first)
- [ ] Click expand shows set details
- [ ] Set details show all relevant data
- [ ] Multiple sessions can be expanded
- [ ] Empty state shows when no sessions

### Settings Page
- [ ] Bodyweight field loads current value
- [ ] Can edit and save bodyweight
- [ ] Primary focus dropdown works
- [ ] Sessions per week target slider works (3-6)
- [ ] Account info displays (email, member since)
- [ ] Save settings button persists data
- [ ] Data persists after page reload

### Mobile & PWA
- [ ] App looks good on mobile screens
- [ ] Bottom nav is always visible at bottom
- [ ] Tab navigation switches pages
- [ ] Active tab shows highlight
- [ ] No horizontal scroll on mobile
- [ ] Touch interactions feel responsive
- [ ] Can install as PWA (Chrome: +install button)
- [ ] PWA loads offline-ready structure

### Data Persistence
- [ ] Sets saved in Supabase database
- [ ] User data isolated (RLS working)
- [ ] Sessions created automatically
- [ ] User preferences created on signup
- [ ] Data survives page refresh
- [ ] History shows all logged sets

### Edge Cases
- [ ] Hold movement without seconds fails
- [ ] Dynamic movement without reps fails
- [ ] RPE value always 1-10
- [ ] Negative RPE values prevented
- [ ] Special characters in notes handled
- [ ] Very long notes display correctly
- [ ] Delete set shows confirmation
- [ ] Network error handling (Supabase down)

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

Then set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Docker
Build and run with Docker if needed.

## 📝 Notes

- **Timer**: Uses browser `setInterval`, survives page navigation if user stays in app
- **Offline**: Current version requires online connection (Supabase + Auth)
- **Icons**: Using lucide-react for all UI icons
- **Responsive**: Mobile-first design, tested on various screen sizes
- **PWA**: Manifest ready, can be enhanced with service workers later

## 🔐 Security

- All database operations protected by Supabase RLS
- Email verification required for signup
- Session tokens managed by Supabase Auth
- No sensitive data in localStorage except session tokens
- Form validation both client & server-side

## 📚 Future Enhancements (Out of Scope for Now)

- Performance graphs & charts
- Plateau detection algorithm
- Automatic training plan generation
- CSV export
- Social features (follow, compare)
- Advanced analytics
- Offline mode with sync
- Mobile app (React Native)

---

**Built with ❤️ for street workout athletes**
