import type { NetNode, NetEdge, TerminalLine, MacEntry, PacketAnim, Level, NodeData } from '../types'
import { findPath, nodeByIp, nodeById, simulatePingRtt, subnetToCidr } from './network'

export interface TermContext {
  selfId: string
  nodes: NetNode[]
  edges: NetEdge[]
  level?: Level
  learnMac?: (switchId: string, entry: MacEntry) => void
  dispatchPackets?: (packets: PacketAnim[]) => void
  updateNodeData?: (id: string, patch: Partial<NodeData>) => void
}

// ── Packet animation helpers ──────────────────────────────────────────────────

const HOP_MS = 500

export function edgesOnPath(nodeIds: string[], edges: NetEdge[]): string[] {
  return nodeIds.slice(0, -1).flatMap((nid, i) => {
    const next = nodeIds[i + 1]
    const e = edges.find(
      (e) => (e.source === nid && e.target === next) || (e.source === next && e.target === nid),
    )
    return e ? [e.id] : []
  })
}

export function makePackets(
  nodeIds: string[],
  allEdges: NetEdge[],
  protocol: PacketAnim['protocol'],
  label: string,
  withReply = false,
): PacketAnim[] {
  const eids = edgesOnPath(nodeIds, allEdges)
  const N = eids.length
  const ts = Date.now()
  const forward: PacketAnim[] = eids.map((edgeId, i) => ({
    id: `pkt-${ts}-f${i}`,
    edgeId, protocol, label,
    delayMs: i * HOP_MS,
    durationMs: HOP_MS,
  }))
  if (!withReply) return forward
  const replyLabel = protocol === 'ICMP' ? 'reply' : `${label} ↩`
  const reply: PacketAnim[] = [...eids].reverse().map((edgeId, i) => ({
    id: `pkt-${ts}-r${i}`,
    edgeId, protocol,
    label: replyLabel,
    delayMs: (N + i) * HOP_MS,
    durationMs: HOP_MS,
    reverse: true,
  }))
  return [...forward, ...reply]
}

// When a packet path traverses a switch, learn MAC→port mappings
function populateMacTables(path: string[], ctx: TermContext): void {
  if (!ctx.learnMac) return
  for (let i = 0; i < path.length; i++) {
    const node = nodeById(path[i], ctx.nodes)
    if (!node || node.data.deviceType !== 'switch') continue  // hubs don't learn MACs

    // Assign port numbers by sorting the switch's connected edges
    const switchEdges = ctx.edges
      .filter((e) => e.source === path[i] || e.target === path[i])
      .sort((a, b) => a.id.localeCompare(b.id))

    function portFor(neighbourId: string): string {
      const idx = switchEdges.findIndex(
        (e) => (e.source === path[i] ? e.target : e.source) === neighbourId,
      )
      return `Gi0/${idx >= 0 ? idx + 1 : 1}`
    }

    // Learn MAC of the node the packet arrived from
    if (i > 0) {
      const prev = nodeById(path[i - 1], ctx.nodes)
      if (prev?.data.mac) {
        ctx.learnMac(path[i], { mac: prev.data.mac, port: portFor(path[i - 1]), vlan: 1 })
      }
    }
    // Learn MAC of the next-hop node (from the return packet)
    if (i < path.length - 1) {
      const next = nodeById(path[i + 1], ctx.nodes)
      if (next?.data.mac) {
        ctx.learnMac(path[i], { mac: next.data.mac, port: portFor(path[i + 1]), vlan: 1 })
      }
    }
  }
}

type Lines = TerminalLine[]

function out(text: string): TerminalLine { return { type: 'output', text } }
function err(text: string): TerminalLine { return { type: 'error', text } }
function info(text: string): TerminalLine { return { type: 'info', text } }

function self(ctx: TermContext): NetNode {
  return nodeById(ctx.selfId, ctx.nodes)!
}

// ─── Hostname / DNS helpers ────────────────────────────────────────────────

