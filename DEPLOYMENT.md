# 🚀 Deployment Guide

Guide de déploiement de Street Workout Tracker en production.

## Option 1: Vercel (Recommandé ⭐)

Vercel est l'hébergeur officiel de Next.js - déploiement en 1 clic!

### Étape 1: Préparer Git
```bash
# Initialiser git si pas déjà fait
git init
git add .
git commit -m "Initial commit: Street Workout Tracker"

# Pusher sur GitHub
git remote add origin https://github.com/your-username/street-app.git
git branch -M main
git push -u origin main
```

### Étape 2: Connecter à Vercel
1. Aller à [vercel.com](https://vercel.com)
2. Sign in avec GitHub
3. Cliquer "Add New..." → "Project"
4. Sélectionner votre repo `street-app`
5. Cliquer "Import"

### Étape 3: Configurer les Variables
1. Dans Vercel, aller à "Settings" → "Environment Variables"
2. Ajouter:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
   ```
3. Cliquer "Save"

### Étape 4: Deploy
1. Cliquer "Deploy"
2. Attendre le build (2-3 min)
3. ✅ Votre app est en ligne!

URL: `https://street-app.vercel.app` (ou votre domaine custom)

### Déploiements Futurs
Tous les pushes sur `main` déploieront automatiquement!

## Option 2: Railway

Alternative simple à Vercel.

### Setup
1. Aller à [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Sélectionner votre repo
4. Ajouter les variables d'env:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

## Option 3: Netlify

Netlify fonctionne aussi bien que Vercel.

### Setup
1. Aller à [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Connecter GitHub
4. Sélectionner votre repo
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Ajouter les variables d'env
7. Deploy

## Option 4: Docker (Production Avancée)

Pour un déploiement sur votre propre serveur.

### Créer un Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

### Builder et Runner
```bash
# Builder l'image
docker build -t street-app:latest .

# Tester localement
docker run -e NEXT_PUBLIC_SUPABASE_URL=... \
           -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
           -p 3000:3000 \
           street-app:latest

# Pusher vers Docker Hub (optionnel)
docker tag street-app:latest your-username/street-app:latest
docker push your-username/street-app:latest
```

## Option 5: Self-hosted (AWS, DigitalOcean, etc.)

### AWS EC2
```bash
# Sur votre instance EC2
sudo apt update
sudo apt install nodejs npm

# Clone le repo
git clone https://github.com/your-username/street-app.git
cd street-app

# Install & build
npm install
npm run build

# Installer PM2 pour auto-restart
npm install -g pm2
pm2 start npm --name "street-app" -- start
pm2 startup
pm2 save
```

### DigitalOcean App Platform
1. Connecter votre GitHub repo
2. Auto-deploy on push
3. Ajouter les env variables
4. Deploy!

## Environment Variables pour Production

⚠️ **Important**: Ne JAMAIS committer `.env.local`!

Ajouter à votre `.gitignore`:
```
.env.local
.env.*.local
```

Pour chaque plateforme, ajouter:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Domain Custom

### Vercel
1. Aller à Settings → Domains
2. Ajouter votre domaine
3. Suivre les instructions DNS

### Netlify
1. Domain settings
2. Add custom domain
3. Configurer DNS

## SSL/HTTPS

Automatique sur:
- ✅ Vercel
- ✅ Netlify
- ✅ Railway
- ✅ AWS (certbot)
- ✅ DigitalOcean

## Performance Optimization

### Image Optimization
- Next.js optimise automatiquement les images
- CDN inclus (Vercel, Netlify)

### Build Size
```bash
# Voir la taille du build
npm run build

# Analyser les bundles
npm install --save-dev @next/bundle-analyzer
```

## Monitoring

### Vercel Analytics
- Automatique sur Vercel
- Voir le dashboard pour les metrics

### Sentry (Error Tracking) - Optionnel
```bash
npm install @sentry/nextjs
```

## Database Backup

Supabase fait automatiquement des backups:
- ✅ Daily backups
- ✅ Point-in-time recovery
- ✅ Read replicas disponibles

Pour les exports manuels:
1. Supabase Dashboard → Database
2. Cliquer "Export"
3. Sauvegarder le `.sql` file

## Scaling

À mesure que votre app grandit:

### Database
- Verifier les indexes (Supabase)
- Ajouter read replicas si besoin
- Optimiser les queries

### Backend
- Ajouter du caching
- Implementer des rate limits
- Utiliser CDN pour assets

### Frontend
- Code splitting automatique avec Next.js
- Image optimization
- Lazy loading

## Security Checklist

- [ ] HTTPS enabled (automatique)
- [ ] Environment variables set (pas en git)
- [ ] Supabase RLS enabled
- [ ] CORS configured si besoin
- [ ] Rate limiting implementé
- [ ] Input validation en place
- [ ] Secrets management secure

## Rollback

### Vercel
- Cliquer sur un deployment antérieur
- Cliquer "Redeploy"

### Git-based
```bash
git revert <commit-hash>
git push origin main
# Redéploiement automatique
```

## CI/CD (Avancé)

GitHub Actions peut auto-deploy:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Troubleshooting Deployment

### Build fails
- Vérifier les logs de build
- Vérifier les env variables
- Tester localement avec `npm run build`

### 404 on routes
- Vérifier que `dynamic = 'force-dynamic'` est set
- Vérifier la structure des fichiers

### Environment variables not working
- Redéployer après ajouter les vars
- Vérifier la syntaxe (pas de spaces)
- Préfixe `NEXT_PUBLIC_` pour les variables client

### Supabase connection fails
- Vérifier les URLs
- Vérifier les clés copiées correctement
- Vérifier les règles de pare-feu Supabase

## Monitoring en Production

### Health Checks
- Vérifier régulièrement que l'app est up
- Utiliser un service comme [healthchecks.io](https://healthchecks.io)

### Error Tracking
- Ajouter Sentry pour les erreurs JS
- Monitorer les logs Supabase

### Analytics
- Vercel fournit des analytics
- Google Analytics optionnel

---

**Votre app est maintenant en production! 🎉**

Pour plus d'infos: [Vercel Docs](https://vercel.com/docs) | [Supabase Docs](https://supabase.com/docs)
