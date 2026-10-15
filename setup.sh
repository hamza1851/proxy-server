#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  🛡️  Private Proxy & Privacy Server (WireGuard + AdGuard)"
echo "  Deploy on any VPS • 100% Free & Open Source"
echo "=========================================================="

# If running directly without the repository files, clone or enter directory
if [ ! -f "docker-compose.yml" ]; then
    echo "[+] Downloading project files from GitHub..."
    if command -v git &> /dev/null; then
        git clone https://github.com/hamza1851/proxy-server.git
        cd proxy-server
    else
        mkdir -p proxy-server && cd proxy-server
        curl -fsSL https://raw.githubusercontent.com/hamza1851/proxy-server/main/docker-compose.yml -o docker-compose.yml
        curl -fsSL https://raw.githubusercontent.com/hamza1851/proxy-server/main/.env.example -o .env.example
    fi
fi

# 1. Enable IPv4 packet forwarding on the host system if not enabled
echo "[+] Checking kernel packet forwarding..."
if [ "$(cat /proc/sys/net/ipv4/ip_forward 2>/dev/null || echo 0)" -ne 1 ]; then
    echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.d/99-wireguard-forward.conf > /dev/null
    sudo sysctl -p /etc/sysctl.d/99-wireguard-forward.conf 2>/dev/null || sudo sysctl -w net.ipv4.ip_forward=1
    echo "[✓] IPv4 packet forwarding enabled."
else
    echo "[✓] IPv4 packet forwarding already active."
fi

# 2. Check Docker and Docker Compose
echo "[+] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "[!] Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    sudo usermod -aG docker "$USER" 2>/dev/null || true
    echo "[✓] Docker installed successfully."
else
    echo "[✓] Docker is installed."
fi

# 3. Check for .env file
if [ ! -f .env ]; then
    echo "[+] Creating .env file..."
    DETECTED_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "")
    
    # Read from /dev/tty if available so curl | bash pipes work interactively
    if [ -t 0 ]; then
        read -p "Enter your VPS Public IP [$DETECTED_IP]: " INPUT_IP
    elif [ -e /dev/tty ]; then
        read -p "Enter your VPS Public IP [$DETECTED_IP]: " INPUT_IP < /dev/tty
    else
        INPUT_IP=""
    fi
    VPS_IP=${INPUT_IP:-$DETECTED_IP}

    DEFAULT_PASS=$(openssl rand -base64 12 2>/dev/null || echo "MySecurePass123!")
    if [ -t 0 ]; then
        read -p "Enter a password for WireGuard Web UI [$DEFAULT_PASS]: " INPUT_PASS
    elif [ -e /dev/tty ]; then
        read -p "Enter a password for WireGuard Web UI [$DEFAULT_PASS]: " INPUT_PASS < /dev/tty
    else
        INPUT_PASS=""
    fi
    WG_PASS=${INPUT_PASS:-$DEFAULT_PASS}

    cat <<EOF > .env
VPS_PUBLIC_IP=${VPS_IP}
WG_ADMIN_PASSWORD=${WG_PASS}
EOF
    echo "[✓] .env file created."
else
    echo "[✓] .env file already exists."
fi

# 4. Handle port 53 conflict with systemd-resolved (Common on Ubuntu/Debian)
if sudo lsof -i :53 2>/dev/null | grep -q "systemd-resolve"; then
    echo "[!] Port 53 is occupied by systemd-resolved on host OS."
    echo "[+] Disabling DNSStubListener in systemd-resolved so AdGuard Home can bind port 53..."
    sudo sed -i 's/#DNSStubListener=yes/DNSStubListener=no/' /etc/systemd/resolved.conf || true
    sudo sed -i 's/DNSStubListener=yes/DNSStubListener=no/' /etc/systemd/resolved.conf || true
    sudo systemctl restart systemd-resolved 2>/dev/null || true
    echo "[✓] Port 53 freed for AdGuard Home."
fi

# 5. Open firewall ports (UFW) if active
if command -v ufw &> /dev/null && sudo ufw status 2>/dev/null | grep -q "Status: active"; then
    echo "[+] Configuring UFW firewall rules..."
    sudo ufw allow 51820/udp comment 'WireGuard VPN Tunnel'
    sudo ufw allow 51821/tcp comment 'WireGuard Web UI'
    sudo ufw allow 3000/tcp comment 'AdGuard Home Initial Wizard'
    sudo ufw allow 8080/tcp comment 'AdGuard Home Web Dashboard'
    sudo ufw allow 8888/tcp comment 'God-Level Cyber-Command Dashboard'
    sudo ufw reload
    echo "[✓] Firewall rules configured."
fi

# 6. Launch services
echo "[+] Building and starting containers..."
docker compose up -d --build

source .env
DASH_PORT=${DASHBOARD_PORT:-8888}
echo ""
echo "================================================================="
echo "  🎉 CONGRATULATIONS! YOUR GOD-LEVEL PROXY SERVER IS LIVE!"
echo "================================================================="
echo ""
echo "⚡ [MASTER COMMAND CENTER] GOD-LEVEL CYBER-COMMAND HUD:"
echo "   URL: http://${VPS_PUBLIC_IP}:${DASH_PORT}"
echo "   (Live telemetry, real-time intercept feed, instant killswitch & target matrix)"
echo ""
echo "1. Initial AdGuard Home Setup (1-minute wizard):"
echo "   URL: http://${VPS_PUBLIC_IP}:3000"
echo "   Set your admin username and password."
echo ""
echo "2. WireGuard Web UI (Client & QR Code Generator):"
echo "   URL: http://${VPS_PUBLIC_IP}:51821"
echo "   Password: ${WG_ADMIN_PASSWORD}"
echo "   - Click '+ New Client' (e.g., 'My-Phone', 'My-Laptop', 'My-iPad')"
echo ""
echo "3. Connect Your Devices:"
echo "   📱 Mobile (Android / iPhone / iPad):"
echo "      Install free 'WireGuard' app, tap '+', and scan the QR code."
echo ""
echo "   💻 Computer (Windows / macOS / Linux):"
echo "      Download the '.conf' profile from the web UI and import it into WireGuard."
echo "================================================================="
