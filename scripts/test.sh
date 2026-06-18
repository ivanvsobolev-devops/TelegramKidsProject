#!/usr/bin/env bash
set -euo pipefail

npm --prefix services/backend test
npm --prefix services/telegram_bot test

pushd apps/child_app >/dev/null
flutter test
popd >/dev/null
