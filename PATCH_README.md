# Network Sim — Redesign Patch

Drop these files into `network-sim/src/` to replace the existing ones.

## Files to copy

```
network-sim-patched/src/index.css                                  → NEW file at network-sim/src/index.css
network-sim-patched/src/main.tsx                                   → network-sim/src/main.tsx          (adds `import './index.css'`)
network-sim-patched/src/App.tsx                                    → network-sim/src/App.tsx           (adds topbar + mobile sheet)
network-sim-patched/src/components/UI/Sidebar.tsx                  → network-sim/src/components/UI/Sidebar.tsx
network-sim-patched/src/components/Canvas/NetworkCanvas.tsx        → network-sim/src/components/Canvas/NetworkCanvas.tsx
network-sim-patched/src/components/Canvas/DeviceNode.tsx           → network-sim/src/components/Canvas/DeviceNode.tsx
network-sim-patched/src/components/Terminal/TerminalWindow.tsx     → network-sim/src/components/Terminal/TerminalWindow.tsx
```

`TerminalManager.tsx`, `store/*`, `core/*`, `types/*` and `utils/*` are **unchanged** — visual layer only.

## What changed

- **Theme system** (`index.css`) — Vector Gains Sleek palette, Manrope + JetBrains Mono, single source of truth for colors/spacing.
- **Topbar** — new. Brand mark + lab name + device-count pill on desktop; hamburger + `+` FAB-style button on mobile.
- **Sidebar** — device chips with category accent stripes (router red / switch blue / PC green), live topology readout (counts pulled from store), color legend, redesigned Export/Import buttons. On mobile it collapses into a bottom-sheet (`SidebarSheet`).
- **DeviceNode** — geometric glyphs `◉ ▦ ▭` replace emoji, 3px top accent border per category, IP-ready layout.
- **NetworkCanvas** — `#08080b` background, dot-grid pattern, themed React Flow controls, idle cables fade to `#3a3a45`, active path goes green `#7dd44a`.
- **TerminalWindow** — macOS-style traffic-light header, mode pill in accent blue, themed prompt colors. On screens ≤720px it flips to fullscreen with a quick-key strip (`enable`, `config t`, `show ip int br`, ↑ history, ↵ enter) above the soft keyboard.

## Logic preserved

All Zustand stores, CLI parser, ping/trace logic, drag-drop wiring, edge connection logic, and command history navigation are byte-identical to the original implementation.
