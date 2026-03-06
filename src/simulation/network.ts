import type { NetNode, NetEdge } from '../types'

/** BFS to find path between two nodes, returns array of node IDs */
export function findPath(
  sourceId: string,
  targetId: string,
  nodes: NetNode[],
  edges: NetEdge[],
): string[] | null {
  if (sourceId === targetId) return [sourceId]

  const adj = new Map<string, string[]>()
  for (const n of nodes) adj.set(n.id, [])
  for (const e of edges) {
    adj.get(e.source)?.push(e.target)
    adj.get(e.target)?.push(e.source)
  }

  const visited = new Set<string>()
  const queue: Array<{ id: string; path: string[] }> = [{ id: sourceId, path: [sourceId] }]
  visited.add(sourceId)

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const neighbor of adj.get(current.id) ?? []) {
      if (visited.has(neighbor)) continue
      const newPath = [...current.path, neighbor]
      if (neighbor === targetId) return newPath
      visited.add(neighbor)
      queue.push({ id: neighbor, path: newPath })
    }
  }
  return null
}

/** Get node by IP address */
export function nodeByIp(ip: string, nodes: NetNode[]): NetNode | undefined {
  return nodes.find((n) => n.data.ip === ip)
}

/** Get node by ID */
export function nodeById(id: string, nodes: NetNode[]): NetNode | undefined {
  return nodes.find((n) => n.id === id)
}

/** Are two nodes directly connected? */
export function directlyConnected(
  aId: string,
  bId: string,
  edges: NetEdge[],
): boolean {
  return edges.some(
    (e) =>
      (e.source === aId && e.target === bId) ||
      (e.target === aId && e.source === bId),
  )
}

/** Simulate ping RTT (ms) based on hop count */
export function simulatePingRtt(hops: number): number {
  return Math.floor(hops * 2 + Math.random() * 5 + 1)
}

/** Format subnet bits */
export function subnetToCidr(subnet: string): number {
  return subnet
    .split('.')
    .map(Number)
    .reduce((acc, octet) => acc + octet.toString(2).split('').filter((b) => b === '1').length, 0)
}

/** Check if two IPs are on the same subnet */
export function sameSubnet(ip1: string, ip2: string, subnet: string): boolean {
  const mask = subnet.split('.').map(Number)
  const a = ip1.split('.').map(Number)
  const b = ip2.split('.').map(Number)
  return mask.every((m, i) => (a[i]! & m) === (b[i]! & m))
}