export const PUBLIC_IPS: Record<string, string> = {
  'google.com':      '142.250.185.46',
  'www.google.com':  '142.250.185.46',
  'youtube.com':     '142.250.68.110',
  'bbc.co.uk':       '151.101.0.81',
  'bbc.com':         '151.101.0.81',
  'example.com':     '93.184.216.34',
  'cloudflare.com':  '104.16.133.229',
  'github.com':      '140.82.121.4',
  'amazon.co.uk':    '54.239.28.85',
  'microsoft.com':   '20.112.52.29',
  'apple.com':       '17.253.144.10',
  'twitter.com':     '104.244.42.193',
  'x.com':           '104.244.42.193',
  'facebook.com':    '157.240.241.35',
  'wikipedia.org':   '208.80.154.224',
  'ocr.org.uk':      '213.219.152.175',
  'aqa.org.uk':      '23.55.180.103',
  'eduqas.co.uk':    '185.43.135.28',
}

function isHostname(s: string): boolean {
  return !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)
}

function resolveHostname(
  hostname: string,
  ctx: TermContext,
): { ip: string; dnsIp: string; cloudId: string | null; isLocal: boolean } | null {
  const cloudNode = ctx.nodes.find((n) => n.data.deviceType === 'cloud')
  const dnsNode   = ctx.nodes.find((n) => n.data.deviceType === 'dns')

  const canReachCloud = cloudNode
    ? findPath(ctx.selfId, cloudNode.id, ctx.nodes, ctx.edges)
    : null
  const canReachDns = dnsNode
    ? findPath(ctx.selfId, dnsNode.id, ctx.nodes, ctx.edges)
    : null

  if (!canReachCloud && !canReachDns) return null

  // Check DNS node's local records first (exact match, case-insensitive)
  const localRecord = canReachDns
    ? (dnsNode!.data.dnsRecords ?? []).find(
        (r) => r.hostname.toLowerCase() === hostname.toLowerCase(),
      )
    : undefined

  const ip = localRecord?.ip
    ?? PUBLIC_IPS[hostname]
    ?? `93.184.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
  const dnsIp = canReachDns ? (dnsNode!.data.ip || '8.8.8.8') : '8.8.8.8'

  return { ip, dnsIp, cloudId: cloudNode?.id ?? null, isLocal: !!localRecord }
}

// Simulated internet backbone hops shown in traceroute
const INTERNET_HOPS = [
  { ip: '195.68.128.1',  label: 'ISP Gateway'       },
  { ip: '62.115.52.22',  label: 'Backbone router'    },
  { ip: '108.170.252.1', label: 'Exchange point'     },
]

// ─── Command implementations ───────────────────────────────────────────────

function cmdPing(args: string[], ctx: TermContext): Lines {
  const target = args[0]
  if (!target) return [err('Usage: ping <ip or hostname>')]

  const src = self(ctx)

  // ── Hostname branch ──────────────────────────────────────────────────────
  if (isHostname(target)) {
    const resolved = resolveHostname(target, ctx)
    if (!resolved) return [err(`ping: ${target}: Name or service not known`)]

    const cloudNode = resolved.cloudId ? nodeById(resolved.cloudId, ctx.nodes) : null
    const cloudPath = cloudNode
      ? findPath(src.id, cloudNode.id, ctx.nodes, ctx.edges)
      : null

    // Animate DNS lookup then ICMP packets to the internet
    const dnsNode = ctx.nodes.find((n) => n.data.deviceType === 'dns')
    const dnsPath = dnsNode ? findPath(src.id, dnsNode.id, ctx.nodes, ctx.edges) : null
    if (dnsPath) ctx.dispatchPackets?.(makePackets(dnsPath, ctx.edges, 'DNS', 'DNS', true))
    if (cloudPath) ctx.dispatchPackets?.(makePackets(cloudPath, ctx.edges, 'ICMP', 'ICMP', true))

    const hops = (cloudPath?.length ?? 3) - 1
    const baseRtt = 20 + hops * 8

    const lines: Lines = [
      info(`Resolving ${target} via DNS (${resolved.dnsIp})…`),
      out(`PING ${target} (${resolved.ip}): 56 data bytes`),
    ]
    for (let i = 0; i < 4; i++) {
      const rtt = baseRtt + Math.floor(Math.random() * 15)
      lines.push(out(`64 bytes from ${resolved.ip}: icmp_seq=${i} ttl=52 time=${rtt} ms`))
    }
    const avg = baseRtt + 7
    lines.push(out(''))
    lines.push(out(`--- ${target} ping statistics ---`))
    lines.push(out(`4 packets transmitted, 4 packets received, 0.0% packet loss`))
    lines.push(out(`round-trip min/avg/max = ${avg - 2}/${avg}/${avg + 5} ms`))
    return lines
  }

  // ── IP address branch ────────────────────────────────────────────────────
  const dst = nodeByIp(target, ctx.nodes)
  if (!dst) return [err(`ping: cannot reach ${target}: host unreachable`)]
  if (!dst.data.isOn) return [err(`Request timeout for icmp_seq 0`)]

  const path = findPath(src.id, dst.id, ctx.nodes, ctx.edges)
  if (!path) return [err(`ping: sendmsg: No route to host`)]

  populateMacTables(path, ctx)
  ctx.dispatchPackets?.(makePackets(path, ctx.edges, 'ICMP', 'ICMP', true))

  const hops = path.length - 1
  const lines: Lines = [out(`PING ${target}: 56 data bytes`)]
  for (let i = 0; i < 4; i++) {
    const rtt = simulatePingRtt(hops)
    lines.push(out(`64 bytes from ${target}: icmp_seq=${i} ttl=${64 - hops} time=${rtt} ms`))
  }
  const rtt = simulatePingRtt(hops)
  lines.push(out(''))
  lines.push(out(`--- ${target} ping statistics ---`))
  lines.push(out(`4 packets transmitted, 4 packets received, 0.0% packet loss`))
  lines.push(out(`round-trip min/avg/max = ${rtt - 1}/${rtt}/${rtt + 2} ms`))
  return lines
}

function cmdTraceroute(args: string[], ctx: TermContext): Lines {
  const target = args[0]
  if (!target) return [err('Usage: traceroute <ip or hostname>')]

  const src = self(ctx)

  // ── Hostname branch ──────────────────────────────────────────────────────
  if (isHostname(target)) {
    const resolved = resolveHostname(target, ctx)
    if (!resolved) return [err(`traceroute: ${target}: Name or service not known`)]

    const cloudNode = resolved.cloudId ? nodeById(resolved.cloudId, ctx.nodes) : null
    const cloudPath = cloudNode
      ? findPath(src.id, cloudNode.id, ctx.nodes, ctx.edges)
      : null

    // Animate DNS lookup then ICMP probe packets towards the internet
    const dnsNode = ctx.nodes.find((n) => n.data.deviceType === 'dns')
    const dnsPath = dnsNode ? findPath(src.id, dnsNode.id, ctx.nodes, ctx.edges) : null
    if (dnsPath) ctx.dispatchPackets?.(makePackets(dnsPath, ctx.edges, 'DNS', 'DNS', true))
    if (cloudPath) ctx.dispatchPackets?.(makePackets(cloudPath, ctx.edges, 'ICMP', 'ICMP'))

    const lines: Lines = [
      info(`Resolving ${target} via DNS (${resolved.dnsIp})…`),
      out(`traceroute to ${target} (${resolved.ip}), 30 hops max, 60 byte packets`),
    ]

    let hopNum = 1

    // Local hops to the cloud/internet node
    if (cloudPath && cloudPath.length > 1) {
      cloudPath.slice(1).forEach((nodeId, i) => {
        const node = nodeById(nodeId, ctx.nodes)
        const ip = node?.data.ip || node?.data.label || '*'
        const label = node?.data.label ?? ''
        const rtt = simulatePingRtt(i + 1)
        lines.push(out(` ${hopNum}  ${ip} (${label})  ${rtt} ms  ${rtt + 1} ms  ${rtt} ms`))
        hopNum++
      })
    }

    // Simulated internet backbone hops
    INTERNET_HOPS.forEach((hop, i) => {
      const rtt = 15 + hopNum * 4 + i * 3 + Math.floor(Math.random() * 4)
      lines.push(out(` ${hopNum}  ${hop.ip} (${hop.label})  ${rtt} ms  ${rtt + 2} ms  ${rtt + 1} ms`))
      hopNum++
    })

    const finalRtt = 30 + Math.floor(Math.random() * 10)
    lines.push(out(` ${hopNum}  ${resolved.ip} (${target})  ${finalRtt} ms  ${finalRtt + 1} ms  ${finalRtt} ms`))
    return lines
  }

  // ── IP address branch ────────────────────────────────────────────────────
  const dst = nodeByIp(target, ctx.nodes)
  if (!dst) return [err(`traceroute to ${target}: host unreachable`)]

  const path = findPath(src.id, dst.id, ctx.nodes, ctx.edges)
  if (!path) return [err(`traceroute to ${target}: no route to host`)]

  populateMacTables(path, ctx)
  ctx.dispatchPackets?.(makePackets(path, ctx.edges, 'ICMP', 'ICMP'))

  const lines: Lines = [out(`traceroute to ${target} (${target}), 30 hops max, 60 byte packets`)]
  path.slice(1).forEach((nodeId, i) => {
    const node = nodeById(nodeId, ctx.nodes)
    const ip = node?.data.ip ?? '*'
    const label = node?.data.label ?? ''
    const rtt = simulatePingRtt(i + 1)
    lines.push(out(` ${i + 1}  ${ip} (${label})  ${rtt} ms  ${rtt + 1} ms  ${rtt} ms`))
  })
  return lines
}

function cmdIpconfig(args: string[], ctx: TermContext): Lines {
  if (args[0] === '/renew') return cmdDhclient([], ctx)
  const node = self(ctx)
  const { ip, subnet, gateway, mac } = node.data
  const cidr = subnet ? subnetToCidr(subnet) : 24
  return [
    out(`Ethernet adapter ${node.data.label}:`),
    out(`   IPv4 Address . . . . : ${ip || '(not set)'}`),
    out(`   Subnet Mask  . . . . : ${subnet || '255.255.255.0'} (/${cidr})`),
    out(`   Default Gateway  . . : ${gateway || '(not set)'}`),
    out(`   Physical Address . . : ${mac}`),
  ]
}

function cmdIfconfig(_args: string[], ctx: TermContext): Lines {
  const node = self(ctx)
  const { ip, subnet, gateway, mac } = node.data
  const cidr = subnet ? subnetToCidr(subnet) : 24
  return [
    out(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`),
    out(`        inet ${ip || '0.0.0.0'}  netmask ${subnet || '255.255.255.0'}  broadcast ${ip?.replace(/\d+$/, '255') ?? ''}`),
    out(`        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>`),
    out(`        ether ${mac}  txqueuelen 1000  (Ethernet)`),
    out(`        Gateway: ${gateway || '(not set)'} (/${cidr})`),
  ]
}

