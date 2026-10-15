#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  Private Proxy & Parental Control Server Setup (WireGuard + AdGuard)"
echo "=========================================================="

# 1. Enable IPv4 packet forwarding on the host system if not enabled
echo "[+] Checking kernel packet forwarding..."
if [ "$(cat /proc/sys/net/ipv4/ip_forward)" -ne 1 ]; then
    echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.d/99-wireguard-forward.conf > /dev/null
    sudo sysctl -p /etc/sysctl.d/99-wireguard-forward.conf
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
    sudo usermod -aG docker "$USER"
    echo "[✓] Docker installed successfully."
else
    echo "[✓] Docker is installed."
fi

# 3. Check for .env file
if [ ! -f .env ]; then
    echo "[+] Creating .env file..."
    DETECTED_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "")
    read -p "Enter your VPS Public IP [$DETECTED_IP]: " INPUT_IP
    VPS_IP=${INPUT_IP:-$DETECTED_IP}

    DEFAULT_PASS=$(openssl rand -base64 12 2>/dev/null || echo "MySecurePass123!")
    read -p "Enter a password for the WireGuard Web UI [$DEFAULT_PASS]: " INPUT_PASS
    WG_PASS=${INPUT_PASS:-$DEFAULT_PASS}

    cat <<EOF > .env
VPS_PUBLIC_IP=${VPS_IP}
WG_ADMIN_PASSWORD=${WG_PASS}
EOF
    echo "[✓] .env file created."
else
    echo "[✓] .env file already exists."
fi

# 4. Handle port 53 conflict with systemd-resolved (Common on Ubuntu)
if sudo lsof -i :53 | grep -q "systemd-resolve"; then
    echo "[!] Port 53 is occupied by systemd-resolved on Ubuntu."
    echo "[+] Disabling DNSStubListener in systemd-resolved so AdGuard Home can bind port 53..."
    sudo sed -i 's/#DNSStubListener=yes/DNSStubListener=no/' /etc/systemd/resolved.conf || true
    sudo sed -i 's/DNSStubListener=yes/DNSStubListener=no/' /etc/systemd/resolved.conf || true
    sudo systemctl restart systemd-resolved
    echo "[✓] Port 53 freed for AdGuard Home."
fi

# 5. Open firewall ports (UFW) if UFW is active
if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
    echo "[+] Configuring UFW firewall rules..."
    sudo ufw allow 51820/udp comment 'WireGuard VPN Tunnel'
    sudo ufw allow 51821/tcp comment 'WireGuard Web UI'
    sudo ufw allow 3000/tcp comment 'AdGuard Home Initial Wizard'
    sudo ufw allow 8080/tcp comment 'AdGuard Home Web Dashboard'
    sudo ufw reload
    echo "[✓] Firewall rules configured."
fi

# 6. Launch services
echo "[+] Starting AdGuard Home and WireGuard containers..."
docker compose up -d

source .env
echo ""
echo "=========================================================="
echo "  🎉 SETUP COMPLETE!"
echo "=========================================================="
echo ""
echo "1. AdGuard Home Initial Setup (One-time wizard):"
echo "   URL: http://${VPS_PUBLIC_IP}:3000"
echo "   (Set admin credentials, keep web port on 80/8080 and DNS on 53)"
echo ""
echo "2. WireGuard Web Dashboard (Client & QR Code Generator):"
echo "   URL: http://${VPS_PUBLIC_IP}:51821"
echo "   Password: ${WG_ADMIN_PASSWORD}"
echo ""
echo "3. Connect Android Phone:"
echo "   - Install 'WireGuard' from Google Play Store or F-Droid."
echo "   - In http://${VPS_PUBLIC_IP}:51821, click '+ New Client' (e.g. 'Hamza-Phone')."
echo "   - Scan the QR code using the WireGuard Android app and turn it ON."
echo ""
echo "4. Parental Controls & Website Restrictions:"
echo "   - Open http://${VPS_PUBLIC_IP}:8080 (AdGuard Home)."
echo "   - Go to 'Filters' -> 'Blocked Services' to block TikTok, YouTube, etc. with 1 click."
echo "   - Go to 'Filters' -> 'Custom filtering rules' to block any specific website URL."
echo "   - Enable 'SafeSearch' and 'Parental Control' under 'Settings' -> 'General Settings'."
echo "=========================================================="
