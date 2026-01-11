'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Skill, LogFormData } from '@/types';
import {
  TECHNIQUES,
  MOVEMENTS,
  ASSISTANCE_TYPES,
  FORM_QUALITIES,
  PAIN_TAGS,
  DURATION_MOVEMENTS,
  REP_MOVEMENTS,
  SKILL_LABELS,
  TECHNIQUE_LABELS,
  MOVEMENT_LABELS,
  ASSISTANCE_LABELS,
  FORM_QUALITY_LABELS,
  PAIN_TAG_LABELS,
} from '@/lib/constants';
import { Clock, Repeat2, CheckCircle2, ChevronDown } from 'lucide-react';

interface LogFormProps {
  onSuccess?: () => void;
}

export function LogForm({ onSuccess }: LogFormProps) {
  const [skill, setSkill] = useState<Skill>('planche');
  const [technique, setTechnique] = useState<string>(TECHNIQUES.planche[0]);
  const [movement, setMovement] = useState<string>(MOVEMENTS.planche[0]);
  const [assistance, setAssistance] = useState<string>('none');
  const [assistanceKg, setAssistanceKg] = useState<string>('');
  const [addedWeight, setAddedWeight] = useState<string>('');
  const [seconds, setSeconds] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rpe, setRpe] = useState<number>(5);
  const [formQuality, setFormQuality] = useState<string>('clean');
  const [lockout, setLockout] = useState<boolean>(true);
  const [deadstop, setDeadstop] = useState<boolean>(false);
  const [painTag, setPainTag] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isTimer, setIsTimer] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [executionDetailsOpen, setExecutionDetailsOpen] = useState<boolean>(false);
  const [reportPainClicked, setReportPainClicked] = useState<boolean>(false);

  const supabase = createClient();

  // Load execution details state from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('executionDetailsOpen');
    if (saved !== null) {
      setExecutionDetailsOpen(saved === 'true');
    }
  }, []);

  // Save execution details state to session storage
  useEffect(() => {
    sessionStorage.setItem('executionDetailsOpen', String(executionDetailsOpen));
  }, [executionDetailsOpen]);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSkillChange = (newSkill: Skill) => {
    setSkill(newSkill);
    setTechnique(TECHNIQUES[newSkill][0]);
    setMovement(MOVEMENTS[newSkill][0]);
  };

  const isTechniqueDuration = DURATION_MOVEMENTS.includes(movement);
  const isDurationInput = DURATION_MOVEMENTS.includes(movement);
  const isRepInput = REP_MOVEMENTS.includes(movement);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimerSeconds(0);
    setIsRunning(false);
  };

  const handleSave = async () => {
    if (loading) return;

    // Validation
    if (isDurationInput && !seconds && !isTimer) {
      alert('Please enter seconds or use the timer');
      return;
    }
    if (isRepInput && !reps) {
      alert('Please enter reps');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Not authenticated');
        return;
      }

      // Get or create today's session
      const today = new Date().toISOString().split('T')[0];
      let sessionId: string;

      const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .single();

      if (existingSession) {
        sessionId = existingSession.id;
      } else {
        const { data: newSession, error } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            session_date: today,
          })
          .select('id')
          .single();

        if (error) throw error;
        sessionId = newSession.id;
      }

      // Insert set
      const finalSeconds = isTimer ? timerSeconds : seconds ? parseFloat(seconds) : null;
      const finalReps = isRepInput ? parseInt(reps) : null;

      const { error: setError } = await supabase.from('sets').insert({
        user_id: user.id,
        session_id: sessionId,
        skill,
        technique,
        movement,
        assistance_type: assistance,
        assistance_kg: assistanceKg ? parseFloat(assistanceKg) : null,
        added_weight_kg: addedWeight ? parseFloat(addedWeight) : null,
        seconds: finalSeconds,
        reps: finalReps,
        rpe,
        form_quality: formQuality,
        lockout,
        deadstop,
        pain_tag: painTag || null,
        notes: notes || null,
      });

      if (setError) throw setError;

      // Reset form
      setSeconds('');
      setReps('');
      setRpe(5);
      setFormQuality('clean');
      setLockout(true);
      setDeadstop(false);
      setPainTag('');
      setNotes('');
      setTimerSeconds(0);
      setIsRunning(false);

      onSuccess?.();
    } catch (error) {
      console.error('Error saving set:', error);
      alert('Error saving set');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (loading) return;

    // Save first
    await handleSave();

    // Form will be cleared after save, so no additional action needed
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Combo Mode Button */}
      <Link href="/app/combo">
        <Button variant="outline" className="w-full" size="lg">
          <span className="text-lg mr-2">⛓️</span>
          + Combo Mode
        </Button>
      </Link>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Quick Add Set</h2>

        {/* Skill Toggle */}
        <div className="mb-6">
          <Label className="mb-2 block text-xs font-medium">Skill</Label>
          <div className="flex gap-2">
            {Object.entries(SKILL_LABELS).map(([key, label]) => (
              <Toggle
                key={key}
                pressed={skill === key}
                onPressedChange={() => handleSkillChange(key as Skill)}
                className="flex-1"
              >
                {label}
              </Toggle>
            ))}
          </div>
        </div>

        {/* Technique Chips */}
        <div className="mb-6">
          <Label className="mb-2 block text-xs font-medium">Technique</Label>
          <div className="flex flex-wrap gap-2">
            {TECHNIQUES[skill].map((tech) => (
              <button
                key={tech}
                onClick={() => setTechnique(tech)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  technique === tech
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {TECHNIQUE_LABELS[tech]}
              </button>
            ))}
          </div>
        </div>

        {/* Movement Chips */}
        <div className="mb-6">
          <Label className="mb-2 block text-xs font-medium">Movement</Label>
          <div className="flex flex-wrap gap-2">
            {MOVEMENTS[skill].map((mov) => (
              <button
                key={mov}
                onClick={() => setMovement(mov)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  movement === mov
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {MOVEMENT_LABELS[mov]}
              </button>
            ))}
          </div>
        </div>

        {/* Assistance Chips */}
        <div className="mb-6">
          <Label className="mb-2 block text-xs font-medium">Assistance</Label>
          <div className="flex flex-wrap gap-2">
            {ASSISTANCE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setAssistance(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  assistance === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {ASSISTANCE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Assistance custom kg */}
          {assistance !== 'none' && (
            <Input
              type="number"
              placeholder="Assistance kg (optional)"
              value={assistanceKg}
              onChange={(e) => setAssistanceKg(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        {/* Added Weight */}
        <div className="mb-6">
          <Label htmlFor="added-weight" className="text-xs font-medium">
            Added Weight (kg)
          </Label>
          <Input
            id="added-weight"
            type="number"
            placeholder="0"
            value={addedWeight}
            onChange={(e) => setAddedWeight(e.target.value)}
          />
        </div>

        {/* Value Input (Seconds or Reps) */}
        {isDurationInput && (
          <div className="mb-6">
            <Label className="mb-2 block text-xs font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Seconds"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  disabled={isTimer}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleStartStop}
                className="w-24"
              >
                {isRunning ? 'Stop' : 'Start'}
              </Button>
            </div>
            {isTimer && (
              <div className="mt-2 text-center text-2xl font-mono font-bold">
                {Math.floor(timerSeconds / 60)}:
                {String(timerSeconds % 60).padStart(2, '0')}
              </div>
            )}
            {timerSeconds > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="mt-2 w-full"
              >
                Reset Timer
              </Button>
            )}
          </div>
        )}

        {isRepInput && (
          <div className="mb-6">
            <Label className="mb-2 block text-xs font-medium flex items-center gap-2">
              <Repeat2 className="w-4 h-4" />
              Reps
            </Label>
            <Input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </div>
        )}

        {/* RPE Slider */}
        <div className="mb-6">
          <Label className="mb-3 block text-xs font-medium">
            RPE (Rate of Perceived Exertion): {rpe}
          </Label>
          <Slider
            value={[rpe]}
            onValueChange={(value) => setRpe(value[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
        </div>

        {/* Form Quality */}
        <div className="mb-6">
          <Label className="mb-2 block text-xs font-medium">Form Quality</Label>
          <Select value={formQuality} onValueChange={setFormQuality}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_QUALITIES.map((quality) => (
                <SelectItem key={quality} value={quality}>
                  {FORM_QUALITY_LABELS[quality]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Execution Details Accordion */}
        <div className="mb-6 border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExecutionDetailsOpen(!executionDetailsOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition text-left"
          >
            <span className="text-sm font-medium">▸ Execution Details</span>
            <ChevronDown 
              className={`w-4 h-4 transition transform ${executionDetailsOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {executionDetailsOpen && (
            <div className="px-4 py-4 bg-secondary/30 space-y-4 border-t">
              {/* Lockout Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Full Lockout</Label>
                <Toggle pressed={lockout} onPressedChange={setLockout}>
                  {lockout ? 'Yes' : 'No'}
                </Toggle>
              </div>

              {/* Deadstop Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Deadstop</Label>
                <Toggle pressed={deadstop} onPressedChange={setDeadstop}>
                  {deadstop ? 'Yes' : 'No'}
                </Toggle>
              </div>

              {/* Pain/Issue - Conditional Visibility */}
              {(rpe >= 8 || reportPainClicked) && (
                <div>
                  <Label className="mb-2 block text-xs font-medium">Pain/Issue</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPainTag('')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        !painTag
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      None
                    </button>
                    {PAIN_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setPainTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          painTag === tag
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {PAIN_TAG_LABELS[tag]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Pain Button - Visible if RPE < 8 and pain not yet clicked */}
              {rpe < 8 && !reportPainClicked && (
                <Button
                  onClick={() => setReportPainClicked(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Report Pain/Issue
                </Button>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-xs font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            {loading ? 'Saving...' : '+Same'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
