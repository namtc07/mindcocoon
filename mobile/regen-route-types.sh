#!/bin/sh
# Regenerates Expo Router typed routes (.expo/types/router.d.ts) by starting Metro briefly.
cd "$(dirname "$0")"
(CI=1 npx expo start > /tmp/mc-types.log 2>&1 &)
for i in $(seq 1 40); do curl -s localhost:8081/status | grep -q running && break; sleep 2; done
sleep 4
pkill -f "expo start"
