#!/usr/bin/env bash
set -eu

SCRIPTS_DIR='./scripts/lib'
if [ "`dirname $0`" != "$SCRIPTS_DIR" ]; then
    echo "This script must be called from repository root." >&2
    exit 1
fi

$SCRIPTS_DIR/check-variables.sh

pushd src/web/

## CONFIGURE WEB APP
COGNITO_IDPOOL_ID=$(aws cloudformation describe-stacks --region $AWS_DEFAULT_REGION --stack-name $STACK_NAME --query 'Stacks[*].Outputs[?OutputKey==`CognitoIdentityPoolId`].OutputValue' --output text)
cat ./config.json.template | sed 's/AWS_DEFAULT_REGION/'$AWS_DEFAULT_REGION'/g' | sed 's/COGNITO_IDPOOL_ID/'$COGNITO_IDPOOL_ID'/g' > ./config.json

## BUILD WEB APP
npm install
npm run build

## DEPLOY WEB APP
WEBAPP_BUCKET_NAME=$( aws cloudformation describe-stacks --region $AWS_DEFAULT_REGION --stack-name $STACK_NAME --query 'Stacks[*].Outputs[?OutputKey==`PingbotWebS3BucketName`].OutputValue' --output text )
aws s3 sync ./dist s3://$WEBAPP_BUCKET_NAME --delete --exclude '.*'

popd