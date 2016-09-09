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

export STACK_NAME=pingbot

## DELETE WEB APP
set +e
WEBAPP_BUCKET_NAME=$( aws cloudformation describe-stacks --region $AWS_DEFAULT_REGION --stack-name $STACK_NAME --query 'Stacks[*].Outputs[?OutputKey==`PingbotWebS3BucketName`].OutputValue' --output text )
if [ "$WEBAPP_BUCKET_NAME" != "" ]; then
    echo 'Deleting the webapp...'
    aws s3 rm s3://$WEBAPP_BUCKET_NAME/ --recursive
fi
set -e

## DELETE CLOUDFORMATION STACK
echo 'Deleting the stack...'
aws cloudformation delete-stack --stack-name $STACK_NAME
echo 'Waiting for the stack to be deleted, this may take a few minutes...'
aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME
echo 'Done'

## DELETE PINGBOT RESOURCES
echo 'Deleting the pingbot resources...'
aws s3 rm s3://$S3_PINGBOT_RESOURCE_BUCKET/ --recursive

## DELETE LOG GROUP, in case some lambda functions runnning after cfn deletion
set +e
aws logs delete-log-group --log-group-name /aws/lambda/pingbot-dispatcher 2>/dev/null
aws logs delete-log-group --log-group-name /aws/lambda/pingbot-health-checker 2>/dev/null
aws logs delete-log-group --log-group-name /aws/lambda/pingbot-result-processor 2>/dev/null
aws logs delete-log-group --log-group-name /aws/lambda/pingbot-slack-notifier 2>/dev/null
aws logs delete-log-group --log-group-name /aws/lambda/pingbot-cognito-deployer 2>/dev/null
set -e

echo ''
echo 'pingbot was removed from your AWS account!'
