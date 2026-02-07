# SendMyLove v2 Deployment Checklist

## What's Built

- **Database**: 5 new tables + indexes + 90 prompt templates (already migrated)
- **Worker API**: 12 new v2 endpoints (profile, prompts, compose, polish, logs, history, favorites)
- **Cron**: Updated to send daily prompt emails instead of pre-written messages
- **Onboarding**: 4-step relationship profile flow
- **Dashboard**: Fill-in-the-blank message builder with AI polish
- **Landing page**: Rewritten with v2 positioning and interactive demo

---

## Deployment Steps

### Step 1: Set the Anthropic API Key

Run this in your terminal (not D1 console):

```
wrangler secret put ANTHROPIC_API_KEY --env production
```

Paste your Anthropic API key when prompted. This powers the "Help me say it better" AI polish feature.

### Step 2: Deploy the Worker

```
cd ~/new-project/app-lovenotes/worker
wrangler deploy --env production
```

This deploys the updated API with all v2 endpoints + the new cron handler.

### Step 3: Deploy the Frontend

```
cd ~/new-project/app-lovenotes
git add -A
git commit -m "feat: v2 pivot — prompt-based message builder"
git push
```

Cloudflare Pages auto-deploys on push to main.

### Step 4: Verify

1. Visit https://sendmylove.app — should show new landing page
2. Sign up as test user — should go to onboarding after Stripe
3. Complete onboarding — should redirect to dashboard with a prompt
4. Fill in the blank, try AI polish, copy message
5. Check D1 console: `SELECT * FROM daily_prompts LIMIT 5;`

---

## What Still Needs Building (Future)

- [ ] 210 more prompt templates (currently 90 of 300 target)
- [ ] Occasion-specific prompts (anniversary, birthday, Valentine's, Mother's Day, Christmas)
- [ ] Update existing subscribers' `tier` column based on Stripe status
- [ ] Stripe webhook to set `tier = 'paid'` on checkout completion
