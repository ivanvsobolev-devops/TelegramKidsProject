#!/usr/bin/env bash
set -euo pipefail

npm --prefix services/backend run lint

pushd apps/child_app >/dev/null
flutter analyze
popd >/dev/null

pushd apps/parent_app >/dev/null
flutter analyze
popd >/dev/null

terraform -chdir=infra/terraform/environments/dev validate
