import type { Node, Edge } from '@xyflow/react'

export type DeviceType =
  | 'pc'
  | 'laptop'
  | 'server'
  | 'router'
  | 'switch'
  | 'hub'
  | 'wap'
  | 'firewall'
  | 'dns'
  | 'web'
  | 'cloud'

export interface RouteEntry {
  destination: string
  subnet: string
  gateway: string
  iface: string
  metric: number
}

export interface MacEntry {
  mac: string
  port: string
  vlan: number
}

export interface FirewallRule {
  id: string
  direction: 'in' | 'out'
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY'
  srcIp: string
  dstIp: string
  port: string
  action: 'allow' | 'deny'
}

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info'
  text: string
}

export interface NodeData extends Record<string, unknown> {
  label: string
  deviceType: DeviceType
  ip: string
  subnet: string
  gateway: string
  mac: string
  isOn: boolean
  // Router
  routingTable: RouteEntry[]
  // Switch
  macTable: MacEntry[]
  // WAP
  ssid: string
  wpaKey: string
  band: '2.4GHz' | '5GHz'
  // Firewall
  rules: FirewallRule[]
  // Web server hosted page
  pageContent: string
  // Terminal history (pc, laptop, server)
  termHistory: TerminalLine[]
  // Extra info
  notes: string
}

export type NetNode = Node<NodeData>
export type NetEdge = Edge

export type PanelType = 'config' | 'terminal' | 'info' | null

export interface PacketAnim {
  id: string
  edgeId: string
  protocol: 'ICMP' | 'HTTP' | 'DNS' | 'TCP' | 'UDP'
  label: string
  delayMs: number
  durationMs: number
  reverse?: boolean
}
