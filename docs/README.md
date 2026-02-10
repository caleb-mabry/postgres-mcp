# Postgres MCP Server Documentation

This directory contains the Docusaurus documentation site for the Postgres MCP Server project.

The documentation is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment to GitHub Pages

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. 

**Live URL**: https://caleb-mabry.github.io/postgres-mcp/

The deployment is handled by the GitHub Actions workflow at `.github/workflows/deploy-docs.yml`.

### Manual Deployment

If needed, you can manually deploy:

```bash
npm run deploy
```

## Structure

```
docs/
├── docs/                      # Documentation pages
│   ├── intro.md              # Getting started page
│   ├── setup/                # Setup guides
│   │   ├── claude-desktop.md
│   │   └── http-server.md
│   └── guides/               # Usage guides
│       └── usage-modes.md
├── src/                      # React components
│   ├── components/           # Custom React components
│   ├── css/                  # Custom CSS
│   └── pages/                # Custom pages (homepage)
├── static/                   # Static assets (images, etc.)
├── docusaurus.config.ts      # Site configuration
└── sidebars.ts              # Sidebar configuration
```

## Adding Documentation

1. Create a new markdown file in `docs/docs/` or a subdirectory
2. Add frontmatter at the top:
   ```markdown
   ---
   sidebar_position: 1
   ---
   
   # Your Page Title
   ```
3. The sidebar will automatically update based on the file structure

## Learn More

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Features](https://docusaurus.io/docs/markdown-features)
- [Deployment Guide](https://docusaurus.io/docs/deployment)

