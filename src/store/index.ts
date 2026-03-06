import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react'
import type { NetNode, NetEdge, NodeData, PanelType, RouteEntry, MacEntry, FirewallRule, TerminalLine, PacketAnim } from '../types'
import { makeDefaultData } from '../simulation/defaults'
import type { Preset } from '../simulation/presets'

const STORAGE_KEY = 'networx-state-v1'

let idCounter = 100
function nextId(prefix: string) { return `${prefix}-${++idCounter}` }

// Try to restore saved state on first load
function loadSaved(): { nodes: NetNode[]; edges: NetEdge[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { nodes: NetNode[]; edges: NetEdge[] }
  } catch {
    return null
  }
}

interface NetworkStore {
  nodes: NetNode[]
  edges: NetEdge[]
  selectedNodeId: string | null
  activePanel: PanelType
  connectionType: 'wired' | 'wireless'
  showLayers: boolean

  // ReactFlow handlers
  onNodesChange: (changes: NodeChange<NetNode>[]) => void
  onEdgesChange: (changes: EdgeChange<NetEdge>[]) => void
  onConnect: (connection: Connection) => void

  // Node management
  addDevice: (type: NetNode['data']['deviceType'], position: { x: number; y: number }) => void
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  selectNode: (id: string | null) => void
  deleteSelected: () => void

  // Panel
  setPanel: (panel: PanelType) => void

  // Connection type
  setConnectionType: (t: 'wired' | 'wireless') => void

  // Layer visibility
  toggleLayers: () => void

  // Terminal
  appendTermLine: (nodeId: string, line: TerminalLine) => void
  clearTerm: (nodeId: string) => void

  // Switch MAC learning
  learnMac: (nodeId: string, entry: MacEntry) => void

  // Routing table
  addRoute: (nodeId: string, route: RouteEntry) => void
  removeRoute: (nodeId: string, index: number) => void

  // Firewall
  addRule: (nodeId: string, rule: FirewallRule) => void
  removeRule: (nodeId: string, id: string) => void

  // Packet animations
  activePackets: PacketAnim[]
  dispatchPackets: (packets: PacketAnim[]) => void

  // Persistence & presets
  saveToStorage: () => void
  loadPreset: (preset: Preset) => void
  clearCanvas: () => void
}

const saved = loadSaved()

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  nodes: saved?.nodes ?? [],
  edges: saved?.edges ?? [],
  selectedNodeId: null,
  activePanel: null,
  connectionType: 'wired',
  showLayers: false,
  activePackets: [],

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (connection) => {
    const ctype = get().connectionType
    set((s) => ({
      edges: addEdge(
        {
          ...connection,
          animated: ctype === 'wireless',
          style: ctype === 'wireless'
            ? { stroke: '#6366f1', strokeDasharray: '6 3' }
            : { stroke: '#374151' },
          data: { connectionType: ctype },
          label: ctype === 'wireless' ? 'Wi-Fi' : undefined,
        },
        s.edges,
      ),
    }))
  },

  addDevice: (type, position) => {
    const id = nextId(type)
    const data = makeDefaultData(type, id)
    set((s) => ({
      nodes: [...s.nodes, { id, type: 'device', position, data }],
    }))
  },

  updateNodeData: (id, patch) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  deleteSelected: () => {
    const { selectedNodeId } = get()
    if (!selectedNodeId) return
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== selectedNodeId),
      edges: s.edges.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
      ),
      selectedNodeId: null,
      activePanel: null,
    }))
  },

  setPanel: (panel) => set({ activePanel: panel }),

  setConnectionType: (t) => set({ connectionType: t }),

  toggleLayers: () => set((s) => ({ showLayers: !s.showLayers })),

  appendTermLine: (nodeId, line) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, termHistory: [...n.data.termHistory, line] } }
          : n,
      ),
    })),

  clearTerm: (nodeId) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, termHistory: [] } } : n,
      ),
    })),

  learnMac: (nodeId, entry) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, macTable: [...n.data.macTable.filter((m) => m.mac !== entry.mac), entry] } }
          : n,
      ),
    })),

  addRoute: (nodeId, route) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, routingTable: [...n.data.routingTable, route] } }
          : n,
      ),
    })),

  removeRoute: (nodeId, index) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, routingTable: n.data.routingTable.filter((_, i) => i !== index) } }
          : n,
      ),
    })),

  addRule: (nodeId, rule) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, rules: [...n.data.rules, rule] } }
          : n,
      ),
    })),

  removeRule: (nodeId, ruleId) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, rules: n.data.rules.filter((r) => r.id !== ruleId) } }
          : n,
      ),
    })),

  dispatchPackets: (packets) => {
    // Stagger each packet's appearance via setTimeout so animateMotion starts at t=0
    packets.forEach((packet) => {
      setTimeout(() => {
        set((s) => ({ activePackets: [...s.activePackets, packet] }))
        setTimeout(() => {
          set((s) => ({ activePackets: s.activePackets.filter((p) => p.id !== packet.id) }))
        }, packet.durationMs + 150)
      }, packet.delayMs)
    })
  },

  saveToStorage: () => {
    const { nodes, edges } = get()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
    } catch { /* quota exceeded — silently skip */ }
  },

  loadPreset: (preset) => {
    set({
      nodes: preset.nodes,
      edges: preset.edges,
      selectedNodeId: null,
      activePanel: null,
    })
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [], selectedNodeId: null, activePanel: null })
    localStorage.removeItem(STORAGE_KEY)
  },
}))
