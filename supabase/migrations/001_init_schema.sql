-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- Create sets table
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  skill TEXT NOT NULL CHECK (skill IN ('planche', 'front')),
  technique TEXT NOT NULL,
  movement TEXT NOT NULL,
  assistance_type TEXT NOT NULL CHECK (assistance_type IN ('none', 'band_5', 'band_15', 'band_25')),
  assistance_kg NUMERIC(5,2),
  added_weight_kg NUMERIC(5,2),
  seconds NUMERIC(10,2),
  reps INT,
  rpe INT NOT NULL CHECK (rpe >= 1 AND rpe <= 10),
  form_quality TEXT NOT NULL CHECK (form_quality IN ('clean', 'ok', 'ugly')),
  lockout BOOLEAN NOT NULL DEFAULT TRUE,
  deadstop BOOLEAN NOT NULL DEFAULT FALSE,
  pain_tag TEXT CHECK (pain_tag IN ('wrist', 'elbow', 'shoulder', 'scap') OR pain_tag IS NULL),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bodyweight_kg NUMERIC(6,2) NOT NULL DEFAULT 75,
  primary_focus TEXT NOT NULL DEFAULT 'balanced' CHECK (primary_focus IN ('planche_first', 'front_first', 'balanced')),
  sessions_per_week_target INT NOT NULL DEFAULT 4 CHECK (sessions_per_week_target >= 3 AND sessions_per_week_target <= 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_date ON sessions(session_date);
CREATE INDEX idx_sets_user_id ON sets(user_id);
CREATE INDEX idx_sets_session_id ON sets(session_id);
CREATE INDEX idx_sets_performed_at ON sets(performed_at);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions table
CREATE POLICY "Sessions are viewable by owner" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sessions are insertable by owner" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sessions are updatable by owner" ON sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sessions are deletable by owner" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sets table
CREATE POLICY "Sets are viewable by owner" ON sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sets are insertable by owner" ON sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sets are updatable by owner" ON sets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sets are deletable by owner" ON sets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_preferences table
CREATE POLICY "User preferences are viewable by owner" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User preferences are insertable by owner" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User preferences are updatable by owner" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create function to insert default user preferences on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
