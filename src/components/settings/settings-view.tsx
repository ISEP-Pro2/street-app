'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PRIMARY_FOCUS_LABELS } from '@/lib/constants';
import type { UserPreferences } from '@/types';

export function SettingsView() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [bodyweight, setBodyweight] = useState<string>('75');
  const [primaryFocus, setPrimaryFocus] = useState<string>('balanced');
  const [sessionsTarget, setSessionsTarget] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences(data);
        setBodyweight(data.bodyweight_kg.toString());
        setPrimaryFocus(data.primary_focus);
        setSessionsTarget(data.sessions_per_week_target);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !bodyweight) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          bodyweight_kg: parseFloat(bodyweight),
          primary_focus: primaryFocus,
          sessions_per_week_target: sessionsTarget,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 p-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Card className="p-6 space-y-6">
          {/* Bodyweight */}
          <div>
            <Label htmlFor="bodyweight" className="text-sm font-medium">
              Bodyweight (kg)
            </Label>
            <Input
              id="bodyweight"
              type="number"
              step="0.5"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Used for relative strength calculations
            </p>
          </div>

          {/* Primary Focus */}
          <div>
            <Label className="text-sm font-medium">Primary Focus</Label>
            <Select value={primaryFocus} onValueChange={setPrimaryFocus}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planche_first">Planche First</SelectItem>
                <SelectItem value="front_first">Front Lever First</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Helps organize your training focus
            </p>
          </div>

          {/* Sessions per Week Target */}
          <div>
            <Label className="text-sm font-medium">
              Sessions per Week Target: {sessionsTarget}
            </Label>
            <Slider
              value={[sessionsTarget]}
              onValueChange={(value) => setSessionsTarget(value[0])}
              min={3}
              max={6}
              step={1}
              className="mt-4"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Target number of training sessions per week (3-6)
            </p>
          </div>

          {/* Account Info */}
          <div className="pt-6 border-t border-border">
            <h3 className="font-semibold mb-3">Account</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              {user?.created_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
