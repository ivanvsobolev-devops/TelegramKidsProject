#!/usr/bin/env bash
set -euo pipefail

npm --prefix services/backend run build

pushd apps/child_app >/dev/null
flutter create --platforms=android --no-pub .
flutter build apk --debug
popd >/dev/null

pushd apps/parent_app >/dev/null
flutter create --platforms=android --no-pub .
flutter build apk --debug
popd >/dev/null
