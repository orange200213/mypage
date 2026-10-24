#!/usr/bin/env bash
# Cloudflare（Pages / Workers Builds）用の配信ディレクトリを作るスクリプト。
#
#   ビルドコマンド   : bash build.sh
#   ビルド出力ディレクトリ : dist
#
# これで .git（履歴の pack が 25MiB を超える）や作業用の素材が
# アセットとして読み込まれなくなる。
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$root"

rm -rf dist
mkdir -p dist

# サイトの実体だけをコピー（.git / 素材むき出しファイルは含めない）
cp -r \
  ./*.html \
  ./*.css \
  ./*.js \
  ./*.xml \
  ./*.json \
  ./*.ico \
  ./*.png \
  ./*.txt \
  images \
  videos \
  fonts \
  dist/ 2>/dev/null || true

# サイトには使わないローカル専用素材は配信対象から外す
rm -f dist/images/Gemini_Generated_*

find dist -type f | wc -l
echo "build.sh: dist/ を作成しました"
