#!/usr/bin/env bash
set -euo pipefail

npm --prefix services/backend run format
flutter format --set-exit-if-changed apps/child_app apps/parent_app
terraform -chdir=infra/terraform fmt -recursive -check
