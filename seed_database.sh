#!/usr/bin/env bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/backend"
echo "[*] Performing complete database reset and test account creation..."
python3 complete_reset.py
echo "[*] Seeding and reset finished!"
