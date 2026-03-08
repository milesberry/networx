export interface Concept {
  id: string
  title: string
  level: 'GCSE' | 'A Level' | 'Both'
  tags: string[]
  summary: string
  body: string
}

export const concepts: Concept[] = [
  {
    id: 'lan-wan',
    title: 'LAN & WAN',
    level: 'Both',
    tags: ['network types', 'LAN', 'WAN'],
    summary: 'Local Area Networks connect devices in a limited geographic area; Wide Area Networks span large distances.',
    body: `A **Local Area Network (LAN)** connects devices within a building or campus. It typically uses Ethernet cables or Wi-Fi and is owned by a single organisation.

A **Wide Area Network (WAN)** covers a large geographic area. The Internet is the largest WAN. WANs connect multiple LANs together, often using leased lines or the public telephone network.

**Key differences:**
| | LAN | WAN |
|---|---|---|
| Scale | Building/campus | Country/world |
| Speed | High (1 Gbps+) | Lower, variable |
| Owner | Single org | Multiple orgs |
| Cost | Low setup | High setup |`,
  },
  {
    id: 'tcp-ip',
    title: 'TCP/IP Model',
    level: 'Both',
    tags: ['protocols', 'layers', 'TCP', 'IP'],
    summary: 'TCP/IP is the 4-layer model used to describe how data travels across the internet.',
    body: `The **TCP/IP model** has 4 layers, each responsible for different aspects of communication:

**4. Application Layer**
Protocols that applications use directly: HTTP, HTTPS, FTP, SMTP, DNS.
Data is created and formatted here.

**3. Transport Layer**
TCP (reliable, ordered, checked) or UDP (fast, unreliable).
Splits data into **segments**, adds port numbers.

**2. Internet Layer**
IP addressing and routing. Data becomes **packets** with source/destination IP.
Routers operate at this layer.

**1. Link Layer**
Physical transmission: Ethernet, Wi-Fi, Bluetooth.
Data becomes **frames** with MAC addresses.

Each layer adds a **header** when sending (encapsulation) and removes it when receiving (decapsulation).`,
  },
  {
    id: 'protocols',
    title: 'Common Protocols',
    level: 'Both',
    tags: ['HTTP', 'HTTPS', 'FTP', 'SMTP', 'DNS', 'POP', 'IMAP'],
    summary: 'Protocols are agreed rules that allow devices to communicate.',
    body: `**HTTP** (port 80) – HyperText Transfer Protocol. Used to request and send web pages. Stateless: each request is independent.

**HTTPS** (port 443) – HTTP Secure. Encrypts data using TLS/SSL. Look for the padlock 🔒 in your browser.

**FTP** (ports 20/21) – File Transfer Protocol. Transfers files between client and server. Can be anonymous or authenticated.

**SMTP** (port 25/587) – Simple Mail Transfer Protocol. Sends email from client to server and between servers.

**POP3** (port 110) – Post Office Protocol. Downloads email to device and (usually) deletes from server.

**IMAP** (port 143) – Internet Message Access Protocol. Keeps email on server, syncs across devices.

**DNS** (port 53) – Domain Name System. Translates domain names (google.com) to IP addresses (142.250.x.x).`,
  },
  {
    id: 'dns',
    title: 'DNS – Domain Name System',
    level: 'Both',
    tags: ['DNS', 'IP address', 'domain'],
    summary: 'DNS is the "phone book" of the internet, translating human-readable domain names to IP addresses.',
    body: `When you type **www.example.com** into a browser:

1. Your device checks its **local DNS cache**
2. If not cached, asks your **ISP's DNS resolver**
3. The resolver asks a **root name server** (knows who manages .com)
4. The root server refers to the **.com TLD server**
5. The TLD server refers to **example.com's authoritative server**
6. The authoritative server returns the **IP address**
7. Your device connects to that IP address

This whole process (called **recursive lookup**) usually takes milliseconds. The answer is cached for a TTL (Time To Live) period.

Try \`nslookup\` in any terminal node to see DNS queries!`,
  },
  {
    id: 'ip-addressing',
    title: 'IP Addressing',
    level: 'Both',
    tags: ['IP', 'IPv4', 'IPv6', 'subnet', 'DHCP'],
    summary: 'Every device on a network needs a unique IP address to send and receive data.',
    body: `**IPv4** addresses are 32-bit numbers written as four decimal octets: **192.168.1.10**

- **Public IPs** – unique on the internet, assigned by ISPs
- **Private IPs** – used inside LANs (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- **Static** – manually configured, stays the same
- **Dynamic** – assigned by **DHCP** server, may change

**Subnet mask** defines which part is the network and which is the host.
- 192.168.1.10 / 255.255.255.0 means the network is 192.168.1.0
- Hosts can be 192.168.1.1 to 192.168.1.254

**IPv6** – 128-bit addresses written in hex: 2001:0db8:85a3::8a2e:0370:7334
- Solves IPv4 address exhaustion (only ~4 billion IPv4 addresses)
- 340 undecillion possible IPv6 addresses`,
  },
  {
    id: 'router',
    title: 'Routers',
    level: 'Both',
    tags: ['router', 'routing', 'routing table', 'IP'],
    summary: 'Routers forward packets between different networks using IP addresses and routing tables.',
    body: `A **router** connects different networks and directs (routes) traffic between them.

**How routing works:**
1. A packet arrives at the router
2. Router reads the **destination IP address**
3. Looks up the **routing table** for the best match
4. Forwards the packet out of the appropriate interface

**Routing table entries:**
- Destination network
- Subnet mask
- Gateway (next-hop router IP)
- Interface to use
- Metric (cost – lower is preferred)

**Default gateway** – the 0.0.0.0/0 route, used when no specific route matches. Packets go here if the router doesn't know where else to send them.

A home router connects your LAN (192.168.x.x) to your ISP's WAN.`,
  },
  {
    id: 'domestic-gateway',
    title: 'Domestic Gateway',
    level: 'Both',
    tags: ['router', 'gateway', 'home network', 'DHCP', 'NAT', 'Wi-Fi', 'firewall'],
    summary: 'Home broadband devices combine a router, switch, wireless access point, and basic firewall in a single unit.',
    body: `A **domestic gateway** (sometimes called a home hub or broadband router) is the single box your ISP provides. It combines four functions that would be separate devices in an enterprise network:

| Function | What it does |
|---|---|
| **Router** | Connects your home LAN to the ISP's WAN, routes packets between them |
| **Switch** | Built-in wired ports (usually 4) so PCs and TVs can connect via Ethernet |
| **Wireless access point** | Broadcasts a Wi-Fi signal (SSID) so phones and laptops can connect wirelessly |
| **Firewall** | Blocks unsolicited inbound connections from the internet |

**NAT – Network Address Translation**
Your ISP gives your home a single public IP address. The gateway uses NAT to allow all your home devices (each with a private 192.168.x.x address) to share that one public IP. When a device makes a request, NAT replaces the private source IP with the public IP on the way out, and reverses the process on the way back.

**DHCP**
The gateway also runs a DHCP server that automatically assigns IP addresses, subnet masks, and a default gateway to every device that joins the network. Clients request a lease with \`dhclient\` (Linux/Mac) or \`ipconfig /renew\` (Windows).

**In enterprise networks** these functions are kept separate — dedicated routers, managed switches, enterprise access points, and dedicated firewalls — for performance, security, and flexibility. The domestic gateway trades this flexibility for simplicity and low cost.`,
  },
  {
    id: 'switch',
    title: 'Switches',
    level: 'Both',
    tags: ['switch', 'MAC address', 'MAC table', 'VLAN'],
    summary: 'Switches connect devices within a LAN using MAC addresses to forward frames to the correct port.',
    body: `A **switch** operates at the **Link Layer (Layer 1)** of the TCP/IP model and forwards Ethernet frames based on **MAC addresses**.

**MAC address table (CAM table):**
- The switch learns MAC addresses by observing which port each frame comes from
- When a frame arrives, the switch looks up the destination MAC
- If found: sends the frame only to that port (**unicast**)
- If not found: sends to all ports (**floods**)

**Switch vs Hub:**
| | Switch | Hub |
|---|---|---|
| TCP/IP Layer | 1 (Link) | 1 (Link) |
| Addressing | MAC address | None |
| Traffic | Unicast (efficient) | Broadcast (all ports) |
| Collisions | Separate collision domains | Single collision domain |

**VLANs** (Virtual LANs) let you logically segment a switch into separate networks, even on the same physical hardware.`,
  },
  {
    id: 'packet-switching',
    title: 'Packet Switching',
    level: 'Both',
    tags: ['packet switching', 'circuit switching', 'routing'],
    summary: 'Data is broken into small packets that travel independently across the network.',
    body: `**Packet switching** breaks data into small chunks called **packets**. Each packet:
- Has a header (source IP, destination IP, sequence number)
- Travels independently, potentially via different routes
- Is reassembled at the destination

**Advantages:**
- Efficient – network capacity is shared
- Resilient – packets reroute around failures
- Good for bursty data (web browsing)

**Circuit switching** (used in old telephone networks):
- Dedicated path reserved for entire conversation
- Guaranteed bandwidth but wasteful if silent
- Less efficient for data

The **internet uses packet switching**. TCP ensures packets are reassembled in order; UDP doesn't guarantee order (used for video calls where speed matters more than perfection).`,
  },
  {
    id: 'network-security',
    title: 'Network Security',
    level: 'Both',
    tags: ['firewall', 'encryption', 'malware', 'phishing', 'DoS'],
    summary: 'Networks face threats including malware, phishing, DoS attacks, and data interception.',
    body: `**Common threats:**
- **Malware** – viruses, ransomware, spyware
- **Phishing** – fake emails/sites stealing credentials
- **DoS/DDoS** – flooding a server to make it unavailable
- **Man-in-the-Middle** – intercepting communications
- **SQL injection** – malicious database queries
- **Brute force** – trying all password combinations

**Defences:**
- **Firewall** – filters traffic by rules (IP, port, protocol)
- **Encryption** (HTTPS/TLS) – scrambles data in transit
- **Antivirus** – detects and removes malware
- **Strong passwords** + **MFA** – harder to brute force
- **Proxy server** – intermediary that can filter/cache
- **Penetration testing** – ethical hackers find vulnerabilities
- **Physical security** – locks, access cards, CCTV`,
  },
  {
    id: 'topology',
    title: 'Network Topologies',
    level: 'Both',
    tags: ['topology', 'star', 'mesh', 'bus', 'ring'],
    summary: 'Network topology describes how devices are physically or logically connected.',
    body: `**Star topology**
- All devices connect to a central switch/hub
- Most common in modern LANs
- Failure of one cable only affects one device
- Hub/switch failure brings down the whole network

**Mesh topology**
- Every device connects to every other device
- Highly resilient – many redundant paths
- Expensive (many cables)
- Used in WANs and the internet backbone

**Bus topology** (historical)
- All devices on one cable
- Simple and cheap
- One failure can bring down whole network

**Ring topology** (historical)
- Devices connected in a ring
- Data travels in one direction
- Token Ring (IBM) used this

**In practice:** LANs use star topology; the internet uses mesh; Wi-Fi extends star topology wirelessly.`,
  },
  {
    id: 'wired-wireless',
    title: 'Wired vs Wireless',
    level: 'Both',
    tags: ['ethernet', 'Wi-Fi', 'wireless', 'cable'],
    summary: 'Wired connections use cables; wireless uses radio waves. Each has trade-offs.',
    body: `**Ethernet (wired):**
- Uses copper cable (Cat5e, Cat6) or fibre optic
- Speeds: 100 Mbps, 1 Gbps, 10 Gbps
- Very reliable, low latency
- Physically secure (hard to intercept)
- Less flexible (devices must be near a cable)

**Wi-Fi (wireless – IEEE 802.11):**
- Uses radio waves (2.4 GHz and 5 GHz bands)
- Standards: 802.11b/g/n/ac/ax (Wi-Fi 6)
- 2.4 GHz: better range, lower speed, more interference
- 5 GHz: less range, faster, less congestion
- Convenient – no cables needed
- Can be intercepted if not encrypted (use WPA2/WPA3)

**Bluetooth:**
- Short range (~10m) personal area network
- Connects peripherals (keyboards, headphones)
- Lower power consumption`,
  },
  {
    id: 'client-server',
    title: 'Client-Server vs P2P',
    level: 'Both',
    tags: ['client-server', 'peer-to-peer', 'P2P', 'server'],
    summary: 'Client-server has a central server; P2P has equal nodes sharing resources directly.',
    body: `**Client-Server:**
- **Server** – provides services (web, file, email, DNS)
- **Clients** – request services from the server
- Server is always-on, clients connect as needed
- Centralised control and security
- Single point of failure if server goes down
- Example: web browsing, email

**Peer-to-peer (P2P):**
- All nodes are equal – act as both client and server
- No central server needed
- Decentralised – resilient to single failures
- Harder to secure and control
- Examples: BitTorrent, Bitcoin, some VoIP

**Hybrid models:**
- WhatsApp uses servers to connect peers
- Spotify uses CDN servers + some P2P for efficiency`,
  },
  {
    id: 'cloud',
    title: 'Cloud Computing',
    level: 'Both',
    tags: ['cloud', 'SaaS', 'IaaS', 'PaaS', 'virtualisation'],
    summary: 'Cloud computing provides computing resources over the internet on demand.',
    body: `**Cloud computing** delivers computing resources (servers, storage, software) over the internet.

**Service models:**
- **SaaS** (Software as a Service) – use software online (Gmail, Office 365)
- **PaaS** (Platform as a Service) – develop and host apps (Heroku, Google App Engine)
- **IaaS** (Infrastructure as a Service) – rent virtual machines (AWS EC2, Azure)

**Advantages:**
- Scalable – add resources on demand
- Accessible from anywhere
- Reduced upfront hardware costs
- Automatic updates and maintenance

**Disadvantages:**
- Requires internet connection
- Data privacy concerns (data on third-party servers)
- Ongoing subscription costs
- Vendor lock-in
- Latency higher than local storage`,
  },
]