function cmdNslookup(args: string[], ctx: TermContext): Lines {
  const domain = args[0]
  if (!domain) return [err('Usage: nslookup <domain>')]

  const src = self(ctx)
  const dnsNode   = ctx.nodes.find((n) => n.data.deviceType === 'dns')
  const cloudNode = ctx.nodes.find((n) => n.data.deviceType === 'cloud')

  const dnsPath       = dnsNode   ? findPath(src.id, dnsNode.id,   ctx.nodes, ctx.edges) : null
  const canReachDns   = !!dnsPath
  const canReachCloud = !!(cloudNode && findPath(src.id, cloudNode.id, ctx.nodes, ctx.edges))

  if (dnsPath) ctx.dispatchPackets?.(makePackets(dnsPath, ctx.edges, 'DNS', 'DNS', true))

  if (!canReachDns && !canReachCloud) {
    return [
      out(`Server:   (none)`),
      out(''),
      err(`;; connection timed out; no servers could be reached`),
    ]
  }

  const dnsIp = canReachDns ? (dnsNode!.data.ip || '8.8.8.8') : '8.8.8.8'

  // Check local DNS records first
  const localRecord = canReachDns
    ? (dnsNode!.data.dnsRecords ?? []).find(
        (r) => r.hostname.toLowerCase() === domain.toLowerCase(),
      )
    : undefined

  const resolvedIp = localRecord?.ip
    ?? PUBLIC_IPS[domain]
    ?? `93.184.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`

  const lines: Lines = [
    out(`Server:   ${dnsIp}`),
    out(`Address:  ${dnsIp}#53`),
    out(''),
  ]

  if (localRecord) {
    lines.push(
      out(`Name:     ${domain}`),
      out(`Address:  ${resolvedIp}`),
    )
  } else {
    lines.push(
      out(`Non-authoritative answer:`),
      out(`Name:     ${domain}`),
      out(`Address:  ${resolvedIp}`),
    )
  }

  return lines
}

