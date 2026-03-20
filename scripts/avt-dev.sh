#!/bin/bash
# AVT Video Editor - Development Startup
# Starts both the OpenClaw gateway and the Vite dev server

set -e

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Set config path
export OPENCLAW_CONFIG_PATH="$(pwd)/openclaw.config.json"
export OPENCLAW_SKIP_CHANNELS=1
export CLAWDBOT_SKIP_CHANNELS=1
export AVT_STATE_DIR="$(pwd)/.avt"

# Create state directory
mkdir -p "$AVT_STATE_DIR"

echo "🦞 Starting AVT Video Editor..."
echo "   Config: $OPENCLAW_CONFIG_PATH"
echo "   State:  $AVT_STATE_DIR"
echo ""

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "sk-ant-YOUR_KEY_HERE" ]; then
  echo "⚠️  ANTHROPIC_API_KEY not set. Edit .env with your key."
  echo "   The gateway will start but AI chat won't work until the key is set."
  echo ""
fi

# Start the composition API server (bridges .avt/composition.json to HTTP)
node scripts/avt-composition-server.mjs &
COMP_PID=$!

# Start Vite dev server
cd ui && npx vite --port 3001 --host &
VITE_PID=$!
cd ..

# Start OpenClaw gateway
echo "🚀 Starting OpenClaw gateway on ws://localhost:18789..."
node scripts/run-node.mjs --dev gateway &
GW_PID=$!

# Trap exit to kill all processes
trap "kill $COMP_PID $VITE_PID $GW_PID 2>/dev/null; exit" INT TERM

echo ""
echo "✅ AVT Video Editor running:"
echo "   🎬 Editor:  http://localhost:3001"
echo "   🔌 Gateway: ws://localhost:18789"
echo "   📁 API:     http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all services."

wait
