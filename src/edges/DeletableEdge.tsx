import { useEffect, useRef } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { useNetworkStore } from '../store'
import type { PacketAnim } from '../types'

const PROTOCOL_COLORS: Record<string, string> = {
  ICMP: '#f97316',  // orange
  HTTP: '#2563eb',  // blue
  DNS:  '#9333ea',  // purple
  TCP:  '#0891b2',  // cyan
  UDP:  '#d97706',  // amber
}

// Separate component so useEffect fires correctly on mount
function PacketDot({ edgePath, packet }: { edgePath: string; packet: PacketAnim }) {
  const ref = useRef<SVGAnimationElement>(null)
  const color = PROTOCOL_COLORS[packet.protocol] ?? '#6b7280'

  useEffect(() => {
    // begin="indefinite" means the animation only starts when beginElement() is called.
    // Calling it here (on mount) starts it immediately — avoids the SVG SMIL "document
    // time 0" problem where begin="0ms" fires in the past and jumps to fill="freeze".
    ref.current?.beginElement()
  }, [])

  return (
    <g>
      <animateMotion
        ref={ref as React.RefObject<SVGAnimateMotionElement>}
        path={edgePath}
        dur={`${packet.durationMs}ms`}
        begin="indefinite"
        fill="freeze"
        repeatCount="1"
        {...(packet.reverse ? { keyPoints: '1;0', keyTimes: '0;1', calcMode: 'linear' } : {})}
      />
      <circle r={5} fill={color} stroke="white" strokeWidth={1.5} cx={0} cy={0} />
      <text
        fontSize={8}
        fill={color}
        fontWeight="bold"
        textAnchor="middle"
        dy={-9}
        stroke="white"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {packet.label}
      </text>
    </g>
  )
}

export default function DeletableEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  style,
  label,
  selected,
  markerEnd,
}: EdgeProps) {
  const onEdgesChange = useNetworkStore((s) => s.onEdgesChange)
  const activePackets = useNetworkStore((s) => s.activePackets)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const myPackets = activePackets.filter((p) => p.edgeId === id)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onEdgesChange([{ type: 'remove', id }])
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label && (
            <span className="text-xs bg-white/90 px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-500 font-medium shadow-sm">
              {label as string}
            </span>
          )}
          {selected && (
            <button
              onClick={handleDelete}
              className="w-5 h-5 bg-white rounded-full border border-red-300 text-red-400 hover:bg-red-50 hover:text-red-600 text-sm flex items-center justify-center shadow-sm transition-colors"
              title="Delete connection"
            >
              ×
            </button>
          )}
        </div>
      </EdgeLabelRenderer>

      {myPackets.map((packet) => (
        <PacketDot key={packet.id} edgePath={edgePath} packet={packet} />
      ))}
    </>
  )
}
