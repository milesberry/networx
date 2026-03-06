# Networx

A browser-based network emulator for teaching computer networking concepts at GCSE and A Level (OCR specifications J277 and H446).

**[Live demo →](https://milesberry.net/networx)**

## What it does

Networx lets you build virtual networks by dragging hardware components onto a canvas and connecting them with wired or wireless links. Once built, you can:

- **Run terminal commands** on PCs, laptops, and servers — `ping`, `traceroute`, `ipconfig`, `nslookup`, `curl`, `ssh`, and more
- **Ping domain names** — `ping google.com` resolves via DNS and routes through the internet node
- **Inspect switch MAC tables** — tables populate as traffic flows, showing which MAC address was learned on which port
- **Configure routers** — add static routing table entries
- **Set firewall rules** — allow/deny by protocol, port, and IP
- **Configure wireless access points** — SSID, WPA key, 2.4/5 GHz band
- **Load preset scenarios** — five built-in topologies covering key exam topics
- **Save and share** — export your network as a `.json` file and import it elsewhere

## Preset scenarios

| Scenario | Covers |
|---|---|
| Star Topology (LAN) | Switch MAC tables, LAN addressing, ping |
| Home Network | NAT, router, WAP, wired + wireless clients |
| School Network | Firewall rules, network segmentation, servers |
| Client-Server Model | DNS resolution, HTTP, `nslookup`, `curl` |
| Mesh / WAN Topology | Redundant paths, inter-site routing, internet backbone |

## Curriculum links

- **OCR GCSE Computer Science J277** — Networks (1.3): protocols, hardware, topologies, internet, security
- **OCR A Level Computer Science H446** — Communication and networking (1.3): IP, TCP/IP stack, packet switching, hardware, client-server

Spec links:
- [GCSE J277](https://www.ocr.org.uk/Images/558027-specification-gcse-computer-science-j277.pdf)
- [A Level H446](https://www.ocr.org.uk/images/170844-specification-accredited-a-level-gce-computer-science-h446.pdf)

## Running locally

```bash
npm install
npm run dev
```

Requires Node 18+.

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Flow (@xyflow/react)](https://reactflow.dev/) — canvas and graph rendering
- [Zustand](https://zustand-demo.pmnd.rs/) — state management
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Lucide React](https://lucide.dev/) — icons
- [Vite](https://vitejs.dev/) — build tool

## License

MIT — see [LICENSE](LICENSE).
