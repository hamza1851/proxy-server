# 🛡️ Personal Proxy & Privacy Server (WireGuard + AdGuard Home)

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/WireGuard-ChaCha20--Poly1305-88171A?logo=wireguard&logoColor=white" alt="WireGuard">
  <img src="https://img.shields.io/badge/AdGuard_Home-DNS_Sinkhole-00A65A?logo=adguard&logoColor=white" alt="AdGuard">
  <img src="https://img.shields.io/badge/Platform-Android_%7C_iOS_%7C_macOS_%7C_Windows_%7C_Linux-blueviolet" alt="Multiplatform">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen" alt="PRs Welcome">
</p>

<p align="center">
  <strong>Turn any VPS into your own high-speed, encrypted private proxy server with built-in ad-blocking, parental controls, and full website restriction capabilities in under 60 seconds.</strong>
</p>

---

## 📑 Table of Contents

- [Why This Project?](#-why-this-project)
- [How It Works](#-how-it-works)
- [1-Minute Quick Start](#-1-minute-quick-start)
- [Web Dashboards](#-web-dashboards)
- [Connecting Your Devices](#-connecting-your-devices)
  - [Android Phones & Tablets](#1-android-phones--tablets)
  - [iPhone & iPad (iOS)](#2-iphone--ipad-ios)
  - [Windows & macOS Laptops](#3-windows--macos-laptops)
  - [Linux Desktops & Servers](#4-linux-desktops--servers)
- [Restricting Websites & Parental Controls](#-restricting-websites--parental-controls)
  - [1-Click Service Blocking](#1-one-click-app--service-blocking)
  - [Custom Domain Blocking](#2-custom-domain-blocking)
  - [SafeSearch & Adult Content Filter](#3-safesearch--adult-site-filter)
  - [Real-Time Query Log](#4-live-query-audit-log)
- [Cloud Firewall & Security Groups](#-cloud-firewall--security-group-notice)
- [Maintenance & Useful Commands](#-management-commands)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 Why This Project?

Commercial VPNs and proxy services cost recurring monthly fees, track user metadata, and offer zero control over what content is allowed or blocked across your family's devices.

This project delivers **complete digital sovereignty**:
- 🚀 **100% Free Forever**: Zero subscriptions, zero licensing fees, zero device limits. Runs on any VPS (including Oracle Cloud Free Tier, DigitalOcean, Hetzner, AWS Lightsail, Linode, etc.).
- 🔒 **Zero Traceability & Full Encryption**: All traffic from your phone, laptop, or tablet is tunneled through your VPS using WireGuard's state-of-the-art cryptography (`ChaCha20-Poly1305`). Your local ISP, cellular provider, and public Wi-Fi operators cannot snoop on your requests or see what websites you visit.
- 👨‍👩‍👧‍👦 **Built-in Parental Controls**: 1-click toggles to restrict TikTok, YouTube, Discord, Roblox, Steam, adult sites, gambling, and social platforms.
- 🚫 **Network-Wide Ad & Tracker Blocker**: Blocks intrusive ads, telemetry, and phishing domains at the DNS level before they reach your device, saving mobile bandwidth and battery life.
- 📲 **Universal Device Support**: Connect **Android**, **iPhone / iPad**, **macOS**, **Windows**, **Linux**, or home routers via a simple QR code or configuration profile.

---

## 📐 How It Works

```
  [ Your Devices ]
  (Phone / Laptop / Tablet / TV)
          │
          │  Encrypted WireGuard Tunnel (ChaCha20-Poly1305)
          ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  Your VPS                                                   │
   │                                                             │
   │  ┌─────────────────────────┐     ┌───────────────────────┐  │
   │  │   WireGuard (wg-easy)   │────►│     AdGuard Home      │  │
   │  │  - Web Admin UI (:51821)│     │  - DNS Sinkhole (:53) │  │
   │  │  - QR Code generator    │     │  - Parental Control   │  │
   │  │  - Full Tunnel Routing  │     │  - Web Dashboard      │  │
   │  └─────────────────────────┘     └───────────┬───────────┘  │
   │               │                              │              │
   └───────────────┼──────────────────────────────┼──────────────┘
                   │                              ▼
                   │                  Is Domain Blocked?
                   │                 /                  \
                   │           Yes  /                    \ No
                   │               ▼                      ▼
                   │        [ Blocked / Sinkhole ]   [ Quad9 / Cloudflare DNS ]
                   ▼
       [ Encrypted Internet Traffic Out via VPS Public IP ]
```

---

## ⚡ 1-Minute Quick Start

### Option A: The One-Liner (Fastest)
SSH into your VPS and run this single command:

```bash
curl -sSL https://raw.githubusercontent.com/hamza1851/proxy-server/main/setup.sh | bash
```

### Option B: Clone & Run Manually

```bash
# 1. Clone the repository
git clone https://github.com/hamza1851/proxy-server.git
cd proxy-server

# 2. Run the interactive installer
chmod +x setup.sh
./setup.sh
```

The script automatically:
1. Enables Linux kernel packet forwarding (`net.ipv4.ip_forward = 1`).
2. Installs Docker & Docker Compose if missing.
3. Resolves Ubuntu/Debian port 53 conflicts (`systemd-resolved`).
4. Configures host firewall rules (`UFW`).
5. Launches both containers on an isolated Docker bridge network.

---

## 🌐 Web Dashboards

Once installed, two web dashboards are available:

| Dashboard | URL | Purpose |
|---|---|---|
| **WireGuard Web UI** | `http://<YOUR_VPS_IP>:51821` | Create device clients, scan QR codes, download `.conf` files |
| **AdGuard Home Wizard** | `http://<YOUR_VPS_IP>:3000` | Initial 1-time setup wizard (set admin username & password) |
| **AdGuard Home Dashboard**| `http://<YOUR_VPS_IP>:8080` | Parental controls, blocklists, live query log, SafeSearch |

---

## 📱 Connecting Your Devices

### 1. Android Phones & Tablets
1. Open the WireGuard Web UI (`http://<YOUR_VPS_IP>:51821`) in your browser.
2. Click **+ New Client** (e.g., name it `My-Android`).
3. Click the **QR Code** icon.
4. Install the free [WireGuard app from Google Play](https://play.google.com/store/apps/details?id=com.wireguard.android) or [F-Droid](https://f-droid.org/packages/com.wireguard.android/).
5. Open the app, tap `+` ➡️ **Scan from QR code** ➡️ Give it a name and toggle it **ON**.

> **🔒 Android Anti-Bypass (Parental Lockdown)**:
> In Android **Settings** ➡️ **Network & internet** ➡️ **VPN** ➡️ tap the gear next to WireGuard ➡️ Turn on **Always-on VPN** and **Block connections without VPN**. If the VPN is turned off, internet access is severed automatically.

### 2. iPhone & iPad (iOS)
1. Open `http://<YOUR_VPS_IP>:51821` and click **+ New Client** (e.g., `My-iPhone`).
2. Install the free [WireGuard app from Apple App Store](https://apps.apple.com/app/wireguard/id1441195209).
3. Open the app, tap **Add a tunnel** ➡️ **Create from QR code** ➡️ Scan and connect.

### 3. Windows & macOS Laptops
1. In `http://<YOUR_VPS_IP>:51821`, click **+ New Client** (e.g., `My-Laptop`).
2. Click the **Download** icon to save the `.conf` file.
3. Download the official [WireGuard client for Windows or Mac](https://www.wireguard.com/install/).
4. Click **Import tunnel(s) from file**, select the downloaded `.conf` file, and click **Activate**.

### 4. Linux Desktops & Servers
```bash
sudo apt install wireguard
sudo cp My-Laptop.conf /etc/wireguard/wg0.conf
sudo wg-quick up wg0
```

---

## 🛡️ Restricting Websites & Parental Controls

Manage all restriction rules in the AdGuard Home dashboard (`http://<YOUR_VPS_IP>:8080`):

### 1. One-Click App & Service Blocking
Go to **Filters** ➡️ **Blocked services**:
- Toggle off any service with a single click:
  - *TikTok, YouTube, Discord, Roblox, Steam, Netflix, Instagram, Facebook, Reddit, Twitch, Twitter/X, etc.*
- Click **Save**. The apps and websites stop working immediately across all connected devices.

### 2. Custom Domain Blocking
Go to **Filters** ➡️ **Custom filtering rules**:
- Block any specific website domain using standard syntax:
  ```adblock
  ||badwebsite.com^
  ||gambling-site.net^
  ||example.org^
  ```
- Click **Save**.

### 3. SafeSearch & Adult Site Filter
Go to **Settings** ➡️ **General settings**:
- ✅ Enable **Block domains using Parental Control**
- ✅ Enable **Enforce SafeSearch** (locks Google, YouTube, Bing, and DuckDuckGo to strict family-safe results)
- Click **Save**.

### 4. Live Query Audit Log
Go to **Query Log** to view real-time requests from your devices, see what was blocked, or block new domains on the fly.

---

## ☁️ Cloud Firewall / Security Group Notice

If your VPS provider uses an external firewall (AWS Security Groups, Oracle Cloud VCN, Google Cloud, Azure, DigitalOcean Cloud Firewall), ensure the following inbound ports are open:

| Port | Protocol | Usage | Required |
|---|---|---|---|
| `51820` | **UDP** | WireGuard VPN Tunnel Traffic | **Yes** (Public) |
| `51821` | **TCP** | WireGuard Web Admin Dashboard | Yes |
| `8080` | **TCP** | AdGuard Home Dashboard | Yes |
| `3000` | **TCP** | AdGuard Initial Setup Wizard | Yes (First run only) |

---

## 🛠️ Management Commands

Run these inside the project directory:

```bash
# View container status
docker compose ps

# View live logs
docker compose logs -f

# Restart the proxy
docker compose restart

# Stop the proxy
docker compose down

# Update to latest versions
docker compose pull && docker compose up -d
```

---

## ❓ Troubleshooting & FAQ

<details>
<summary><strong>1. Port 53 is already in use by systemd-resolved</strong></summary>

On Ubuntu and Debian systems, `systemd-resolved` binds to port 53 by default. `setup.sh` handles this automatically, but if you need to fix it manually:
```bash
sudo sed -i 's/#DNSStubListener=yes/DNSStubListener=no/' /etc/systemd/resolved.conf
sudo sed -i 's/DNSStubListener=yes/DNSStubListener=no/' /etc/systemd/resolved.conf
sudo systemctl restart systemd-resolved
```
</details>

<details>
<summary><strong>2. Connected to WireGuard, but have no Internet access</strong></summary>

Ensure IPv4 packet forwarding is enabled on your host VPS:
```bash
sudo sysctl net.ipv4.ip_forward
# If it returns 0, enable it:
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.d/99-wireguard-forward.conf
sudo sysctl -p /etc/sysctl.d/99-wireguard-forward.conf
```
Also verify that UDP port `51820` is open in your cloud provider's firewall / security group.
</details>

<details>
<summary><strong>3. How do I change upstream DNS servers?</strong></summary>

In the AdGuard Home dashboard (`http://<YOUR_VPS_IP>:8080`), go to **Settings** ➡️ **DNS settings** and configure your preferred upstream resolvers (e.g., Quad9 `tls://dns.quad9.net` or Cloudflare `https://cloudflare-dns.com/dns-query`).
</details>

<details>
<summary><strong>4. How do I back up my configuration?</strong></summary>

All WireGuard keys, client configurations, and AdGuard blocking rules are stored in the local directories `wireguard-data/`, `adguard-conf/`, and `adguard-work/`. Simply back up these folders or create a tarball:
```bash
tar -czvf proxy-backup.tar.gz .env wireguard-data adguard-conf adguard-work
```
</details>

---

## 🤝 Contributing

Contributions, issues, and feature requests are very welcome!
Feel free to check the [issues page](https://github.com/hamza1851/proxy-server/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
