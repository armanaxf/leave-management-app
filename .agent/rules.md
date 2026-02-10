# Project Rules

## Design & UI Standards

When building UI components for this project:

1. **Always reference design skills** before implementing any visual components
2. **Follow accessibility guidelines** - WCAG 2.2 Level AA minimum
3. **Apply React best practices** from the react-best-practices skill
4. **Avoid generic AI aesthetics** - no Inter, Roboto, purple gradients, or cookie-cutter patterns

## Technology Stack

- React 19 + TypeScript
- shadcn/ui + Tailwind CSS 4
- Lucide React for icons (never use emojis as icons)

## PAC CLI & Data

- [pac-cli.md](pac-cli.md) — PAC CLI reference (path, auth, commands)
- [code-apps-dataverse.md](code-apps-dataverse.md) — Dataverse CRUD via generated services (getAll, create, update, delete, IGetAllOptions)
- [code-apps-data-sources.md](code-apps-data-sources.md) — Adding/managing data sources, connectors, Office 365 Users, build & deploy

## Pre-Delivery Checklist

Before delivering any UI code, verify:
- [ ] Visible focus states on all interactive elements
- [ ] Proper color contrast (4.5:1 minimum)
- [ ] Cursor pointer on clickable elements
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
