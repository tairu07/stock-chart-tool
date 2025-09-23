#!/bin/bash

# 仕様書に基づいたディレクトリ構造を作成

# src/app配下のディレクトリ
mkdir -p src/app/\(dashboard\)
mkdir -p src/app/stocks/\[code\]
mkdir -p src/app/api/stock/\[code\]
mkdir -p src/app/api/list
mkdir -p src/app/api/meta
mkdir -p src/app/api/marks
mkdir -p src/app/api/history
mkdir -p src/app/api/revalidate

# src/components配下のディレクトリ
mkdir -p src/components/chart
mkdir -p src/components/controls
mkdir -p src/components/marks
mkdir -p src/components/ui

# src/lib配下のディレクトリ
mkdir -p src/lib/db
mkdir -p src/lib/cache
mkdir -p src/lib/utils
mkdir -p src/lib/jquants

# scriptsディレクトリ
mkdir -p scripts

# publicディレクトリ配下
mkdir -p public/icons
mkdir -p public/og

echo "ディレクトリ構造の作成が完了しました。"
