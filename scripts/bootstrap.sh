#!/usr/bin/env bash
set -euo pipefail

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command npm
require_command flutter
require_command terraform

npm install --prefix services/backend

pushd apps/child_app >/dev/null
flutter create --platforms=android --no-pub .
flutter pub get
popd >/dev/null

pushd apps/parent_app >/dev/null
flutter create --platforms=android --no-pub .
flutter pub get
popd >/dev/null

terraform -chdir=infra/terraform/environments/dev init -backend=false