function cmdArp(_args: string[], ctx: TermContext): Lines {
  const node = self(ctx)
  const neighbourIds = ctx.edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => (e.source === node.id ? e.target : e.source))

  const lines: Lines = [out('Address         HWtype  HWaddress           Flags Iface')]
  for (const nid of neighbourIds) {
    const n = nodeById(nid, ctx.nodes)
    if (n?.data.ip) {
      lines.push(out(`${n.data.ip.padEnd(16)}ether   ${n.data.mac}  C     eth0`))
    }
  }
  if (lines.length === 1) lines.push(out('(no entries)'))
  return lines
}

function cmdNetstat(_args: string[], ctx: TermContext): Lines {
  const node = self(ctx)
  const neighbours = ctx.edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => (e.source === node.id ? e.target : e.source))

  const lines: Lines = [
    out('Active Internet connections (w/o servers)'),
    out('Proto Recv-Q Send-Q Local Address           Foreign Address         State'),
  ]
  neighbours.forEach((nid) => {
    const n = nodeById(nid, ctx.nodes)
    if (n?.data.ip) {
      lines.push(out(`tcp        0      0 ${node.data.ip}:${Math.floor(Math.random() * 20000 + 40000)}  ${n.data.ip}:80     ESTABLISHED`))
    }
  })
  if (lines.length === 2) lines.push(out('(no connections)'))
  return lines
}

