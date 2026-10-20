#!/bin/sh
# Compila e monta CreativeHome.app em dist/ (só precisa das Command Line Tools).
set -e
cd "$(dirname "$0")"
APP="dist/CreativeHome.app"
rm -rf dist && mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O -swift-version 5 main.swift Discos.swift Onboarding.swift -o "$APP/Contents/MacOS/CreativeHome"
cp Info.plist "$APP/Contents/Info.plist"
cp icon.icns "$APP/Contents/Resources/icon.icns"
codesign --force --sign - "$APP"
echo "ok: $APP"
