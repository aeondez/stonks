#!/bin/bash
# stonks — install and launch the Stonks server
# Usage:
#   First time:   stonks install
#   Every time:   stonks
#
# To set up the alias, add this line to your ~/.bashrc or ~/.zshrc:
#   alias stonks="bash /path/to/stonks/stonks.sh"
# Then run: source ~/.bashrc

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$1" in
  install)
    echo "Installing dependencies..."
    cd "$SCRIPT_DIR" && npm install
    echo ""
    echo "Done. Run 'stonks' to start the server."
    ;;
  *)
    cd "$SCRIPT_DIR" && npm start
    ;;
esac