function cmdCurl(args: string[], ctx: TermContext): Lines {
  const url = args[0]
  if (!url) return [err('Usage: curl <url>')]

  const hostname = url.replace(/^https?:\/\//, '').split('/')[0]
  const src = self(ctx)

  // Check for a local web server first
  const webNode = ctx.nodes.find((n) => n.data.deviceType === 'web')
  const localPath = webNode ? findPath(src.id, webNode.id, ctx.nodes, ctx.edges) : null

  // Helper: render page content as terminal lines
  function renderPage(node: typeof webNode): Lines {
    const content = (node?.data.pageContent || '').trim() || '<h1>Welcome</h1>'
    const bytes = content.length
    return [
      out(`  % Total    % Received % Xferd  Average Speed   Time`),
      out(`100  ${bytes.toString().padStart(4)}  100  ${bytes.toString().padStart(4)}    0     0   5120      0 --:--:-- --:--:--`),
      out(''),
      ...content.split('\n').map((line) => out(line)),
    ]
  }

  // If hostname is an IP address and matches a reachable local web server, serve it
  if (!isHostname(hostname) && localPath && webNode?.data.ip === hostname) {
    ctx.dispatchPackets?.(makePackets(localPath, ctx.edges, 'HTTP', 'HTTP', true))
    return renderPage(webNode)
  }

  // If hostname is a domain, try to resolve it via the DNS node's local records
  if (isHostname(hostname)) {
    const dnsNode = ctx.nodes.find((n) => n.data.deviceType === 'dns')
    const dnsPath = dnsNode ? findPath(src.id, dnsNode.id, ctx.nodes, ctx.edges) : null
    const localRecord = dnsPath
      ? (dnsNode!.data.dnsRecords ?? []).find(
          (r) => r.hostname.toLowerCase() === hostname.toLowerCase(),
        )
      : undefined

    if (localRecord) {
      // Resolved locally — find the web server with that IP
      const targetWeb = ctx.nodes.find(
        (n) => n.data.deviceType === 'web' && n.data.ip === localRecord.ip,
      )
      const targetPath = targetWeb ? findPath(src.id, targetWeb.id, ctx.nodes, ctx.edges) : null
      if (dnsPath) ctx.dispatchPackets?.(makePackets(dnsPath, ctx.edges, 'DNS', 'DNS', false))
      if (targetPath) {
        ctx.dispatchPackets?.(makePackets(targetPath, ctx.edges, 'HTTP', 'HTTP', true))
        return renderPage(targetWeb)
      }
      return [err(`curl: (7) Failed to connect to ${hostname} (${localRecord.ip}): No route to host`)]
    }
  }

  // External URL — need internet access
  const cloudNode = ctx.nodes.find((n) => n.data.deviceType === 'cloud')
  const canReachInternet = cloudNode && findPath(src.id, cloudNode.id, ctx.nodes, ctx.edges)

  if (!canReachInternet) {
    return [err(`curl: (6) Could not resolve host: ${hostname}`)]
  }

  // If local web server exists and is reachable, use it for any reachable host (fallback)
  if (localPath && !isHostname(hostname)) {
    ctx.dispatchPackets?.(makePackets(localPath, ctx.edges, 'HTTP', 'HTTP', true))
    return renderPage(webNode)
  }

  return [
    out(`  % Total    % Received % Xferd  Average Speed   Time`),
    out(`100  1256  100  1256    0     0  12560      0 --:--:-- --:--:--`),
    out(''),
    out(`<!DOCTYPE html>`),
    out(`<html><head><title>${hostname}</title></head>`),
    out(`<body>`),
    out(`<h1>Welcome to ${hostname}</h1>`),
    out(`<p>This is a simulated response from the internet.</p>`),
    out(`</body></html>`),
  ]
}

function cmdRoute(_args: string[], ctx: TermContext): Lines {
  const node = self(ctx)
  const lines: Lines = [
    out('Kernel IP routing table'),
    out('Destination   Gateway       Genmask         Flags Metric Ref  Use Iface'),
  ]
  if (node.data.routingTable.length > 0) {
    node.data.routingTable.forEach((r) => {
      lines.push(out(`${r.destination.padEnd(14)}${r.gateway.padEnd(14)}${r.subnet.padEnd(16)}UG    ${r.metric}      0        0 ${r.iface}`))
    })
  } else {
    lines.push(out(`0.0.0.0       ${node.data.gateway || '0.0.0.0'}       0.0.0.0         UG    0      0        0 eth0`))
    lines.push(out(`192.168.1.0   0.0.0.0       255.255.255.0   U     0      0        0 eth0`))
  }
  return lines
}

function cmdSsh(args: string[], ctx: TermContext): Lines {
  const target = args[0]
  if (!target) return [err('Usage: ssh <ip-address>')]
  const dst = nodeByIp(target, ctx.nodes)
  if (!dst) return [err(`ssh: connect to host ${target}: No route to host`)]
  if (!['pc', 'laptop', 'server', 'web', 'dns'].includes(dst.data.deviceType)) {
    return [err(`ssh: connect to host ${target}: Connection refused`)]
  }
  const path = findPath(self(ctx).id, dst.id, ctx.nodes, ctx.edges)
  if (!path) return [err(`ssh: connect to host ${target}: Network unreachable`)]
  ctx.dispatchPackets?.(makePackets(path, ctx.edges, 'TCP', 'SSH'))
  return [
    out(`Connecting to ${target} (${dst.data.label})...`),
    out(`The authenticity of host '${target}' can't be established.`),
    out(`ECDSA key fingerprint is SHA256:${Math.random().toString(36).slice(2, 18).toUpperCase()}.`),
    out(`Warning: Permanently added '${target}' (ECDSA) to the list of known hosts.`),
    info(`Connected to ${dst.data.label} (${target}). Type 'exit' to disconnect.`),
    // Signal to Terminal component to enter SSH session mode
    { type: 'output' as const, text: `\x1bSSH:${dst.id}` },
  ]
}

function cmdDhclient(_args: string[], ctx: TermContext): Lines {
  const src = self(ctx)

  // Find DHCP-enabled routers reachable from this node
  const dhcpRouters = ctx.nodes.filter(
    (n) => n.data.deviceType === 'router' && n.data.dhcpEnabled,
  )

  for (const router of dhcpRouters) {
    const path = findPath(src.id, router.id, ctx.nodes, ctx.edges)
    if (!path) continue

    // Parse pool range (last-octet format "100-200")
    const routerIpParts = router.data.ip.split('.')
    const prefix = routerIpParts.slice(0, 3).join('.')
    const pool = (router.data.dhcpPool as string | undefined) || '100-200'
    const [startStr, endStr] = pool.split('-')
    const startLast = parseInt(startStr ?? '100', 10)
    const endLast   = endStr ? parseInt(endStr, 10) : 200

    // Find next unused IP from pool
    const usedIps = new Set(ctx.nodes.map((n) => n.data.ip).filter(Boolean))
    let assignedIp: string | null = null
    for (let i = startLast; i <= endLast; i++) {
      const candidate = `${prefix}.${i}`
      if (!usedIps.has(candidate)) { assignedIp = candidate; break }
    }

    if (!assignedIp) {
      return [err('dhclient: No IPs available in DHCP pool — all addresses in use.')]
    }

    // Build 4-way DHCP handshake animation: DISCOVER → OFFER → REQUEST → ACK
    const eids = edgesOnPath(path, ctx.edges)
    const N = eids.length
    const ts = Date.now()
    const dhcpPackets: PacketAnim[] = [
      // DISCOVER (client → router)
      ...eids.map((edgeId, i) => ({
        id: `pkt-${ts}-d${i}`, edgeId, protocol: 'UDP' as const, label: 'DISCOVER',
        delayMs: i * HOP_MS, durationMs: HOP_MS,
      })),
      // OFFER (router → client)
      ...[...eids].reverse().map((edgeId, i) => ({
        id: `pkt-${ts}-o${i}`, edgeId, protocol: 'UDP' as const, label: 'OFFER',
        delayMs: (N + i) * HOP_MS, durationMs: HOP_MS, reverse: true,
      })),
      // REQUEST (client → router)
      ...eids.map((edgeId, i) => ({
        id: `pkt-${ts}-req${i}`, edgeId, protocol: 'UDP' as const, label: 'REQUEST',
        delayMs: (2 * N + i) * HOP_MS, durationMs: HOP_MS,
      })),
      // ACK (router → client)
      ...[...eids].reverse().map((edgeId, i) => ({
        id: `pkt-${ts}-ack${i}`, edgeId, protocol: 'UDP' as const, label: 'ACK',
        delayMs: (3 * N + i) * HOP_MS, durationMs: HOP_MS, reverse: true,
      })),
    ]
    ctx.dispatchPackets?.(dhcpPackets)

    // Update the node's IP address
    ctx.updateNodeData?.(src.id, {
      ip: assignedIp,
      gateway: `${prefix}.1`,
      subnet: '255.255.255.0',
    })

    return [
      info('DHCP DISCOVER sent (broadcast)…'),
      info(`DHCP OFFER received from ${router.data.ip}: ${assignedIp}`),
      info('DHCP REQUEST sent…'),
      info(`DHCP ACK — lease granted.`),
      out(''),
      out(`inet ${assignedIp}/24 brd ${prefix}.255 scope global dynamic eth0`),
      out(`   valid_lft 86400sec preferred_lft 86400sec`),
    ]
  }

  return [err('dhclient: No DHCP server found. Is a router with DHCP enabled connected to this network?')]
}

function cmdHelp(ctx: TermContext): Lines {
  const ks3 = ctx.level === 'ks3'
  const lines: Lines = [
    out('Available commands:'),
    out('  ping <ip|host>     – Test connectivity'),
    out('  ipconfig           – Show IP configuration (Windows style)'),
    out('  ifconfig           – Show IP configuration (Linux style)'),
  ]
  if (!ks3) {
    lines.push(
      out('  traceroute <ip|host>– Trace network path (hostname ok)'),
      out('  nslookup <domain>  – Query DNS for a domain name'),
      out('  arp -a             – Show ARP table (neighbours)'),
      out('  netstat            – Show active connections'),
      out('  route              – Show routing table'),
      out('  curl <url>         – Make HTTP request'),
      out('  ssh <ip>           – Connect to remote host (exit to quit)'),
      out('  dhclient           – Request IP from DHCP server'),
      out('  ipconfig /renew    – Same as dhclient (Windows style)'),
    )
  }
  lines.push(
    out('  clear              – Clear terminal'),
    out('  help               – Show this help'),
  )
  return lines
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

export function runCommand(raw: string, ctx: TermContext): TerminalLine[] {
  const parts = raw.trim().split(/\s+/)
  const cmd = parts[0]?.toLowerCase() ?? ''
  const args = parts.slice(1)

  switch (cmd) {
    case 'ping': return cmdPing(args, ctx)
    case 'traceroute':
    case 'tracert': return cmdTraceroute(args, ctx)
    case 'ipconfig': return cmdIpconfig(args, ctx)
    case 'ifconfig': return cmdIfconfig(args, ctx)
    case 'nslookup': return cmdNslookup(args, ctx)
    case 'arp': return cmdArp(args, ctx)
    case 'netstat': return cmdNetstat(args, ctx)
    case 'route': return cmdRoute(args, ctx)
    case 'curl':
    case 'wget': return cmdCurl(args, ctx)
    case 'ssh': return cmdSsh(args, ctx)
    case 'dhclient': return cmdDhclient(args, ctx)
    case 'clear': return [{ type: 'output', text: '\x1bCLEAR' }]
    case 'help': return cmdHelp(ctx)
    case '': return []
    default: return [err(`command not found: ${cmd}`)]
  }
}
