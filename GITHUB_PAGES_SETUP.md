# 🚀 Enabling GitHub Pages - Quick Guide

Follow these steps to make your documentation site live at https://caleb-mabry.github.io/postgres-mcp/

## Step 1: Push to GitHub

Make sure all changes are committed and pushed to the `main` branch:

```bash
git add .
git commit -m "Add Docusaurus documentation site"
git push origin main
```

## Step 2: Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/caleb-mabry/postgres-mcp

2. Click on **Settings** (top navigation)

3. In the left sidebar, click **Pages**

4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**
   - (No branch selection needed - the workflow handles this)

5. Click **Save** if prompted

## Step 3: Verify Deployment

1. Go to the **Actions** tab in your repository

2. You should see a workflow run called "Deploy Documentation to GitHub Pages"

3. Wait for it to complete (usually 1-2 minutes)

4. Once successful, your site will be live at:
   **https://caleb-mabry.github.io/postgres-mcp/**

## Step 4: Verify It's Working

Visit https://caleb-mabry.github.io/postgres-mcp/ in your browser

You should see:
- ✅ Homepage with project title
- ✅ "Get Started" button
- ✅ Three feature boxes
- ✅ Working navigation to docs

## Troubleshooting

### Workflow Didn't Run

**Solution**: Manually trigger the workflow
1. Go to **Actions** tab
2. Click "Deploy Documentation to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select `main` branch
5. Click "Run workflow"

### Site Shows 404

**Possible causes:**
- GitHub Pages not enabled (see Step 2)
- Workflow hasn't completed yet (check Actions tab)
- Browser cache (try incognito/private window)

**Solution:**
1. Verify Pages is enabled with source "GitHub Actions"
2. Check workflow completed successfully in Actions tab
3. Wait 1-2 minutes for GitHub's CDN to update
4. Try clearing browser cache or using incognito mode

### Workflow Fails

**Check the logs:**
1. Go to Actions tab
2. Click on the failed workflow run
3. Read the error message

**Common issues:**
- Build errors: Check the build step logs
- Permission errors: Ensure workflow has Pages write permission (configured in workflow)

### Site Looks Broken

**Possible causes:**
- CSS not loading
- Images not loading
- Links not working

**Solution:**
1. Check browser console for 404 errors
2. Verify `baseUrl` in `docs/docusaurus.config.ts` is `/postgres-mcp/`
3. Rebuild: `cd docs && npm run build`
4. If still broken, run local test: `npm run serve`

## Manual Deployment (Alternative)

If GitHub Actions deployment doesn't work, you can deploy manually:

```bash
cd docs
npm install
npm run build

# Configure git for deployment
git config user.name "Your Name"
git config user.email "your-email@example.com"

# Deploy to gh-pages branch
GIT_USER=caleb-mabry npm run deploy
```

## Verifying Configuration

### Repository Settings Should Show:

**Pages Settings:**
- ✅ Source: GitHub Actions
- ✅ Branch: Managed by workflow
- ✅ URL: https://caleb-mabry.github.io/postgres-mcp/

**Workflow Permissions:**
- ✅ Settings → Actions → General → Workflow permissions
- Should have "Read and write permissions"

## Next Steps After Deployment

1. **Update README badges**: Add documentation badge (already done!)
2. **Share the link**: Tell users about the new docs site
3. **Add more docs**: Create new markdown files in `docs/docs/`
4. **Customize**: Update logo, favicon, colors

## Automatic Updates

After initial setup, documentation will automatically update when you:
1. Edit files in `docs/` directory
2. Commit and push to `main` branch
3. Wait ~2 minutes for deployment

No manual deployment needed after initial setup! 🎉

## Need Help?

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Docusaurus Deployment**: https://docusaurus.io/docs/deployment
- **GitHub Actions Logs**: Check Actions tab for detailed error messages
- **Local Testing**: Always run `npm run build` locally before pushing

---

**Expected Timeline:**
- Push to main: ~10 seconds
- Workflow starts: ~30 seconds
- Build completes: ~1-2 minutes
- Site live: Immediately after build
- CDN propagation: ~1-2 minutes

**Total time**: ~3-5 minutes from push to live! ⚡
