#!/usr/bin/env bash
set -euo pipefail

npm --prefix services/backend run format
npm --prefix services/telegram_bot run format
dart format --set-exit-if-changed apps/child_app
terraform -chdir=infra/terraform fmt -recursive -check
