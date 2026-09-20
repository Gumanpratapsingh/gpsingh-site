# gpsingh-site

Personal site and project register. Static HTML, no dependencies, no build
framework — `data/*.json` in, `dist/` out.

## Everyday use

Adding a project is a Claude Code skill. From any directory:

```
/add-project
```

It reads the project you are in, writes the entry, rebuilds, and pushes.

## By hand

```bash
npm run preview   # build + serve on http://localhost:4321, rebuilds on save
npm run build     # production build into dist/
npm run add -- --json '{"title":"Thing","blurb":"What it does."}'
```

## Layout

| Path | What it is |
|---|---|
| `data/profile.json` | Name, bio, skills, job history, links, email |
| `data/projects.json` | The project register — source of truth |
| `site.config.json` | Which theme ships, and the output directory |
| `src/templates.mjs` | Page markup. Every theme shares it |
| `assets/css/base.css` | Layout and the CSS-variable contract |
| `assets/css/theme-*.css` | The nine looks |
| `scripts/build.mjs` | Renders `dist/` |
| `scripts/add-project.mjs` | Upserts one project into `data/projects.json` |
| `scripts/serve.mjs` | Local preview server |

`dist/` is generated and git-ignored. Never edit it by hand.

## Themes

Set `theme` in `site.config.json` to one of:

`atomic` · `gazette` · `punchcard` · `pulp` · `mcm` · `blueprint` · `swiss` ·
`eames` · `bass`

To compare them, run `npm run preview` — the local build adds a theme switcher
bar that is never part of a production build.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages.

One-time setup on GitHub: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

For a custom domain, add a `CNAME` file at the repo root containing the
domain; the build copies it into `dist/`.
