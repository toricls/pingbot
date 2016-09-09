#!/usr/bin/env bash
set -eu

if [ "`dirname $0`" != "./scripts/lib" ]; then
    echo "This script must be called from repository root." >&2
    exit 1
fi

echo 'AWS_DEFAULT_REGION='$AWS_DEFAULT_REGION
echo 'S3_PINGBOT_RESOURCE_BUCKET='$S3_PINGBOT_RESOURCE_BUCKET
echo 'WEBAPP_PERMITTED_IP_ADDRESS'=$WEBAPP_PERMITTED_IP_ADDRESS
