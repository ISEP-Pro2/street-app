# 🚀 Quick Start Guide

Démarrez votre Street Workout Tracker en 5 minutes!

## Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase (gratuit sur [supabase.com](https://supabase.com))

## Étape 1: Supabase Setup (2 min)

### Créer un projet Supabase
1. Aller à [supabase.com/dashboard](https://supabase.com/dashboard)
2. Cliquer "New Project"
3. Remplir les détails (nom, mot de passe, région)
4. Attendre que le projet se crée (2-3 min)

### Copier les identifiants
1. Aller à Settings → API
2. Copier:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Créer les tables
1. Aller à SQL Editor
2. Copier-coller le contenu de `supabase/migrations/001_init_schema.sql`
3. Cliquer "Run"
4. ✅ Tables créées!

## Étape 2: Configurer l'App (1 min)

### Créer le fichier `.env.local`

À la racine du projet:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key-here
```

(Remplacer par vos valeurs de Supabase)

## Étape 3: Démarrer (1 min)

```bash
# Installer les dépendances (première fois seulement)
npm install

# Démarrer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Étape 4: Tester l'App (1 min)

1. **Créer un compte**: Aller à Sign Up et créer une adresse email
2. **Confirmer l'email**: Vérifier votre inbox (Supabase envoie un lien)
3. **Se connecter**: Utiliser vos identifiants
4. **Logger un set**:
   - Aller à l'onglet "Log"
   - Sélectionner Planche
   - Choisir une technique (ex: Tuck)
   - Choisir Hold
   - Entrer 30 secondes
   - RPE = 7
   - Cliquer "Save"
5. **Voir dans Session**: Allez à l'onglet "Session" pour voir votre set enregistré

## ✅ Ça marche!

Vous pouvez maintenant:
- Logger vos sets (Log tab)
- Voir le résumé du jour (Session tab)
- Consulter l'historique (History tab)
- Configurer vos préférences (Settings tab)

## 🔍 Troubleshooting

### "Cannot reach Supabase"
- Vérifier que `NEXT_PUBLIC_SUPABASE_URL` est correct dans `.env.local`
- Vérifier la clé `ANON_KEY` est copiée correctement (long texte)
- Assurer que le projet Supabase est actif

### "User already exists"
- Cette email est déjà enregistrée
- Utiliser une autre adresse email

### "Not authenticated"
- Rafraîchir la page (F5)
- Vérifier que vous êtes connecté
- Clair le cache du navigateur si problème persiste

### "Tables not found"
- Allez dans Supabase → SQL Editor
- Vérifier que les tables existent (exécuter le migration script)
- Tous les tables doivent apparaître dans Table Editor

## 📝 Variables d'Environnement

Créer un fichier `.env.local` à la racine avec:

```env
# ✅ REQUIS - obtenir depuis Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# OPTIONNEL - pour les opérations backend (non utilisé en Palier 0-1)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **NE PAS** committer `.env.local` à git!

## 🛠️ Commandes Utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Vérifier la compilation TypeScript
npm run build

# Linter le code
npm run lint

# Vérifier les erreurs
npm run type-check
```

## 📱 Tester sur Mobile

### Chrome DevTools
1. Ouvrir DevTools (F12)
2. Cliquer l'icône "Toggle device toolbar" (Ctrl+Shift+M)
3. Sélectionner un mobile device (ex: iPhone 13)
4. Rafraîchir la page

### Mobile Réel
1. Trouver votre IP locale: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. Sur mobile, aller à `http://YOUR_IP:3000`
3. Naviguer pour tester l'app

## 🔐 Security Notes

- `.env.local` **jamais** committé à git
- `NEXT_PUBLIC_SUPABASE_URL` et `ANON_KEY` sont publiques (ok - utilisés côté client)
- `SERVICE_ROLE_KEY` doit rester secret (côté serveur seulement)
- Toutes les données protégées par RLS policies

## 📚 Documentation Complète

- [README.md](./README.md) - Vue d'ensemble complète
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Guide détaillé Supabase
- [TESTING.md](./TESTING.md) - Checklist de test complet

## 🚀 Prochaines Étapes

1. **Customiser**: Modifier colors, fonts, labels selon vos préférences
2. **Déployer**: Pusher sur GitHub et déployer sur Vercel
3. **Tester**: Utiliser la checklist dans [TESTING.md](./TESTING.md)
4. **Collecter du feedback**: Tester avec d'autres utilisateurs

## 💬 Support

Consultez les docs:
- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Happy training! 💪**
