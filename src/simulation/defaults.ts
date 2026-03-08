import type { NodeData, DeviceType } from '../types'

let ipCounter = 10

function nextIp(subnet = '192.168.1') {
  return `${subnet}.${++ipCounter}`
}

function randomMac() {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join(':')
}

const DEVICE_LABELS: Record<DeviceType, string> = {
  pc: 'PC',
  laptop: 'Laptop',
  server: 'Server',
  router: 'Router',
  switch: 'Switch',
  hub: 'Hub',
  wap: 'Access Point',
  firewall: 'Firewall',
  gateway: 'Home Gateway',
  dns: 'DNS Server',
  web: 'Web Server',
  cloud: 'Internet',
}

export function makeDefaultData(type: DeviceType, id: string): NodeData {
  const base: NodeData = {
    label: `${DEVICE_LABELS[type]} ${id.split('-')[1]}`,
    deviceType: type,
    ip: '',
    subnet: '255.255.255.0',
    gateway: '192.168.1.1',
    mac: randomMac(),
    isOn: true,
    routingTable: [],
    dhcpEnabled: false,
    dhcpPool: '100-200',
    macTable: [],
    ssid: 'NetworX-WiFi',
    wpaKey: 'password123',
    band: '2.4GHz',
    rules: [],
    dnsRecords: [],
    pageContent: '',
    termHistory: [],
    notes: '',
  }

  switch (type) {
    case 'router':
      base.ip = nextIp()
      base.routingTable = [
        { destination: '0.0.0.0', subnet: '0.0.0.0', gateway: '0.0.0.0', iface: 'eth0', metric: 0 },
      ]
      base.dhcpEnabled = true
      base.dhcpPool = '100-200'
      break
    case 'switch':
    case 'hub':
      base.ip = ''
      base.subnet = ''
      break
    case 'wap':
      base.ip = nextIp()
      base.ssid = 'NetworX-WiFi'
      break
    case 'firewall':
      base.ip = nextIp()
      base.rules = [
        { id: 'r1', direction: 'in', protocol: 'TCP', srcIp: '*', dstIp: '*', port: '22', action: 'allow' },
        { id: 'r2', direction: 'in', protocol: 'TCP', srcIp: '*', dstIp: '*', port: '80', action: 'allow' },
        { id: 'r3', direction: 'in', protocol: 'ANY', srcIp: '*', dstIp: '*', port: '*', action: 'deny' },
      ]
      break
    case 'gateway':
      base.ip = nextIp()
      base.routingTable = [
        { destination: '0.0.0.0', subnet: '0.0.0.0', gateway: '0.0.0.0', iface: 'eth0', metric: 0 },
      ]
      base.dhcpEnabled = true
      base.dhcpPool = '100-200'
      base.ssid = 'HomeNet-5G'
      base.wpaKey = 'password123'
      base.band = '5GHz'
      base.rules = [
        { id: 'r1', direction: 'in', protocol: 'TCP', srcIp: '*', dstIp: '*', port: '22', action: 'allow' },
        { id: 'r2', direction: 'in', protocol: 'TCP', srcIp: '*', dstIp: '*', port: '80', action: 'allow' },
        { id: 'r3', direction: 'in', protocol: 'ANY', srcIp: '*', dstIp: '*', port: '*', action: 'deny' },
      ]
      break
    case 'dns':
      base.ip = '192.168.1.53'
      base.label = 'DNS Server'
      base.dnsRecords = [
        { id: 'dr1', hostname: 'www.school.local', ip: '192.168.1.80' },
        { id: 'dr2', hostname: 'intranet.school.local', ip: '192.168.1.81' },
      ]
      break
    case 'web':
      base.ip = nextIp()
      base.label = 'Web Server'
      base.pageContent = `<!DOCTYPE html>\n<html>\n<head>\n  <title>My Web Server</title>\n</head>\n<body>\n  <h1>Welcome to My Web Server</h1>\n  <p>This page is being served from the web server node.</p>\n  <p>Edit this content in the Configure panel &rarr; Page tab.</p>\n</body>\n</html>`
      break
    case 'cloud':
      base.ip = '0.0.0.0'
      base.label = 'Internet'
      base.subnet = ''
      base.gateway = ''
      base.notes = 'Represents the public internet / ISP. Connect a router\'s WAN port here.'
      break
    default:
      base.ip = nextIp()
  }

  return base
}
