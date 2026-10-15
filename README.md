# 🛡️ Private Proxy & Parental Control Server (WireGuard + AdGuard Home)

A 100% free, self-hosted, encrypted proxy and parental control solution built using **WireGuard** and **AdGuard Home** running in Docker.

---

## 🌟 Features

- **100% Free Forever**: Zero subscription fees, zero licensing costs, zero third-party telemetry.
- **Full Device Traffic Privacy**: Uses WireGuard (modern cryptography) to tunnel 100% of phone traffic (Wi-Fi and 4G/5G) through your VPS. Your mobile carrier and local Wi-Fi provider cannot trace or inspect which sites you visit.
- **Parental Controls & Website Restriction**:
  - **1-Click Service Blocking**: Easily toggle off TikTok, YouTube, Instagram, Facebook, Discord, Roblox, Steam, etc.
  - **Custom Domain Blocking**: Block any specific domain (e.g., `||example.com^`).
  - **SafeSearch & Adult Content Filter**: Force SafeSearch on Google, Bing, YouTube, DuckDuckGo, and block adult websites.
  - **Live Query Log**: Inspect all DNS requests in real-time to see blocked vs allowed queries.
- **Scan-to-Connect QR Code**: Web dashboard generates an instant QR code for your Android phone.
- **Bypass-Proof on Android**: Supports Android's native *Always-On VPN* and *Block connections without VPN*.

---

## 📐 Architecture

```
[ Android Mobile Phone ]
       │  (Encrypted WireGuard Tunnel: ChaCha20-Poly1305)
       ▼
 [ VPS: WireGuard Server (wg-easy) ]
       │
       ├──► DNS Query ──► [ AdGuard Home (10.2.0.100) ]
       │                     │
       │                     ├── Allowed? ──► Upstream DNS (Cloudflare / Quad9)
       │                     └── Blocked? ──► Sinkhole (0.0.0.0) [Access Denied]
       │
       └──► Outgoing Web Traffic ──► [ Internet via VPS Public IP ]
```

---

## 🚀 Quick Setup on your VPS

### Step 1: Copy this Project to your VPS
You can copy this folder to your VPS using `scp` or `rsync`:

```bash
# From your local machine:
scp -r /home/hamza/MyProjects/OwnProxyServer root@<YOUR_VPS_IP>:~/OwnProxyServer
```

Or on your VPS, clone/create the directory:
```bash
ssh root@<YOUR_VPS_IP>
cd ~/OwnProxyServer
```

### Step 2: Run the Automated Setup Script
On your VPS, simply run:

```bash
chmod +x setup.sh
./setup.sh
```

The script automatically:
1. Enables Linux kernel IPv4 packet forwarding (`net.ipv4.ip_forward=1`).
2. Installs Docker & Docker Compose (if not already installed).
3. Creates `.env` and detects your VPS IP.
4. Frees port 53 if Ubuntu's `systemd-resolved` is holding it.
5. Configures UFW firewall rules.
6. Starts both containers via Docker Compose.

---

## ⚙️ Configuration & Activation

### Step 3: Complete AdGuard Home Initial Wizard
1. Open your browser and navigate to:
   ```
   http://<YOUR_VPS_IP>:3000
   ```
2. Click **Get Started**.
3. **Admin Web Interface**:
   - Listen interface: `All interfaces`
   - Port: `80` (or `8080`)
4. **DNS Server**:
   - Listen interface: `All interfaces`
   - Port: `53`
5. Set your **Admin Username** and **Password** (save these!).
6. Finish the wizard. The dashboard will now be accessible at:
   ```
   http://<YOUR_VPS_IP>:8080
   ```

---

### Step 4: Connect Your Android Phone via WireGuard
1. Open the WireGuard Web UI in your browser:
   ```
   http://<YOUR_VPS_IP>:51821
   ```
2. Enter the `WG_ADMIN_PASSWORD` you configured in `.env`.
3. Click **+ New Client** (e.g., name it `Android-Phone`).
4. Click the **QR Code** icon next to the client.
5. On your Android phone:
   - Download the free [WireGuard app from Google Play Store](https://play.google.com/store/apps/details?id=com.wireguard.android) or F-Droid.
   - Open WireGuard on Android, tap the `+` button at bottom right, and select **Scan from QR code**.
   - Give the tunnel a name (e.g. `Private-Proxy`) and tap **Save**.
   - Tap the toggle switch to turn it **ON**.

> 🎉 **Test it**: Open any browser on your Android phone and visit [whatismyipaddress.com](https://whatismyipaddress.com). You will see your VPS's IP address instead of your phone's mobile/carrier IP.

---

## 🔒 Parental Control & Website Restrictions

All restriction rules are managed in the AdGuard Home dashboard (`http://<YOUR_VPS_IP>:8080`):

### 1. Block Popular Apps & Services (1-Click)
- Go to **Filters** ➡️ **Blocked services**.
- Check any services you wish to restrict:
  - *TikTok, YouTube, Instagram, Facebook, Discord, Roblox, Steam, Netflix, Reddit, Twitch, etc.*
- Click **Save**. The apps/websites are immediately blocked on the phone.

### 2. Block Specific Websites & Domains
- Go to **Filters** ➡️ **Custom filtering rules**.
- Add rules one per line using AdGuard filter syntax:
  ```adblock
  ||restricted-website.com^
  ||gambling.com^
  ||badsite.org^
  ```
- Click **Save**.

### 3. Enable SafeSearch & Adult Site Blocker
- Go to **Settings** ➡️ **General settings**.
- Enable **Block domains using Parental Control**.
- Enable **Enforce SafeSearch** (enforces strict safe search on Google, YouTube, Bing, and DuckDuckGo).
- Click **Save**.

### 4. Monitor & Audit Activity
- Go to **Query Log**.
- You can inspect every request made by the phone in real time, see what was blocked, and click "Block" or "Unblock" directly from the log.

---

## 📱 Locking Down Android (Preventing Bypassing)

To ensure the proxy cannot be turned off or bypassed:

1. **Enable Android Always-On VPN**:
   - On Android: Go to **Settings** ➡️ **Network & internet** ➡️ **VPN**.
   - Tap the gear/cog icon next to **WireGuard**.
   - Turn **ON**:
     - `Always-on VPN`
     - `Block connections without VPN` *(Kill switch: phone cannot access the internet unless connected to your proxy)*.

2. **Preventing App Uninstall / Disabling**:
   - If setting this up on a child's phone, pair this with **Google Family Link** (free) to block unauthorized app uninstalls or changes to VPN settings.

---

## 🔧 Useful Commands

| Action | Command |
|---|---|
| View container status | `docker compose ps` |
| View live logs | `docker compose logs -f` |
| Restart services | `docker compose restart` |
| Stop services | `docker compose down` |
| Update containers | `docker compose pull && docker compose up -d` |
