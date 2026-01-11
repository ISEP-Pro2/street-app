'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ComboItem as ComboItemType, Combo } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { getOrCreateSessionAction, createComboAction, getUserPreferencesAction } from '@/app/app/combo/actions';
import { calculateComboLoad, formatComboType } from '@/lib/utils/combo-calc';
import ComboHeader from './combo-header';
import ComboQuickAdd from './combo-quick-add';
import ComboItemsList from './combo-items-list';
import ComboSummary from './combo-summary';
import { ChevronDown } from 'lucide-react';

export function ComboMode({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave?: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<ComboItemType[]>([]);
  const [assistanceGlobal, setAssistanceGlobal] = useState<number>(0);
  const [overridePerItem, setOverridePerItem] = useState(false);
  const [rpeGlobal, setRpeGlobal] = useState<number | undefined>(8);
  const [formGlobal, setFormGlobal] = useState<'clean' | 'ok' | 'ugly'>('ok');
  const [notes, setNotes] = useState('');
  const [lastSkill, setLastSkill] = useState<'planche' | 'front'>('planche');
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [bodyweight, setBodyweight] = useState(75);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const itemsListRef = useRef<HTMLDivElement>(null);

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      try {
        const result = await getUserPreferencesAction();
        if (result.bodyweight) {
          setBodyweight(result.bodyweight);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
    loadUserData();
  }, []);

  const addItem = useCallback(
    (newItem: Omit<ComboItemType, 'id' | 'combo_id' | 'user_id' | 'created_at' | 'order_index'>) => {
      const tempId = `temp-${Date.now()}`;
      const item: ComboItemType = {
        id: tempId,
        combo_id: '',
        user_id: '',
        order_index: items.length,
        created_at: new Date().toISOString(),
        ...newItem,
      };
      setItems(prev => [...prev, item]);
      setLastSkill(newItem.skill);
      
      // Highlight and scroll to new item
      setHighlightedItemId(tempId);
      setTimeout(() => {
        const element = document.getElementById(`item-${tempId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedItemId(null);
      }, 2000);
    },
    [items.length]
  );

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<ComboItemType>) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleSave = async () => {
    if (items.length === 0) {
      alert('Add at least 1 item to create a combo');
      return;
    }

    setIsSaving(true);
    try {
      // Get or create today's session
      const sessionResult = await getOrCreateSessionAction();
      if (!sessionResult.sessionId) {
        alert(sessionResult.error || 'Failed to create session');
        setIsSaving(false);
        return;
      }

      // Prepare items for insertion
      const itemsForDb = items.map((item) => ({
        skill: item.skill,
        technique: item.technique,
        movement: item.movement,
        seconds: item.seconds,
        reps: item.reps,
        assistanceKg: overridePerItem ? item.assistance_kg : undefined,
        formQuality: item.form_quality,
        notes: item.notes,
      }));

      // Create combo
      const comboResult = await createComboAction(
        sessionResult.sessionId,
        assistanceGlobal,
        overridePerItem,
        rpeGlobal,
        formGlobal,
        itemsForDb,
        notes || undefined
      );
      if (!comboResult.success || !comboResult.comboId) {
        alert(comboResult.error || 'Failed to create combo');
        setIsSaving(false);
        return;
      }

      // Navigate to session view
      router.push(`/app/session`);
    } catch (error) {
      console.error('Error saving combo:', error);
      alert('Error saving combo');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate combo stats
  const comboType = formatComboType(items);
  const load = calculateComboLoad(items, bodyweight, assistanceGlobal, overridePerItem);

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      {/* Header */}
      <ComboHeader
        comboType={comboType}
        itemCount={items.length}
        onCancel={onCancel}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Settings Accordion */}
        <div className="border-b">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition"
          >
            <span className="font-semibold text-sm">▸ Combo Settings</span>
            <ChevronDown 
              className={`w-4 h-4 transition transform ${settingsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          
          {settingsOpen && (
            <div className="px-4 py-4 bg-secondary/30 space-y-4 border-t">
              {/* Assistance Global */}
              <div>
                <label className="block text-sm font-medium mb-2">Global Assistance</label>
                <div className="flex gap-2">
                  {[0, 5, 15, 25].map(kg => (
                    <button
                      key={kg}
                      onClick={() => setAssistanceGlobal(kg)}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                        assistanceGlobal === kg
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {kg === 0 ? 'None' : `+${kg}kg`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Override Per Item Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Override per item</label>
                <button
                  onClick={() => setOverridePerItem(!overridePerItem)}
                  className={`w-12 h-6 rounded-full transition flex items-center ${
                    overridePerItem ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition transform ${
                      overridePerItem ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* RPE Global */}
              <div>
                <label className="block text-sm font-medium mb-2">RPE (optional): {rpeGlobal || 'N/A'}</label>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[rpeGlobal || 5]}
                  onValueChange={([value]) => setRpeGlobal(value)}
                />
              </div>

              {/* Form Global */}
              <div>
                <label className="block text-sm font-medium mb-2">Form</label>
                <Select
                  value={formGlobal}
                  onValueChange={(value) => setFormGlobal(value as any)}
                >
                  <option value="clean">Clean</option>
                  <option value="ok">OK</option>
                  <option value="ugly">Ugly</option>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quick notes..."
                  className="w-full p-2 border rounded text-sm resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Item */}
        <div className="p-4 border-b">
          <ComboQuickAdd
            lastSkill={lastSkill}
            lastRpe={rpeGlobal}
            lastForm={formGlobal}
            overridePerItem={overridePerItem}
            onAddItem={addItem}
            onItemAdded={() => {}}
          />
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="p-4 border-b" ref={itemsListRef}>
            <h3 className="font-semibold mb-3">Items ({items.length})</h3>
            <ComboItemsList
              items={items}
              assistanceGlobal={assistanceGlobal}
              overridePerItem={overridePerItem}
              bodyweight={bodyweight}
              onRemoveItem={removeItem}
              onUpdateItem={updateItem}
              highlightedItemId={highlightedItemId}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 space-y-3">
        <ComboSummary load={load} itemCount={items.length} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={items.length === 0 || isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Combo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
