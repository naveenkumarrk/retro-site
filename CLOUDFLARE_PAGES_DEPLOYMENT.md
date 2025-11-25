# Cloudflare Pages Deployment Guide

This guide will help you deploy your SvelteKit application to Cloudflare Pages with SSR support.

## Prerequisites

- ✅ Cloudflare account
- ✅ Wrangler CLI installed (already in your `package.json`)
- ✅ Node.js 18+ installed

## Configuration Status

Your project is already configured for Cloudflare Pages:

1. **Adapter**: `@sveltejs/adapter-cloudflare` ✅
2. **Wrangler Config**: `wrangler.jsonc` with correct output directory ✅
3. **SSR**: Enabled by default ✅

## Deployment Options

### Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. **Connect your repository:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** → **Create a project**
   - Connect your Git repository (GitHub, GitLab, or Bitbucket)

2. **Build Settings:**
   - **Framework preset**: SvelteKit
   - **Build command**: `npm run build`
   - **Build output directory**: `.svelte-kit/cloudflare`
   - **Root directory**: `retro-site` (if your repo is at the root, leave blank)

3. **Environment Variables:**
   Add these in the Cloudflare Pages dashboard under **Settings** → **Environment variables**:
   ```
   PUBLIC_API_URL=https://gateway-worker.111naveenkumarrk.workers.dev
   ```
   Or any other environment variables your app needs.

4. **Deploy:**
   - Cloudflare will automatically build and deploy on every push to your main branch
   - You can also trigger manual deployments

### Option 2: Deploy via Wrangler CLI

1. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Build and Deploy:**
   ```bash
   npm run deploy
   ```
   This runs: `npm run build && wrangler pages deploy`

3. **Or deploy manually:**
   ```bash
   npm run build
   npx wrangler pages deploy .svelte-kit/cloudflare --project-name=retro-site
   ```

## Important Configuration Files

### `svelte.config.js`
```javascript
import adapter from '@sveltejs/adapter-cloudflare';
// ✅ Correct adapter for Cloudflare Pages with SSR
```

### `wrangler.jsonc`
```jsonc
{
  "pages_build_output_dir": ".svelte-kit/cloudflare",
  // ✅ This tells Wrangler where to find the build output
}
```

## Environment Variables

### Local Development
Create a `.env` file (not committed to git):
```bash
PUBLIC_API_URL=https://gateway-worker.111naveenkumarrk.workers.dev
```

### Cloudflare Pages
Add environment variables in the dashboard:
- **Settings** → **Environment variables**
- Add `PUBLIC_API_URL` with your API URL
- Variables prefixed with `PUBLIC_` are available to both server and client

## Build Verification

Before deploying, verify your build works locally:

```bash
# Clean build cache
rm -rf .svelte-kit node_modules/.vite

# Build the project
npm run build

# Preview locally (optional)
npm run preview
```

## Troubleshooting

### Issue: Build fails with "adapter-static" error
**Solution**: Make sure `svelte.config.js` uses `@sveltejs/adapter-cloudflare`, not `adapter-static`. Clean the build cache:
```bash
rm -rf .svelte-kit node_modules/.vite
npm run build
```

### Issue: Routes not working after deployment
**Solution**: Ensure SSR is enabled (it is by default). Dynamic routes work automatically with the Cloudflare adapter.

### Issue: Environment variables not working
**Solution**: 
- Use `PUBLIC_` prefix for client-accessible variables
- Add them in Cloudflare Pages dashboard under Settings → Environment variables
- Redeploy after adding variables

### Issue: API calls failing
**Solution**: 
- Check CORS settings on your API
- Verify `PUBLIC_API_URL` is set correctly
- Check Cloudflare Pages function logs in the dashboard

## Custom Domain

1. Go to your project in Cloudflare Pages
2. Navigate to **Custom domains**
3. Add your domain
4. Follow DNS configuration instructions

## Monitoring

- **Analytics**: Available in Cloudflare Pages dashboard
- **Logs**: View function logs in the dashboard
- **Performance**: Cloudflare automatically optimizes your site

## Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [SvelteKit Cloudflare Adapter](https://kit.svelte.dev/docs/adapter-cloudflare)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

## Quick Deploy Checklist

- [ ] Clean build cache: `rm -rf .svelte-kit node_modules/.vite`
- [ ] Verify build works: `npm run build`
- [ ] Set environment variables in Cloudflare dashboard
- [ ] Deploy via dashboard or CLI: `npm run deploy`
- [ ] Test deployed site
- [ ] Configure custom domain (optional)

