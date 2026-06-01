#!/bin/bash
# Restore MongoDB dump from the old VM into the Docker container
#
# Usage:
#   1. First, start the Docker stack:  docker compose up -d
#   2. Then run:  ./scripts/restore-mongo.sh /path/to/dump/dir
#
# The dump directory should contain a subdirectory named 'iceCreamWorkshop'
# (as produced by: mongodump --db iceCreamWorkshop --out /tmp/mongodump)

set -e

DUMP_SRC="${1:-/tmp/mongodump}"

if [ ! -d "$DUMP_SRC/iceCreamWorkshop" ]; then
  echo "Error: Expected to find 'iceCreamWorkshop' subdirectory in $DUMP_SRC"
  echo "Make sure you provide the parent directory of 'iceCreamWorkshop'."
  echo "Example: $0 /tmp/mongodump"
  exit 1
fi

echo "Copying dump from $DUMP_SRC into the MongoDB container..."
docker cp "$DUMP_SRC" gelatari-mongo:/dump

echo "Restoring database..."
docker exec gelatari-mongo mongorestore --db iceCreamWorkshop /dump/iceCreamWorkshop --drop

echo "Cleaning up temporary dump from container..."
docker exec gelatari-mongo rm -rf /dump

echo "Done! Database restored successfully."
