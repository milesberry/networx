import { useState, useCallback, useRef } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, Globe, X } from 'lucide-react'
import { useNetworkStore } from '../store'
import { findPath } from '../simulation/network'
import { makePackets, PUBLIC_IPS } from '../simulation/terminal'

interface Props {
  nodeId: string
}

interface LoadedPage {
  url: string
  content: string
  title: string
}

function isIp(s: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)
}

function extractHostname(url: string): string {
  return url.replace(/^https?:\/\//, '').split('/')[0].split(':')[0]
}

export default function Browser({ nodeId }: Props) {
  const { nodes, edges, dispatchPackets } = useNetworkStore()
  const [addressInput, setAddressInput] = useState('')
  const [page, setPage] = useState<LoadedPage | null>(null)
  const [history, setHistory] = useState<LoadedPage[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const navigate = useCallback((rawUrl: string, pushHistory = true) => {
    const url = rawUrl.trim()
    if (!url) return

    const hostname = extractHostname(url)
    const src = nodes.find((n) => n.id === nodeId)
    if (!src) return

    setError(null)

    // ── Resolve hostname → IP ────────────────────────────────────────────────
    let targetIp = hostname

    if (!isIp(hostname)) {
      // Try local DNS records first
      const dnsNode = nodes.find((n) => n.data.deviceType === 'dns')
      const dnsPath = dnsNode ? findPath(nodeId, dnsNode.id, nodes, edges) : null

      if (dnsPath && dnsNode) {
        const record = (dnsNode.data.dnsRecords ?? []).find(
          (r) => r.hostname.toLowerCase() === hostname.toLowerCase(),
        )
        if (record) {
          // Animate DNS lookup
          dispatchPackets(makePackets(dnsPath, edges, 'DNS', 'DNS', true))
          targetIp = record.ip
        } else if (PUBLIC_IPS[hostname]) {
          // Known external hostname
          dispatchPackets(makePackets(dnsPath, edges, 'DNS', 'DNS', true))
          targetIp = PUBLIC_IPS[hostname]
        } else {
          setError(`This site can't be reached\n\n${hostname} could not be resolved.\n\nCheck the DNS server's A records.`)
          return
        }
      } else if (PUBLIC_IPS[hostname]) {
        // No DNS node but it's a known external name — check for cloud
        targetIp = PUBLIC_IPS[hostname]
      } else {
        setError(`This site can't be reached\n\n${hostname} could not be resolved.\n\nNo DNS server is reachable from this device.`)
        return
      }
    }

    // ── Find matching local web server ───────────────────────────────────────
    const webNode = nodes.find((n) => n.data.deviceType === 'web' && n.data.ip === targetIp)

    if (webNode) {
      const path = findPath(nodeId, webNode.id, nodes, edges)
      if (!path) {
        setError(`This site can't be reached\n\n${hostname} (${targetIp}) is not reachable from this device.\n\nCheck the network connections.`)
        return
      }
      // Animate HTTP request
      dispatchPackets(makePackets(path, edges, 'HTTP', 'HTTP', true))

      const content = webNode.data.pageContent?.trim() || '<html><body><h1>Empty Page</h1></body></html>'
      const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i)
      const title = titleMatch?.[1] ?? hostname

      const loaded: LoadedPage = { url, content, title }
      setPage(loaded)
      setAddressInput(url)

      if (pushHistory) {
        const newHistory = [...history.slice(0, historyIndex + 1), loaded]
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
      }
      return
    }

    // ── No local web server — check for internet access ──────────────────────
    const cloudNode = nodes.find((n) => n.data.deviceType === 'cloud')
    const cloudPath = cloudNode ? findPath(nodeId, cloudNode.id, nodes, edges) : null

    if (cloudPath) {
      // Simulate external page
      dispatchPackets(makePackets(cloudPath, edges, 'HTTP', 'HTTP', true))
      const content = `<!DOCTYPE html>
<html>
<head><title>${hostname}</title></head>
<body style="font-family:sans-serif;padding:24px;color:#333">
<p style="color:#888;font-size:12px">Simulated internet page — NetworX</p>
<h1>${hostname}</h1>
<p>This is a simulated response from the public internet.</p>
<p>The real <strong>${hostname}</strong> (${targetIp}) cannot be shown here.</p>
<p>To serve a custom page, add a <em>Web Server</em> node to your network with IP <code>${targetIp}</code>.</p>
</body>
</html>`
      const loaded: LoadedPage = { url, content, title: hostname }
      setPage(loaded)
      setAddressInput(url)
      if (pushHistory) {
        const newHistory = [...history.slice(0, historyIndex + 1), loaded]
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
      }
      return
    }

    setError(`This site can't be reached\n\n${hostname} (${targetIp}) — no web server found at this address and no internet connection available.`)
  }, [nodeId, nodes, edges, dispatchPackets, history, historyIndex])

  function goBack() {
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    const prev = history[newIndex]
    if (!prev) return
    setHistoryIndex(newIndex)
    setPage(prev)
    setAddressInput(prev.url)
    setError(null)
  }

  function goForward() {
    if (historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    const next = history[newIndex]
    if (!next) return
    setHistoryIndex(newIndex)
    setPage(next)
    setAddressInput(next.url)
    setError(null)
  }

  function reload() {
    if (page) navigate(page.url, false)
  }

  const canBack = historyIndex > 0
  const canForward = historyIndex < history.length - 1

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-2 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        {/* Nav buttons */}
        <button
          className={`p-1.5 rounded-md transition-colors ${canBack ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}
          onClick={goBack} disabled={!canBack} title="Back"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          className={`p-1.5 rounded-md transition-colors ${canForward ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}
          onClick={goForward} disabled={!canForward} title="Forward"
        >
          <ArrowRight size={14} />
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          onClick={reload} title="Reload"
        >
          <RotateCw size={13} />
        </button>

        {/* Address bar */}
        <div className="flex-1 flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-3 py-1 focus-within:border-blue-400 focus-within:bg-white transition-colors">
          <Globe size={11} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-xs outline-none text-gray-700 min-w-0"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(addressInput)}
            onFocus={(e) => e.target.select()}
            placeholder="Enter hostname or IP…"
            spellCheck={false}
          />
          {addressInput && (
            <button className="text-gray-300 hover:text-gray-500" onClick={() => { setAddressInput(''); inputRef.current?.focus() }}>
              <X size={11} />
            </button>
          )}
        </div>

        {/* Go button */}
        <button
          className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-full transition-colors flex-shrink-0"
          onClick={() => navigate(addressInput)}
        >
          Go
        </button>
      </div>

      {/* Page tab title strip */}
      {page && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex-shrink-0">
          <Globe size={11} className="text-blue-400" />
          <span className="truncate">{page.title}</span>
        </div>
      )}

      {/* Page area */}
      <div className="flex-1 bg-white overflow-hidden">
        {!page && !error && (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center text-gray-400 max-w-xs">
              <Globe size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-500 mb-1">NetworX Browser</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Type a hostname or IP address above to browse to a web server on your network.
              </p>
              <div className="mt-3 text-xs text-gray-400 space-y-1">
                <p>e.g. <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">192.168.1.80</code></p>
                <p>or &nbsp; <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">www.school.local</code></p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-4">🔌</div>
              <h2 className="text-base font-semibold text-gray-700 mb-3">This site can't be reached</h2>
              <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{error}</p>
              <button
                className="mt-4 px-4 py-1.5 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
                onClick={() => navigate(addressInput)}
              >
                Reload
              </button>
            </div>
          </div>
        )}

        {page && !error && (
          <iframe
            key={page.url + page.content.slice(0, 32)}
            srcDoc={page.content}
            sandbox="allow-scripts"
            title={page.title}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  )
}
