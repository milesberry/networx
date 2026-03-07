import { useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  BookOpen, Cable, Wifi, Trash2, HelpCircle,
  ChevronRight, ChevronLeft, Save, LayoutGrid, Check, X as XIcon,
  Upload, Layers, GraduationCap,
} from 'lucide-react'

import { useNetworkStore } from './store'
import type { Level } from './types'
import DeviceNode from './nodes/DeviceNode'
import DeletableEdge from './edges/DeletableEdge'
import DevicePalette from './components/DevicePalette'
import ConfigPanel from './components/ConfigPanel'
import Terminal from './components/Terminal'
import InfoPanel from './components/InfoPanel'
import { PRESETS } from './simulation/presets'
import type { DeviceType, NetNode } from './types'

const nodeTypes = { device: DeviceNode }
const edgeTypes = { default: DeletableEdge }

// ─── Canvas (inside ReactFlowProvider so useReactFlow() works) ───────────────

function NetworkCanvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addDevice, selectNode, saveToStorage,
    setPanel,
  } = useNetworkStore()

  const { screenToFlowPosition } = useReactFlow()

  // Auto-save 1.5 s after last change
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveToStorage(), 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [nodes, edges, saveToStorage])

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/networx-device') as DeviceType
    if (!type) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addDevice(type, position)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handlePaneClick() {
    selectNode(null)
    setPanel(null)
  }

  function handleNodeClick(_: React.MouseEvent, node: NetNode) {
    selectNode(node.id)
    setPanel('config')
  }

  return (
    <div className="flex-1 relative" onDrop={handleDrop} onDragOver={handleDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const colors: Record<string, string> = {
              pc: '#2563eb', laptop: '#7c3aed', server: '#059669',
              router: '#dc2626', switch: '#d97706', hub: '#6b7280',
              wap: '#0891b2', firewall: '#9333ea', dns: '#0284c7',
              web: '#16a34a', cloud: '#0369a1',
            }
            const node = n as NetNode
            return colors[node.data?.deviceType ?? ''] ?? '#6b7280'
          }}
          style={{ background: '#f9fafb' }}
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400 max-w-xs">
            <div className="text-5xl mb-4">🖧</div>
            <p className="text-lg font-medium text-gray-500 mb-2">Build your network</p>
            <p className="text-sm">
              Drag a device from the left panel onto the canvas, or click to add it at the centre.
              Then drag between the grey port handles to connect devices.
            </p>
            <p className="text-sm mt-3 text-blue-500 font-medium">
              Or load a preset scenario from the toolbar ↑
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Preset picker ────────────────────────────────────────────────────────────

