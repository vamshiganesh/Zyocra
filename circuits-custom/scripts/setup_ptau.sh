#!/usr/bin/env bash
# Download Hermez powers-of-tau ceremony file (pot14) if missing.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYS="$ROOT/keys"
PTAU="$KEYS/pot14_final.ptau"
URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau"

mkdir -p "$KEYS"

if [[ -f "$PTAU" ]]; then
  echo "==> ptau present: $PTAU"
  exit 0
fi

echo "==> downloading pot14_final.ptau (~18 MB)"
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$URL" -o "$PTAU"
elif command -v wget >/dev/null 2>&1; then
  wget -q "$URL" -O "$PTAU"
else
  echo "need curl or wget to fetch powers of tau" >&2
  exit 1
fi

echo "    saved $PTAU"
