# CoachingOS Design System & Visual Tokens

**Design Philosophy:** Modern, Calm, High-Density, Trustworthy, Fast  
**Inspiration:** Stripe Dashboard + Linear + Vercel UI

---

## 1. Color Tokens

### Surfaces & Backgrounds
- `bg-slate-950`: Global application canvas (`#020617`)
- `bg-navy-950`: Sidebar and primary structural navigation (`#050b14`)
- `bg-navy-900`: Top navigation bar (`#0f172a`)
- `bg-slate-900`: Card surface and modal bodies (`#0f172a`)
- `bg-slate-800`: Interactive surface elements, table headers, hover states (`#1e293b`)

### Accent Tokens
- **Primary / Brand Action:** Emerald (`emerald-500` / `emerald-600` / `emerald-400`)
  - Used for primary CTA buttons, positive attendance, paid statuses, and verified badges.
- **Academic & Content Accent:** Sky Blue (`sky-400` / `sky-500`)
  - Used for academic classes, syllabus tags, and timetable occurrences.
- **Warning & Attention Accent:** Amber (`amber-400` / `amber-500`)
  - Used for late attendance, pending dues, and intervention reviews.
- **Risk & Alert Accent:** Rose (`rose-400` / `rose-500`)
  - Used for absent states, overdue fee defaulters, and dropout risk alerts.
- **Pipeline & Creative Accent:** Purple (`purple-400` / `purple-500`)
  - Used for CRM marketing leads and AI worksheet generation.

### Typography & Fonts
- **Interface Font:** Inter / System UI sans-serif (`font-sans`)
- **Data & Number Font:** JetBrains Mono / SF Mono / Consolas (`font-mono`)
  - Mandatory for roll numbers, currency figures (`₹1,50,000`), timestamps, and LaTeX formulas.
- **Hierarchies:**
  - Page Title: `text-2xl font-bold tracking-tight text-white`
  - Section Title: `text-sm font-bold text-white tracking-tight`
  - Body Text: `text-xs text-slate-300`
  - Micro / Meta: `text-[11px] text-slate-400 font-medium`
  - Badge / Status: `text-[10px] font-mono font-bold uppercase tracking-wider`

### Spacing & Elevation
- **Spacing Grid:** 4px base increments (e.g. `p-3`, `p-4`, `p-5`, `p-6`, `gap-3`, `gap-4`).
- **Corner Radii:**
  - Buttons & Inputs: `rounded-lg` (8px)
  - Cards & Small Containers: `rounded-xl` (12px)
  - Modals & Hero Sections: `rounded-2xl` (16px)
- **Borders:** Subtle `border border-slate-800` (1px) with high-contrast active focus rings (`focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500`).
- **Shadows:** Restrained elevation (`shadow-lg`, `shadow-xl`, `shadow-2xl` with `shadow-emerald-900/20` glow).
