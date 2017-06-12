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

## CREATE CLOUDFORMATION STACK
echo 'Creating CloudFormation stack...'
aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --region $AWS_DEFAULT_REGION \
    --template-url https://s3-$AWS_DEFAULT_REGION.amazonaws.com/$S3_PINGBOT_RESOURCE_BUCKET/cfn/main.template \
    --parameters ParameterKey=TemplateBucketName,ParameterValue=$S3_PINGBOT_RESOURCE_BUCKET \
                 ParameterKey=DeployTimestamp,ParameterValue=$TIMESTAMP \
                 ParameterKey=WebAppPermittedIPAddress,ParameterValue=$WEBAPP_PERMITTED_IP_ADDRESS \
    --capabilities CAPABILITY_IAM

## WAIT FOR COMPLETION
set +e
echo 'Waiting for the stack to be created, this may take a few minutes...'
echo 'You can see the progress at the CloudFormation Management Console.'
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME
RESULT=$(echo $?)
set -e
if [ $RESULT -ne 0 ]; then
    ## CLEAN-UP, IF CREATION FAILED
    echo 'The creation process has failed.'
    $SCRIPTS_DIR/delete.sh
    exit 0
fi
echo 'Done'

echo 'Building and distributing web app...'
## DEPLOY WEB APP
$SCRIPTS_DIR/lib/deploy-web.sh
echo 'Done'

echo ''
S3_URL=$( aws cloudformation describe-stacks --region $AWS_DEFAULT_REGION --stack-name $STACK_NAME --query 'Stacks[*].Outputs[?OutputKey==`PingbotWebS3WebsiteUrl`].OutputValue' --output text )
echo 'pingbot was deployed!'
echo 'Check the web app at: '$S3_URL