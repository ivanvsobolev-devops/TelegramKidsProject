#!/usr/bin/env bash
set -euo pipefail

npm --prefix services/backend run build
npm --prefix services/telegram_bot run build

pushd apps/child_app >/dev/null
flutter create --platforms=android --no-pub .
flutter build apk --debug
popd >/dev/null
