# PALIER 5 — COMBO (Chaîne d'exercices)

## Vue d'ensemble

**COMBO** est une nouvelle fonctionnalité pour logger rapidement une séquence d'exercices (items) enchaînés. Le combo :

- ✅ Est enregistré en < 30 secondes
- ✅ Compte dans la **Charge Globale (Global Score)** avec un coefficient d'enchaînement
- ✅ **N'affecte PAS** les KPIs "best-of-day" (exclus par design)
- ✅ Mobile-first, UX optimisé pour un seul tap par item

---

## 1. Entrée du Combo

### Bouton "+ Combo" sur l'écran Log
- Visible en haut de la page Log
- Tap → ouvre la page `/app/combo` (Combo Mode pleine page)
- Permet de logger rapidement sans passer par le formulaire standard

---

## 2. Combo Mode — Interface

### Header Sticky
```
CANCEL          COMBO               SAVE
                (MIX, 3 items)
```

- **Titre central**: "COMBO"
- **Badge**: Calcul automatique selon les items
  - "PLANCHE" si tous les items sont planche
  - "FRONT" si tous sont front
  - "MIX" si mélange planche + front
- **Boutons**:
  - Cancel (gauche) → retour sans save
  - Save (droite) → créer le combo

### Settings Globales (sticky)
Tous les champs sont optionnels sauf l'assistance qui a une valeur par défaut (0 = None).

#### Assistance Globale
- Chips: None | +5kg | +15kg | +25kg
- Par défaut: **None**
- Appliquée à tous les items sauf si "Override per item" = ON

#### Override per Item (Toggle)
- OFF (défaut): l'assistance s'applique à tous les items de la même façon
- ON: permet de définir une assistance différente pour chaque item

#### RPE Global (Slider)
- 1-10 (optional)
- Par défaut: 8

#### Form Global (Select)
- clean / ok / ugly
- Par défaut: **ok**

#### Notes
- Textarea libre (optional)

### Quick Add Item (Zone importante)

Optimisée pour la vitesse (heritage des sélections).

#### Skill Segmented
- Planche | Front
- Par défaut: **dernier skill utilisé**, sinon planche

#### Technique Chips
- **Planche**: Lean, Tuck, Adv Tuck, Straddle, Full, Maltese
- **Front**: Tuck, Adv Tuck, Full
- Par défaut: première option

#### Movement Chips
- **Planche**: Hold, Press, Negative, Push-up
- **Front**: Hold, Pull-up, Negative, Press
- Par défaut: Hold

#### Valeur Input (selon mouvement)
- **Hold**: Input seconds (numérique)
  - Helper tip pour Front: "💡 Touch = Hold 1-2s"
  - Pas de stopwatch en v1
- **Autres** (Press, Negative, Pull-up): Stepper reps [-] 1 [+]
  - Min: 1

#### Assistance (si override per item = ON)
- Chips: None | 5kg | 15kg | 25kg
- Par défaut: None

#### Bouton "+ Add Item"
- Ajoute l'item à la liste
- **Réinitialise UNIQUEMENT seconds/reps**
- Conserve skill / technique / movement pour vitesse

### Résumé Items (Liste)

Chaque item affiche:
- Numéro d'ordre (badge)
- Skill + Technique
- Movement + Valeur (s ou reps)
- Assistance effective
- Swipe left ou bouton trash → delete + confirm

### Footer Sticky

```
Items: 8 | Base: 1200 | Chain: 1.47x | Load: 1764

[Cancel]  [Save Combo]
```

Affiche le résumé du calcul de charge (voir section 3).

---

## 3. Calcul de Charge (ComboLoadScore)

### Inputs
- `bodyweight_kg` depuis user_preferences (default 75)
- Pour chaque item, l'assistance effective:
  - Si override per item et item.assistance_kg ≠ null → use item.assistance_kg
  - Sinon → use combo.assistance_global_kg

### Formulas

#### EffectiveLoad
```
effectiveLoad = bodyweight_kg - assistance_kg + added_weight_kg
```
(added_weight_kg = 0 pour les combos v1)

#### ItemScore
```
if movement = 'hold':
  itemScore = seconds * effectiveLoad
else:
  itemScore = reps * effectiveLoad
```

#### BaseComboScore
```
baseComboScore = sum(all itemScore)
```

#### ChainFactor
```
n = nombre d'items
distinctMovements = nombre de types de mouvement uniques

chainFactor = 1 + 0.07*(n-1) + 0.05*(distinctMovements-1)
chainFactor = clamp(1.0, 2.0)
```

**Logique**: Incite l'utilisateur à:
- Ajouter plus d'items (+7% par item)
- Varier les mouvements (+5% par mouvement unique)
- Max bonus: 100% de boost (chainFactor=2.0)

#### ComboLoadScore
```
comboLoadScore = baseComboScore * chainFactor
```

### Exemple

