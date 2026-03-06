import { useState } from 'react'
import { X, ChevronRight, BookOpen } from 'lucide-react'
import { concepts } from '../simulation/concepts'

interface Props {
  onClose: () => void
}

function renderMarkdown(text: string): string {
  // Very simple markdown: bold, code, headers, lists, tables
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-blue-700 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/^#### (.+)$/gm, '<h4 class="font-bold text-gray-700 mt-3 mb-1 text-sm">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-gray-800 mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-gray-800 mt-4 mb-2 text-base">$1</h2>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ').map((c: string) => `<td class="border border-gray-200 px-2 py-0.5 text-xs">${c}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .replace(/(<tr>.*<\/tr>)/gs, '<table class="border-collapse w-full my-2 text-xs">$1</table>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2 text-sm text-gray-700">')
}

export default function InfoPanel({ onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const concept = selected ? concepts.find((c) => c.id === selected) : null

  const filtered = concepts.filter(
    (c) =>
      c.title.toLowerCase().includes(filter.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase())),
  )

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {concept && (
            <button
              className="text-gray-400 hover:text-gray-600 mr-1"
              onClick={() => setSelected(null)}
            >
              <ChevronRight size={14} className="rotate-180" />
            </button>
          )}
          <BookOpen size={16} className="text-blue-500" />
          <h2 className="font-semibold text-gray-800 text-sm">
            {concept ? concept.title : 'Concepts'}
          </h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {!concept ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <input
              className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Search concepts..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.map((c) => (
              <button
                key={c.id}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors group"
                onClick={() => setSelected(c.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
                      {c.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.summary}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        c.level === 'GCSE'
                          ? 'bg-green-100 text-green-700'
                          : c.level === 'A Level'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {c.level}
                    </span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No matching concepts</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                concept.level === 'GCSE'
                  ? 'bg-green-100 text-green-700'
                  : concept.level === 'A Level'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {concept.level}
            </span>
            {concept.tags.map((t) => (
              <span key={t} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                {t}
              </span>
            ))}
          </div>
          <div
            className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${renderMarkdown(concept.body)}</p>` }}
          />
        </div>
      )}
    </div>
  )
}
