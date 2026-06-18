#!/usr/bin/env bash
set -euo pipefail

npm --prefix services/backend run lint
npm --prefix services/telegram_bot run lint

pushd apps/child_app >/dev/null
flutter analyze
popd >/dev/null

terraform -chdir=infra/terraform/environments/dev validate
