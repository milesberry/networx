import { useState } from 'react'
import { X, Plus, Trash2, Power } from 'lucide-react'
import { useNetworkStore } from '../store'
import type { FirewallRule } from '../types'

interface Props {
  nodeId: string
  onClose: () => void
}

function Field({ label, value, onChange, placeholder = '', mono = false }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        className={`border border-gray-200 rounded-md px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 ${mono ? 'font-mono' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default function ConfigPanel({ nodeId, onClose }: Props) {
  const { nodes, updateNodeData, addRoute, removeRoute, addRule, removeRule } = useNetworkStore()
  const node = nodes.find((n) => n.id === nodeId)
  const [tab, setTab] = useState<'basic' | 'advanced' | 'security'>('basic')

  if (!node) return null

  const { data } = node
  const upd = (patch: Parameters<typeof updateNodeData>[1]) => updateNodeData(nodeId, patch)

  function handleAddRoute() {
    addRoute(nodeId, { destination: '10.0.0.0', subnet: '255.255.255.0', gateway: '0.0.0.0', iface: 'eth0', metric: 1 })
  }

  function handleAddRule() {
    addRule(nodeId, {
      id: `r${Date.now()}`,
      direction: 'in',
      protocol: 'TCP',
      srcIp: '*',
      dstIp: '*',
      port: '80',
      action: 'allow',
    })
  }

  const isRouter = data.deviceType === 'router'
  const isSwitch = data.deviceType === 'switch'
  const isHub = data.deviceType === 'hub'
  const isWap = data.deviceType === 'wap'
  const isFirewall = data.deviceType === 'firewall'
  const isWeb = data.deviceType === 'web'
  const hasIp = !(isSwitch || isHub)

  const TABS = [
    { id: 'basic', label: 'Basic' },
    ...(isRouter ? [{ id: 'advanced', label: 'Routing' }] : []),
    ...(isFirewall ? [{ id: 'security', label: 'Rules' }] : []),
    ...(isSwitch ? [{ id: 'advanced', label: 'MAC Table' }] : []),
    ...(isWap ? [{ id: 'advanced', label: 'Wireless' }] : []),
    ...(isWeb ? [{ id: 'page', label: 'Page' }] : []),
  ] as { id: string; label: string }[]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">{data.label}</h2>
          <span className="text-xs text-gray-400 capitalize">{data.deviceType}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              data.isOn ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            onClick={() => upd({ isOn: !data.isOn })}
          >
            <Power size={11} />
            {data.isOn ? 'Online' : 'Offline'}
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {TABS.length > 1 && (
        <div className="flex border-b border-gray-200 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setTab(t.id as typeof tab)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'basic' && (
          <>
            <Field label="Label" value={data.label} onChange={(v) => upd({ label: v })} />
            {hasIp && (
              <>
                <Field label="IP Address" value={data.ip} onChange={(v) => upd({ ip: v })} placeholder="192.168.1.x" mono />
                <Field label="Subnet Mask" value={data.subnet} onChange={(v) => upd({ subnet: v })} placeholder="255.255.255.0" mono />
                <Field label="Default Gateway" value={data.gateway} onChange={(v) => upd({ gateway: v })} placeholder="192.168.1.1" mono />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">MAC Address</label>
                  <span className="font-mono text-sm text-gray-600 bg-gray-50 rounded-md px-2.5 py-1.5 border border-gray-100">
                    {data.mac}
                  </span>
                </div>
              </>
            )}
            <Field label="Notes" value={data.notes} onChange={(v) => upd({ notes: v })} placeholder="Add notes..." />
          </>
        )}

        {tab === 'advanced' && isRouter && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Routing Table</h3>
              <button
                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                onClick={handleAddRoute}
              >
                <Plus size={12} /> Add Route
              </button>
            </div>
            <div className="space-y-2">
              {data.routingTable.map((route, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs font-mono space-y-1.5 relative">
                  <button
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-400 transition-colors"
                    onClick={() => removeRoute(nodeId, i)}
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pr-5">
                    {(['destination', 'subnet', 'gateway', 'iface'] as const).map((field) => (
                      <div key={field}>
                        <div className="text-gray-400 text-xs">{field}</div>
                        <input
                          className="w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-xs"
                          value={route[field]}
                          onChange={(e) => {
                            const updated = data.routingTable.map((r, idx) =>
                              idx === i ? { ...r, [field]: e.target.value } : r
                            )
                            upd({ routingTable: updated })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {data.routingTable.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No routes. Add a route above.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'advanced' && isSwitch && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">MAC Address Table</h3>
            {data.macTable.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Table empty. MAC addresses are learnt as traffic flows.</p>
            ) : (
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="text-left py-1">MAC</th>
                    <th className="text-left py-1">Port</th>
                    <th className="text-left py-1">VLAN</th>
                  </tr>
                </thead>
                <tbody>
                  {data.macTable.map((e, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1 text-blue-600">{e.mac}</td>
                      <td className="py-1">{e.port}</td>
                      <td className="py-1">{e.vlan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'advanced' && isWap && (
          <>
            <Field label="SSID (Network Name)" value={data.ssid} onChange={(v) => upd({ ssid: v })} />
            <Field label="WPA2 Key" value={data.wpaKey} onChange={(v) => upd({ wpaKey: v })} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Band</label>
              <div className="flex gap-2">
                {(['2.4GHz', '5GHz'] as const).map((b) => (
                  <button
                    key={b}
                    className={`flex-1 py-1.5 text-sm rounded-md border transition-colors ${
                      data.band === b
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => upd({ band: b })}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {data.band === '2.4GHz'
                  ? '2.4 GHz: longer range, slower, more interference'
                  : '5 GHz: shorter range, faster, less congestion'}
              </p>
            </div>
          </>
        )}

        {tab === 'page' && isWeb && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400">
              Edit the HTML served by this web server. Use{' '}
              <code className="bg-gray-100 px-1 rounded font-mono">curl {data.ip}</code>{' '}
              from a terminal to fetch it.
            </p>
            <textarea
              className="font-mono text-xs bg-gray-900 text-green-400 p-3 rounded-lg resize-none outline-none border border-gray-700 focus:border-green-500 transition-colors"
              style={{ height: '280px' }}
              value={data.pageContent ?? ''}
              onChange={(e) => upd({ pageContent: e.target.value })}
              spellCheck={false}
            />
          </div>
        )}

        {tab === 'security' && isFirewall && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Firewall Rules</h3>
              <button
                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                onClick={handleAddRule}
              >
                <Plus size={12} /> Add Rule
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Rules are evaluated top-to-bottom. First match wins.</p>
            <div className="space-y-2">
              {data.rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rounded-lg p-3 text-xs space-y-2 relative border ${
                    rule.action === 'allow' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <button
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-400 transition-colors"
                    onClick={() => removeRule(nodeId, rule.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="grid grid-cols-3 gap-2 pr-5">
                    {/* Direction */}
                    <div>
                      <div className="text-gray-500 mb-0.5">Direction</div>
                      <select
                        className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs bg-white"
                        value={rule.direction}
                        onChange={(e) => {
                          const updated = data.rules.map((r) =>
                            r.id === rule.id ? { ...r, direction: e.target.value as FirewallRule['direction'] } : r
                          )
                          upd({ rules: updated })
                        }}
                      >
                        <option value="in">Inbound</option>
                        <option value="out">Outbound</option>
                      </select>
                    </div>
                    {/* Protocol */}
                    <div>
                      <div className="text-gray-500 mb-0.5">Protocol</div>
                      <select
                        className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs bg-white"
                        value={rule.protocol}
                        onChange={(e) => {
                          const updated = data.rules.map((r) =>
                            r.id === rule.id ? { ...r, protocol: e.target.value as FirewallRule['protocol'] } : r
                          )
                          upd({ rules: updated })
                        }}
                      >
                        {['TCP', 'UDP', 'ICMP', 'ANY'].map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    {/* Port */}
                    <div>
                      <div className="text-gray-500 mb-0.5">Port</div>
                      <input
                        className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs font-mono bg-white"
                        value={rule.port}
                        onChange={(e) => {
                          const updated = data.rules.map((r) =>
                            r.id === rule.id ? { ...r, port: e.target.value } : r
                          )
                          upd({ rules: updated })
                        }}
                        placeholder="80 or *"
                      />
                    </div>
                    {/* Src IP */}
                    <div>
                      <div className="text-gray-500 mb-0.5">Source IP</div>
                      <input
                        className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs font-mono bg-white"
                        value={rule.srcIp}
                        onChange={(e) => {
                          const updated = data.rules.map((r) =>
                            r.id === rule.id ? { ...r, srcIp: e.target.value } : r
                          )
                          upd({ rules: updated })
                        }}
                        placeholder="* or IP"
                      />
                    </div>
                    {/* Dst IP */}
                    <div>
                      <div className="text-gray-500 mb-0.5">Dest IP</div>
                      <input
                        className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs font-mono bg-white"
                        value={rule.dstIp}
                        onChange={(e) => {
                          const updated = data.rules.map((r) =>
                            r.id === rule.id ? { ...r, dstIp: e.target.value } : r
                          )
                          upd({ rules: updated })
                        }}
                        placeholder="* or IP"
                      />
                    </div>
                    {/* Action */}
                    <div>
                      <div className="text-gray-500 mb-0.5">Action</div>
                      <select
                        className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs bg-white"
                        value={rule.action}
                        onChange={(e) => {
                          const updated = data.rules.map((r) =>
                            r.id === rule.id ? { ...r, action: e.target.value as FirewallRule['action'] } : r
                          )
                          upd({ rules: updated })
                        }}
                      >
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
