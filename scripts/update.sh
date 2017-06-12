#!/usr/bin/env bash
set -eu

SCRIPTS_DIR='./scripts'
if [ "`dirname $0`" != "$SCRIPTS_DIR" ]; then
    echo "This script must be called from repository root." >&2
    exit 1
fi

if [ -f "./scripts/config.sh" ]; then
    source ./scripts/config.sh
    echo 'Loaded configuration file: ./scripts/config.sh'
fi

$SCRIPTS_DIR/lib/check-variables.sh

export TIMESTAMP=$(date '+%Y%m%d%H%M%S')
$SCRIPTS_DIR/lib/upload.sh $TIMESTAMP

export STACK_NAME=pingbot

## UPDATE CLOUDFORMATION STACK
echo 'Updating CloudFormation stack...'
aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --region $AWS_DEFAULT_REGION \
    --template-url https://s3-$AWS_DEFAULT_REGION.amazonaws.com/$S3_PINGBOT_RESOURCE_BUCKET/cfn/main.template \
    --parameters ParameterKey=TemplateBucketName,ParameterValue=$S3_PINGBOT_RESOURCE_BUCKET \
                 ParameterKey=DeployTimestamp,ParameterValue=$TIMESTAMP \
                 ParameterKey=WebAppPermittedIPAddress,ParameterValue=$WEBAPP_PERMITTED_IP_ADDRESS \
    --capabilities CAPABILITY_IAM

## WAIT FOR COMPLETION
echo 'Waiting for the stack to be updated, this may take a few minutes...'
aws cloudformation wait stack-update-complete --stack-name $STACK_NAME
echo 'Done'

echo 'Building and distributing web app...'
## DEPLOY WEB APP
$SCRIPTS_DIR/lib/deploy-web.sh
echo 'Done'

echo ''
echo 'pingbot was updated!'