function PresetPicker() {
  const { loadPreset, saveToStorage } = useNetworkStore()
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(presetId: string) {
    if (confirmId === presetId) {
      const preset = PRESETS.find((p) => p.id === presetId)
      if (preset) { loadPreset(preset); saveToStorage() }
      setOpen(false)
      setConfirmId(null)
    } else {
      setConfirmId(presetId)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          open ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
        }`}
        onClick={() => { setOpen((v) => !v); setConfirmId(null) }}
      >
        <LayoutGrid size={14} />
        Presets
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Load scenario</p>
            <p className="text-xs text-gray-400">Replaces current canvas</p>
          </div>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                confirmId === p.id ? 'bg-orange-50' : ''
              }`}
              onClick={() => handleSelect(p.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide flex-shrink-0">
                      {p.level}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 leading-tight mt-0.5">{p.description}</div>
                </div>
                {confirmId === p.id ? (
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-orange-500" />
                    <span className="text-xs text-orange-600 whitespace-nowrap">Click again</span>
                  </div>
                ) : (
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Save / Import buttons ────────────────────────────────────────────────────

function SaveButton() {
  const { clearCanvas, loadPreset, nodes, edges, level } = useNetworkStore()
  const [flash, setFlash] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    const json = JSON.stringify({ nodes, edges, level }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'network.json'
    a.click()
    URL.revokeObjectURL(url)
    setFlash(true)
    setTimeout(() => setFlash(false), 2000)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.nodes && data.edges) {
          loadPreset({ id: 'imported', name: 'Imported', description: '', level: data.level ?? 'ks3', nodes: data.nodes, edges: data.edges })
        }
      } catch {
        alert('Invalid network file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-1">
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          flash ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
        }`}
        onClick={handleSave}
        title="Save network as network.json"
      >
        {flash ? <Check size={14} /> : <Save size={14} />}
        {flash ? 'Saved' : 'Save'}
      </button>
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        onClick={() => importRef.current?.click()}
        title="Import network from JSON file"
      >
        <Upload size={14} /> Import
      </button>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      {nodes.length > 0 && (
        <button
          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          onClick={() => {
            if (window.confirm('Clear the canvas? This cannot be undone.')) clearCanvas()
          }}
          title="Clear canvas"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<Level, string> = { ks3: 'KS3', ks4: 'KS4', ks5: 'KS5' }
const LEVELS: Level[] = ['ks3', 'ks4', 'ks5']

interface ToolbarProps {
  connectionType: 'wired' | 'wireless'
  setConnectionType: (t: 'wired' | 'wireless') => void
  onDeleteSelected: () => void
  onShowInfo: () => void
  selectedNodeId: string | null
  infoOpen: boolean
  showLayers: boolean
  toggleLayers: () => void
  level: Level
  setLevel: (l: Level) => void
}

function Toolbar({ connectionType, setConnectionType, onDeleteSelected, onShowInfo, selectedNodeId, infoOpen, showLayers, toggleLayers, level, setLevel }: ToolbarProps) {
  return (
    <header className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 z-10 flex-shrink-0 shadow-sm">
      <span className="font-bold text-lg tracking-tight text-blue-600 mr-1">Networx</span>

      <div className="h-5 w-px bg-gray-200 mx-1" />

      <PresetPicker />
      <SaveButton />

      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Key stage selector */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5" title="Curriculum level — controls which devices and features are available">
        <GraduationCap size={13} className="ml-1.5 text-gray-400 flex-shrink-0" />
        {LEVELS.map((l) => (
          <button
            key={l}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              level === l ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setLevel(l)}
          >
            {LEVEL_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Connection type toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        <button
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            connectionType === 'wired' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setConnectionType('wired')}
        >
          <Cable size={13} /> Ethernet
        </button>
        <button
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            connectionType === 'wireless' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setConnectionType('wireless')}
        >
          <Wifi size={13} /> Wireless
        </button>
      </div>

      {selectedNodeId && (
        <>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            onClick={onDeleteSelected}
            title="Delete selected (or press Delete key)"
          >
            <Trash2 size={13} /> Delete
          </button>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        {level !== 'ks3' && (
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              showLayers ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={toggleLayers}
            title="Show TCP/IP layer for each device"
          >
            <Layers size={14} /> Layers
          </button>
        )}
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            infoOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={onShowInfo}
        >
          <BookOpen size={14} /> Concepts
        </button>
        <a
          href="https://github.com/milesberry/networx"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <HelpCircle size={16} />
        </a>
      </div>
    </header>
  )
}

// ─── Right panel ──────────────────────────────────────────────────────────────

function SidePanel() {
  const { nodes, selectedNodeId, activePanel, setPanel } = useNetworkStore()
  const node = nodes.find((n) => n.id === selectedNodeId)
  const hasTerminal = node && ['pc', 'laptop', 'server', 'dns', 'web'].includes(node.data.deviceType)

  if (!activePanel) return null

  function onClose() { setPanel(null) }

  return (
    <aside className="w-80 border-l border-gray-200 flex flex-col bg-white flex-shrink-0 overflow-hidden">
      {activePanel !== 'info' && selectedNodeId && (
        <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activePanel === 'config'
                ? 'bg-white text-gray-800 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setPanel('config')}
          >
            Configure
          </button>
          {hasTerminal && (
            <button
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                activePanel === 'terminal'
                  ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setPanel('terminal')}
            >
              Terminal
            </button>
          )}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {activePanel === 'config'   && selectedNodeId && <ConfigPanel nodeId={selectedNodeId} onClose={onClose} />}
        {activePanel === 'terminal' && selectedNodeId && <Terminal    nodeId={selectedNodeId} onClose={onClose} />}
        {activePanel === 'info'     && <InfoPanel onClose={onClose} />}
      </div>
    </aside>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function AppInner() {
  const {
    addDevice, selectNode, deleteSelected,
    connectionType, setConnectionType,
    selectedNodeId, activePanel, setPanel,
    showLayers, toggleLayers,
    level, setLevel,
  } = useNetworkStore()

  const [infoOpen, setInfoOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(true)

  function handleAddDevice(type: DeviceType) {
    addDevice(type, { x: 180 + Math.random() * 200, y: 130 + Math.random() * 200 })
  }

  function handleShowInfo() {
    const next = !infoOpen
    setInfoOpen(next)
    selectNode(null)
    setPanel(next ? 'info' : null)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar
        connectionType={connectionType}
        setConnectionType={setConnectionType}
        onDeleteSelected={deleteSelected}
        onShowInfo={handleShowInfo}
        selectedNodeId={selectedNodeId}
        infoOpen={infoOpen}
        showLayers={showLayers}
        toggleLayers={toggleLayers}
        level={level}
        setLevel={setLevel}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Palette */}
        <div
          className="flex-shrink-0 overflow-hidden transition-all duration-200"
          style={{ width: paletteOpen ? 208 : 0 }}
        >
          {paletteOpen && <DevicePalette onAddDevice={handleAddDevice} level={level} />}
        </div>

        <button
          className="absolute z-20 bg-white border border-gray-200 rounded-r-md p-1 shadow-sm hover:bg-gray-50 transition-all duration-200 top-1/2 -translate-y-1/2"
          style={{ left: paletteOpen ? 208 : 0 }}
          onClick={() => setPaletteOpen((v) => !v)}
        >
          {paletteOpen
            ? <ChevronLeft size={14} className="text-gray-500" />
            : <ChevronRight size={14} className="text-gray-500" />}
        </button>

        <NetworkCanvas />

        {activePanel && <SidePanel />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  )
}