**Combo MIX (8 items)**:
- Planche Tuck Hold 20s (bodyweight=75, assistance=0) → score = 20 × 75 = 1500
- Planche Full Press 5x (bw=75, assist=0) → score = 5 × 75 = 375
- Front Adv Tuck Hold 15s (bw=75, assist=5) → score = 15 × 70 = 1050
- Front Full Pull-up 3x (bw=75, assist=15) → score = 3 × 60 = 180
- ... (4 autres items)

**Base**: 1200  
**Movements**: {hold, press, pullup, negative} = 4 uniques  
**ChainFactor**: 1 + 0.07×7 + 0.05×3 = 1 + 0.49 + 0.15 = 1.64  
**ComboLoadScore**: 1200 × 1.64 = **1968**

---

## 4. Global Score Intégration

### Avant Combo
```
GlobalLoad_Session = sum(sets scores)
```

### Après Combo
```
GlobalLoad_Session = sum(sets scores) + sum(combos load scores)
```

- Les combos ajoutent leur load au score hebdo
- Recalcul automatique lors de la consultation de l'insights page
- Affichage dans la carte GlobalScore

---

## 5. KPIs — Exclusion par Design

Les KPIs "best-of-day" ne sont calculés que sur la table `sets`:

```sql
SELECT best_value, best_form_quality
FROM sets
WHERE user_id = ? AND skill = ? AND technique = ? AND movement = ?
ORDER BY performed_at DESC
```

**Combo items ne sont PAS inclus** dans les requêtes KPI.

- ✅ Plafonner 20s hold → pulse un KPI
- ✅ Combo avec 8 items incluant un hold de 18s → n'affecte PAS le KPI

Justification: Les combos sont **chaînes polymorphes** (mix skills/mouvements), incompatible avec l'analyse KPI single-mouvement.

---

## 6. Données (Supabase)

### Table: `combos`
```
id (uuid pk)
user_id (uuid, fk auth.users, on delete cascade)
session_id (uuid, fk sessions, on delete cascade)
performed_at (timestamptz, default now())
assistance_global_kg (numeric, default 0, in (0,5,15,25))
override_assistance_per_item (boolean, default false)
rpe_global (int, null, check 1-10)
form_global (text, default 'ok', check ('clean','ok','ugly'))
notes (text, null)
created_at (timestamptz, default now())
updated_at (timestamptz, default now())
```

**Indexes**:
- (user_id, performed_at desc)
- (user_id, session_id)

**RLS**: Toutes les policies `WHERE user_id = auth.uid()`

### Table: `combo_items`
```
id (uuid pk)
combo_id (uuid, fk combos, on delete cascade)
user_id (uuid, fk auth.users, on delete cascade)
order_index (int, not null)
skill (text, check ('planche','front'))
technique (text, not null)
movement (text, check ('hold','press','pushup','pullup','negative'))
seconds (numeric, null, check > 0)
reps (int, null, check >= 1)
assistance_kg (numeric, null, only if override_per_item, check in (0,5,15,25))
form_quality (text, null, check ('clean','ok','ugly'))
notes (text, null)
created_at (timestamptz, default now())
```

**Indexes**:
- (combo_id, order_index)
- (user_id, created_at desc)

**RLS**: Toutes les policies `WHERE user_id = auth.uid()`

**Validation (obligatoire en app)**:
- movement='hold' → seconds required, reps must be null
- Autres → reps required, seconds must be null

---

## 7. Affichage dans la Session

### Section Combos
Après la section des sets totaux, avant la liste des sets détaillés:

```
⛓️ Combos (3)
  Combo (MIX) — items: 8 — RPE: 8
  Load: 1968 (Chain: 1.64x)
  [expand △] [delete 🗑️]

  ↓ (expanded):
    1. 🏋️ Tuck [Hold 20s • -0kg]
    2. 🏋️ Full [Press 5x • -0kg]
    3. 🤸 Adv Tuck [Hold 15s • -5kg]
    ...
```

- Tap sur le combo → expand/collapse items
- Swipe ou bouton delete → hard delete + reload

---

## 8. Validation et Save Flow

### Validation
- ✅ Au moins 1 item
- ✅ Hold → seconds > 0
- ✅ Autres → reps >= 1
- ✅ Assistance si override per item

### Save Flow (Server Action)
1. Vérifier >= 1 item
2. `getOrCreateSessionAction()` → get/create session du jour
3. `createComboAction()` →  insert combo row + combo_items rows (avec order_index)
4. Success → navigate to `/app/session/{session_date}`
5. Error → alert + stay on combo mode

---

## 9. Fichiers Créés / Modifiés

