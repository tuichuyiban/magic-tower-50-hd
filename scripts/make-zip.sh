#!/usr/bin/env bash
# 打包 /workspace/magic-tower.zip（不含 node_modules / dist；每区挑几张截图）
set -e
cd "$(dirname "$0")/../.."
OUT=/workspace/magic-tower.zip
SHOTS="01-floor1-start 09-floor10-ambush 16-fly-ui 18-backpack-panel 20-start-screen-test-mode 21-test-mode-11f 24-floor14-hidden-red-key 25-floor15-octopus 28-floor20-vampire-appears 29-floor20-boss-cleared 30-use-confirm-pickaxe 32-settings-bgm-preview 33-item-value-labels
z3-01-test-mode-zone-select z3-03-floor23-invisible-maze z3-05-floor26-princess z3-06-floor50-arrival
z4-02-game-over z4-04-floor34-hidden-red-key z4-05-floor35-dragon z4-07-floor40-knight-battle
z5-01-floor41-map-damage z5-04-floor44-divine-shield z5-07-floor49-zeno z5-09-ending-te
fix-wizard-sprites fix-fly-ui-current-floor fix-fly-ui-tap-preview fix-shop-feedback fix-start-options fix-29f-thief-dig fix-41f-after-hidden-wall fix-36f-secret-passage fix-48f-hidden-guard
fix-altar-highlight-def fix-auto-settings-simple fix-centerfly-preview-green fix-centerfly-preview-red fix-41f-route-open fix-35f-auto-hidden-all z4-07b-floor40-captain-charges
r3-save-page r3-load-page r3-page-100 r3-save-flash r3-storage-full r3-48f-ghost r3-48f-ghost-dialog r4-save-page-2x2-tablet r4-load-page-2x2-tablet
autoclear-fx-contact-sheet autoclear-fx-divine-full autoclear-fx-instant-full
wfx-contact-sheet wfx-divine-full wfx-mobile-contact-sheet wfx-mobile-silver-full wfx-mobile-instant-silver"
rm -f "$OUT"
LIST=$(mktemp)
find magic-tower -path magic-tower/node_modules -prune -o -path magic-tower/dist -prune -o -path magic-tower/shots -prune -o -path magic-tower/agent-tools -prune -o -path magic-tower/.git -prune -o -type f ! -name screenshot.png -print \
  | grep -vE '\.(mp3|log)$' > "$LIST"
for s in $SHOTS; do [ -f "magic-tower/shots/$s.png" ] && echo "magic-tower/shots/$s.png" >> "$LIST"; done
python3 magic-tower/scripts/zipfiles.py "$OUT" "$LIST"
rm -f "$LIST"
ls -la "$OUT"
