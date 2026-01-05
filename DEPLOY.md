# CTC App - Clean Deployment

## Quick Deploy to Vercel

1. Go to: https://vercel.com/new
2. Import: `bgillis99-pixel/ctc-app-clean`
3. Add Environment Variable:
   - Name: `API_KEY`
   - Value: (paste your key from https://aistudio.google.com/app/apikey)
4. Deploy

## Quick Deploy to Firebase

```bash
cd ~/Downloads/ctc-app
npm run build
firebase deploy
```

## URLs

- **Vercel**: Will be at `ctc-app-clean.vercel.app` or custom domain
- **Firebase**: https://carbcleantruckcheck-dr-g.web.app (LIVE)

## Get Your API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste into Vercel env vars or `.env.local`

## What's Included

- VIN Scanner (camera + manual entry)
- AI Chat (compliance questions)
- Fleet Garage (track your trucks)
- Admin Dashboard
- Offline fallback answers
- NHTSA VIN decode (free federal API)

## Files

```
ctc-app/
├── App.tsx              # Main app
├── components/          # UI components
├── services/
│   ├── geminiService.ts # All AI (Gemini)
│   ├── firebase.ts      # Auth + DB (mock mode works)
│   ├── nhtsa.ts         # Free VIN lookup
│   └── compliance.ts    # CARB check (stub)
├── package.json
├── vite.config.ts
├── vercel.json
└── firebase.json
```
