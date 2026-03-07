import { Monitor, Server, Router, Zap, Wifi, Shield, Globe, Laptop, HardDrive, Cloud } from 'lucide-react'
import type { DeviceType, Level } from '../types'

interface DeviceDef {
  type: DeviceType
  label: string
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  color: string
  bg: string
  description: string
  minLevel: Level
}

// minLevel = the lowest level at which this device is available
const DEVICES: DeviceDef[] = [
  { type: 'pc',       label: 'PC',           icon: Monitor,   color: '#2563eb', bg: '#dbeafe', description: 'Workstation with terminal',  minLevel: 'ks3' },
  { type: 'laptop',   label: 'Laptop',       icon: Laptop,    color: '#7c3aed', bg: '#ede9fe', description: 'Portable workstation',       minLevel: 'ks3' },
  { type: 'server',   label: 'Server',       icon: Server,    color: '#059669', bg: '#d1fae5', description: 'General-purpose server',     minLevel: 'ks3' },
  { type: 'router',   label: 'Router',       icon: Router,    color: '#dc2626', bg: '#fee2e2', description: 'Routes between networks',    minLevel: 'ks3' },
  { type: 'switch',   label: 'Switch',       icon: HardDrive, color: '#d97706', bg: '#fef3c7', description: 'Connects LAN devices',       minLevel: 'ks3' },
  { type: 'wap',      label: 'Access Point', icon: Wifi,      color: '#0891b2', bg: '#cffafe', description: 'Wireless access point',      minLevel: 'ks3' },
  { type: 'firewall', label: 'Firewall',     icon: Shield,    color: '#9333ea', bg: '#f3e8ff', description: 'Filters network traffic',    minLevel: 'ks4' },
  { type: 'dns',      label: 'DNS Server',   icon: Globe,     color: '#0284c7', bg: '#e0f2fe', description: 'Resolves domain names',      minLevel: 'ks4' },
  { type: 'web',      label: 'Web Server',   icon: Globe,     color: '#16a34a', bg: '#dcfce7', description: 'Serves HTTP pages',          minLevel: 'ks4' },
  { type: 'cloud',    label: 'Internet',     icon: Cloud,     color: '#0369a1', bg: '#f0f9ff', description: 'WAN / ISP cloud',            minLevel: 'ks4' },
  { type: 'hub',      label: 'Hub',          icon: Zap,       color: '#6b7280', bg: '#f3f4f6', description: 'Broadcasts to all ports',    minLevel: 'ks5' },
]

const LEVEL_ORDER: Record<Level, number> = { ks3: 3, ks4: 4, ks5: 5 }

interface Props {
  onAddDevice: (type: DeviceType) => void
  level: Level
}

export default function DevicePalette({ onAddDevice, level }: Props) {
  const visible = DEVICES.filter((d) => LEVEL_ORDER[d.minLevel] <= LEVEL_ORDER[level])

  function handleDragStart(e: React.DragEvent, type: DeviceType) {
    e.dataTransfer.setData('application/networx-device', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto select-none">
      <div className="px-3 py-3 border-b border-gray-100">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Devices</h2>
        <p className="text-xs text-gray-400 mt-0.5">Drag onto canvas, or click to add</p>
      </div>

      <div className="flex flex-col gap-0.5 p-2">
        {visible.map((dev) => {
          const Icon = dev.icon
          return (
            <div
              key={dev.type}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={(e) => handleDragStart(e, dev.type)}
              onClick={() => onAddDevice(dev.type)}
              title={dev.description}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onAddDevice(dev.type)}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: dev.bg }}
              >
                <Icon size={18} color={dev.color} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-700 truncate">{dev.label}</div>
                <div className="text-xs text-gray-400 leading-tight truncate">{dev.description}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-3 py-3 mt-auto border-t border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          Drag handles between nodes to connect. Toggle Ethernet / Wireless before connecting.
        </p>
      </div>
    </aside>
  )
}
