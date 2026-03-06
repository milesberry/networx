# Colophon

Networx was conceived and built during a single conversation between Prof Miles Berry and [Claude Sonnet 4.6](https://www.anthropic.com/claude) (Anthropic) in March 2025, using [Claude Code](https://claude.ai/code) as the agentic coding environment.

## Origin

The project started with a simple prompt: build a browser-based network emulator for teaching GCSE and A Level computer science networking. The OCR specifications for J277 and H446 were provided as context, and Claude extracted the relevant networking content — hardware, protocols, topologies, addressing, security — to guide what the tool should simulate.

## How it was built

The entire codebase — React components, simulation engine, terminal, presets, GitHub Actions workflow — was written by Claude in response to a series of conversational prompts. No code was written by hand. The process was iterative:

1. **Scaffold** — Vite + React + TypeScript project structure, Tailwind, React Flow
2. **Types and store** — Zustand store, TypeScript interfaces for all device and network data
3. **Simulation engine** — BFS path-finding, ping/traceroute RTT simulation, terminal command dispatcher
4. **Components** — device nodes, palette, config panel, terminal, concept cards
5. **Refinements** (in response to feedback):
   - Drag-and-drop from device palette
   - Internet/cloud node for WAN representation
   - localStorage auto-save + preset scenarios
   - JSON export/import
   - Edge deletion (custom React Flow edge with × button)
   - Hostname resolution — `ping google.com` routes through the internet node
   - MAC table learning — switches populate their tables as traffic flows through them

Each change was verified by Claude taking screenshots of the running preview server and checking for console errors.

## Tools used

- **Claude Code** — agentic coding loop (file reads/writes, bash, browser preview)
- **Claude Sonnet 4.6** — the underlying model
- **Vite preview server** — live preview during development
- **GitHub Actions** — automated deployment to GitHub Pages

## Human contributions

Miles:
- Defined the requirements and curriculum context
- Chose React Flow as the rendering library
- Provided the OCR specifications for context
- Gave feedback at each stage ("Do the MAC tables work?", "ping google.com should work", etc.)
- Reviewed screenshots and approved or redirected each change

The project is an example of AI-assisted software development where a non-trivial, fully functional application was produced through conversation rather than direct coding.