### CRÉÉS
- `supabase/migrations/003_combo_schema.sql` (250 lignes)
- `src/types/index.ts` (+70 lignes: types Combo)
- `src/lib/utils/combo-calc.ts` (350 lignes, tous les calculs)
- `src/lib/supabase/combos.ts` (200 lignes, CRUD)
- `src/lib/supabase/sessions.ts` (90 lignes, session helpers)
- `src/lib/supabase/user.ts` (70 lignes, user helpers)
- `src/app/app/combo/layout.tsx` (10 lignes)
- `src/app/app/combo/page.tsx` (30 lignes, client)
- `src/app/app/combo/actions.ts` (150 lignes, server actions)
- `src/components/combo/combo-mode.tsx` (250 lignes, main component)
- `src/components/combo/combo-header.tsx` (60 lignes)
- `src/components/combo/combo-quick-add.tsx` (180 lignes)
- `src/components/combo/combo-items-list.tsx` (50 lignes)
- `src/components/combo/combo-item-card.tsx` (80 lignes)
- `src/components/combo/combo-summary.tsx` (40 lignes)
- `src/components/session/session-combos.tsx` (190 lignes, display)

### MODIFIÉS
- `src/components/log/log-form.tsx` (+15 lignes, bouton + Combo)
- `src/components/session/session-view.tsx` (+40 lignes, charge combos, display)
- `src/lib/supabase/insights.ts` (+80 lignes, getGlobalScoreData inclut combos)

---

## 10. Test Manuel

### Scénario 1: Créer un Combo Simple Planche
1. Log → "+ Combo"
2. Skill: Planche, Technique: Tuck, Movement: Hold, Seconds: 20
3. "+ Add Item"
4. Skill: Planche, Technique: Full, Movement: Press, Reps: 5
5. "+ Add Item"
6. Assistance: None, RPE: 8, Form: ok
7. "Save Combo"
8. ✅ Redirect vers session du jour
9. ✅ Combo visible avec load = 20×75 + 5×75 = 1875

### Scénario 2: Créer un Combo MIX
1. Log → "+ Combo"
2. Skill: Planche, Technique: Full, Movement: Hold, Seconds: 25 → "+ Add Item"
3. Skill: Front, Technique: Full, Movement: Hold, Seconds: 15 → "+ Add Item"
4. Skill: Planche, Technique: Lean, Movement: Pushup, Reps: 3 → "+ Add Item"
5. Skill: Front, Technique: Adv Tuck, Movement: Pullup, Reps: 2 → "+ Add Item"
6. RPE: 9, Form: clean
7. "Save Combo"
8. ✅ Badge: "MIX", items: 4
9. ✅ ChainFactor: 1 + 0.07×3 + 0.05×3 = 1.41
10. ✅ Charge globale augmente

### Scénario 3: Delete Combo
1. Session → Swipe combo left ou bouton trash
2. Confirm delete
3. ✅ Combo supprimé (et items via cascade)
4. ✅ Charge globale mise à jour

### Scénario 4: KPI Intégrité
1. Log 1 set: Planche Full Hold 20s (best-of-day KPI = 20)
2. Log 1 combo: 8 items dont 1 Planche Full Hold 18s
3. ✅ KPI reste 20 (combo 18s n'affecte PAS)
4. ✅ GlobalScore = set score + combo load (non cumulatif sur KPI)

---

## 11. Performance & Limites

### Performance
- **Combo creation**: ~ 100-150ms (insert combo + items)
- **Combo load calc**: Inline en app (~5ms pour 8 items)
- **Global Score**: Re-fetch tous les combos (60 jours) ~ 500ms

### Limites v1
- Pas de timer global combo
- Pas d'édition des items (delete + re-add)
- Pas de densité réelle / rest between items
- Max 100 items par combo (check DB)

---

## 12. Troubleshooting

### "Not authenticated" on Save
→ Vérifier la session auth (provider)

### Combo apparaît pas dans Session
→ Rafraîchir la page (F5)
→ Vérifier que session_id est correct

### KPI affecté après Combo
→ C'est un bug! Les combos sont exclus des KPIs.
→ Vérifier la requête KPI (doit filtrer sur table `sets` uniquement)

---

## 13. Acceptance Criteria ✅

- ✅ Créer combo MIX planche+front avec 8 items en < 30s
- ✅ Add item conserve skill/technique/movement, reset seulement valeur
- ✅ Hold exige seconds; autres exigent reps
- ✅ Combo apparaît dans Session + History
- ✅ GlobalLoad augmente avec combo (no impact KPI)
- ✅ KPIs best-of-day inchangés après combo
- ✅ Delete combo supprime aussi items (cascade)
- ✅ RLS: user ne voit jamais combos d'autres users

---

## 14. Prochaines Étapes (Hors Scope v1)

- [ ] Édition combos (mise à jour items)
- [ ] Timer global combo + densité
- [ ] "Counts for KPI" toggle (optionnel)
- [ ] Export/partage combos
- [ ] Vidéo/photo combo
- [ ] Combo templates

---

## Fichier de Référence

Voir **COMBO_REFERENCE.md** pour:
- Architecture détaillée
- Fonctions API complètes
- Schéma SQL complet
- Types TypeScript
- Exemples de calcul

