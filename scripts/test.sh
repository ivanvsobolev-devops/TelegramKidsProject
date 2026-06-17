#!/usr/bin/env bash
set -euo pipefail

npm --prefix services/backend test

pushd apps/child_app >/dev/null
flutter test
popd >/dev/null

pushd apps/parent_app >/dev/null
flutter test
popd >/dev/null
