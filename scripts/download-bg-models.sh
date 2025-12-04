#!/bin/bash
# Script to download background removal AI models
# These models are required for the background remover tool to work

MODEL_DIR="public/models/bg-removal"
BASE_URL="https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist"

mkdir -p "$MODEL_DIR"
cd "$MODEL_DIR"

echo "Downloading resources.json..."
curl -sL -o resources.json "$BASE_URL/resources.json"

echo "Extracting chunk hashes..."
CHUNKS=$(cat resources.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
chunks = set()
for key, val in data.items():
    for chunk in val.get('chunks', []):
        chunks.add(chunk['name'])
for c in sorted(chunks):
    print(c)
")

echo "Downloading $(echo "$CHUNKS" | wc -l) chunks..."
for hash in $CHUNKS; do
  if [ ! -f "$hash" ]; then
    echo "Downloading $hash..."
    curl -sL -o "$hash" "$BASE_URL/$hash"
  else
    echo "Skipping $hash (already exists)"
  fi
done

echo "Done! Total size:"
du -sh .
