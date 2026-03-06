import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { useNetworkStore } from '../store'

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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

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
    </>
  )
}
