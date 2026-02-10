---
sidebar_position: 1
---

# GitHub Pages Deployment

This documentation site is automatically deployed to GitHub Pages using GitHub Actions.

## Live Site

The documentation is available at: **https://caleb-mabry.github.io/postgres-mcp/**

## Automatic Deployment

Changes to the documentation are automatically deployed when:
- Code is pushed to the `main` branch
- Files in the `docs/` directory are modified
- The `.github/workflows/deploy-docs.yml` file is updated

The deployment workflow:
1. Checks out the repository
2. Installs Node.js and dependencies
3. Builds the Docusaurus site
4. Deploys to GitHub Pages

## Manual Deployment

If you need to manually deploy:

```bash
cd docs
npm install
npm run build
npm run deploy
```

## GitHub Pages Configuration

To enable GitHub Pages for the first time:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The site will be automatically deployed on the next push to main

## Deployment Workflow

The deployment is configured in [`.github/workflows/deploy-docs.yml`](https://github.com/caleb-mabry/postgres-mcp/blob/main/.github/workflows/deploy-docs.yml):

```yaml
name: Deploy Documentation to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - 'docs/**'
      - '.github/workflows/deploy-docs.yml'
  workflow_dispatch:
```

## Configuration

The site configuration in [`docs/docusaurus.config.ts`](https://github.com/caleb-mabry/postgres-mcp/blob/main/docs/docusaurus.config.ts):

```typescript
{
  url: 'https://caleb-mabry.github.io',
  baseUrl: '/postgres-mcp/',
  organizationName: 'caleb-mabry',
  projectName: 'postgres-mcp',
}
```

## Troubleshooting

### Deployment Fails

1. Check the Actions tab in GitHub for error messages
2. Verify GitHub Pages is enabled in repository settings
3. Ensure the workflow has proper permissions

### Site Not Updating

1. Check if the workflow ran successfully in the Actions tab
2. Clear your browser cache
3. Wait a few minutes for GitHub's CDN to update

### 404 Errors

1. Verify the `baseUrl` in `docusaurus.config.ts` matches your repository name
2. Check that all internal links use relative paths
3. Rebuild the site locally to test

## Local Testing

Test the production build locally before deploying:

```bash
cd docs
npm run build
npm run serve
```

This will serve the production build at http://localhost:3000
