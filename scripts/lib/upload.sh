#!/usr/bin/env bash
set -eu

TIMESTAMP=$1

if [ "`dirname $0`" != "./scripts/lib" ]; then
    echo "This script must be called from repository root." >&2
    exit 1
fi

## CREATE & UPLOAD LAMBDA FUNCTION ARCHIVES
TMP_LAMBDA_ARCHIVE_DIRECTORY=/tmp/pingbot-lambda
rm -rf $TMP_LAMBDA_ARCHIVE_DIRECTORY
mkdir -p $TMP_LAMBDA_ARCHIVE_DIRECTORY
echo 'Creating Lambda function archives...'
zip -j $TMP_LAMBDA_ARCHIVE_DIRECTORY/pingbot-dispatcher.zip ./src/bot/{config.json,pingbot-dispatcher.js}
zip -j $TMP_LAMBDA_ARCHIVE_DIRECTORY/pingbot-health-checker.zip ./src/bot/{config.json,pingbot-health-checker.js}
zip -j $TMP_LAMBDA_ARCHIVE_DIRECTORY/pingbot-result-processor.zip ./src/bot/{config.json,pingbot-result-processor.js}
zip -j $TMP_LAMBDA_ARCHIVE_DIRECTORY/pingbot-slack-notifier.zip ./src/bot/{config.json,pingbot-slack-notifier.js}
echo "Uploading all Lambda functions into s3://$S3_PINGBOT_RESOURCE_BUCKET/$TIMESTAMP/lambda/..."
aws s3 sync $TMP_LAMBDA_ARCHIVE_DIRECTORY s3://$S3_PINGBOT_RESOURCE_BUCKET/$TIMESTAMP/lambda/ --delete --exclude ".*"

## CREATE & UPLOAD COGNITO DEPLOYER LAMBDA FUNCTION ARCHIVE
TMP_LAMBDA_COGNITO_ARCHIVE_DIRECTORY=/tmp/pingbot-lambda-cognito
rm -rf $TMP_LAMBDA_COGNITO_ARCHIVE_DIRECTORY
mkdir -p $TMP_LAMBDA_COGNITO_ARCHIVE_DIRECTORY
echo 'Creating Lambda Cognito function archives...'
zip -j $TMP_LAMBDA_COGNITO_ARCHIVE_DIRECTORY/pingbot-cognito-deployer.zip ./res/lambda/pingbot-cognito-deployer.js
echo "Uploading all Lambda Cognito function into s3://$S3_PINGBOT_RESOURCE_BUCKET/$TIMESTAMP/cognito/..."
aws s3 sync $TMP_LAMBDA_COGNITO_ARCHIVE_DIRECTORY s3://$S3_PINGBOT_RESOURCE_BUCKET/$TIMESTAMP/cognito/ --delete --exclude ".*"

## UPLOAD CLOUDFORMATION TEMPLATES
CFN_DIRECTORY=./res/cfn/
echo 'Uploading all templates into s3://'$S3_PINGBOT_RESOURCE_BUCKET'/cfn/...'
aws s3 sync $CFN_DIRECTORY s3://$S3_PINGBOT_RESOURCE_BUCKET/cfn/ --delete --exclude ".*"
