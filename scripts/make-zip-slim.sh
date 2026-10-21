#!/usr/bin/env bash
# 精简包 /workspace/magic-tower-slim.zip：源码 + 文档 + 脚本，不含截图（shots/*.png）、*.mp3、*.log、node_modules、dist（须 < 25 MB）
set -e
cd "$(dirname "$0")/../.."
OUT=/workspace/magic-tower-slim.zip
rm -f "$OUT"
LIST=$(mktemp)
find magic-tower -path magic-tower/node_modules -prune -o -path magic-tower/dist -prune -o -path magic-tower/agent-tools -prune -o -path magic-tower/.git -prune -o -type f -print \
  | grep -vE '\.(mp3|log)$' | grep -vE '^magic-tower/shots/.*\.png$' | grep -v '/screenshot.png$' > "$LIST"
python3 magic-tower/scripts/zipfiles.py "$OUT" "$LIST"
rm -f "$LIST"
SIZE=$(stat -c %s "$OUT")
ls -la "$OUT"
if [ "$SIZE" -ge 26214400 ]; then echo "精简包超过 25 MB！" >&2; exit 1; fi
