#!/bin/bash
# 把公開檔案同步到 gh-pages 分支並推送上線。
#
# admin.html 與 interpreter_admin.html 這兩個後台也在清單內（要能在手機、iPad 上用），
# 靠 admin_gate.js 的密碼遮罩擋掉路過的人。那只是門檻不是保險箱：密碼雖然存在
# Apps Script 後端、原始碼裡看不到，但「驗證通過就顯示畫面」跑在瀏覽器，懂的人
# 繞得過去。真正擋住竄改的是寫入憑證——商品後台要 GitHub PAT、知識庫要 token。
# 內部文件（*.md 等）仍然不在清單內，不會離開這台電腦。
#
#   用法：./deploy.sh
#
set -e
cd "$(dirname "$0")"

# 要公開的檔案。新增頁面時在這裡加一行。
FILES=(
  index.html
  homepage.html
  menu_selector_final.html
  menu_selector.css
  menu_app.js
  products_data.js
  products_multilingual.json
  vue.global.prod.js
  interpreter.html
  interpreter_admin.html
  admin.html
  admin_gate.js
  knowledge_base.js
  xlsx.full.min.js
  presentation_mobile_ai.html
  presentation.html
)

if [ -n "$(git status --porcelain)" ]; then
  echo "✕ 還有沒提交的修改，請先 git commit 再部署。"
  git status --short
  exit 1
fi

SRC=$(git branch --show-current)
TMP=$(mktemp -d)
for f in "${FILES[@]}"; do
  mkdir -p "$TMP/$(dirname "$f")"
  cp "$f" "$TMP/$f"
done

git checkout gh-pages
for f in "${FILES[@]}"; do cp "$TMP/$f" "$f"; done
touch .nojekyll
git add -A "${FILES[@]}" .nojekyll

if git diff --cached --quiet; then
  echo "・ 公開檔案沒有變化，不需要重新部署。"
else
  git commit -q -m "更新公開網站檔案（$(date '+%Y-%m-%d %H:%M')）"
  echo "✓ 已更新 gh-pages"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git push origin gh-pages
  echo "✓ 已推送，約 1 分鐘後生效"
else
  echo "！還沒設定 origin，請先執行："
  echo "  git remote add origin https://github.com/<你的帳號>/diy-baking-menu.git"
fi

git checkout -f "$SRC"
rm -rf "$TMP"
echo "✓ 已切回 $SRC"
