# Setup

This setup instruction is dedicated for OS X. You can probably follow these steps on any Linux machine.

## Prerequisites

- The latest version of the [AWS CLI](https://aws.amazon.com/cli/) to create AWS resources.
- [Node.js](https://nodejs.org/) v12.x or later to build web-app.

We assume you are using an IAM Role/User with `AdministratorAccess`.

## Overview

This project contains two apps, [bot](src/bot) and [web](src/web).

![Overview](https://github.com/toricls/pingbot/wiki/res/overview-apps.jpg)

### Bot app

- Scheduled website health checking
- Storing results
- Slack notification about failure/recovery of ping result

### Web app

- Web user interface to manage data
- List ping results

## Setup

We use [some CloudFormation templates and shell scripts](../res/) to setup the apps.

### Before setup

After clone this repository into your local, set an AWS credential to use AWS API inside setup scripts.

```
$ cd /path/to/repos

$ export AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXXX
$ export AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
$ export AWS_DEFAULT_REGION=$YOUR_REGION_TO_DEPLOY
```

### Create a S3 bucket to store deployment assets

We need a S3 bucket that stores CloudFormation templates and Lambda function archives. You can create a bucket via AWS CLI or [S3 Management Console](https://console.aws.amazon.com/s3/home). If you use AWS CLI, type and execute a command below.

```
# Create it via AWS CLI
$ aws s3api create-bucket \
    --bucket $YOUR_S3_BUCKET_NAME \
    --create-bucket-configuration LocationConstraint=$AWS_DEFAULT_REGION
```

### Deploy apps

```
# Configure a file which tells about some configurations to the deploy script
$ cp scripts/config.sh.example scripts/config.sh
$ vim scripts/config.sh

# Ship it
$ ./scripts/deploy.sh

# You will see messages like follows when the deploy script is completed.
#
# pingbot was deployed!
# Check the web app at: http://pingbot-s3-xxxxxxxxxxxx-pingbotweb-xxxxxxxxxxxx.s3-website-xxxxxxxx.amazonaws.com
```

### (Optional) Put example record into DynamoDB table

```
# get DynamoDB table name
TABLE_NAME=$( aws cloudformation describe-stacks --region $AWS_DEFAULT_REGION --stack-name pingbot --query 'Stacks[*].Outputs[?OutputKey==`PingbotTargetsTableName`].OutputValue' --output text )

# Without Slack notification
$ aws dynamodb put-item \
    --table-name $TABLE_NAME \
    --item file://res/example/target.json \
    --return-consumed-capacity TOTAL

# With Slack notification
# *) Configure `slackChannel` and `slackWebhook` fields in `res/example/target-with-slack.json` before executing this command.
$ aws dynamodb put-item \
    --table-name pingbot-targets \
    --item file://res/example/target-with-slack.json \
    --return-consumed-capacity TOTAL
```

### (Optional) Configure your web-server to not log requests by pingbot's User-Agent

Since we recommend you to create a specific health check path (like '/healthcheck') and disable logging on that path, follow this section if you cannot create such paths on your products.

---

pingbot makes all requests with following UserAgent format.

`pingbot/v{PINGBOT_VERSION} uuid:{TARGET_UUID}`

You can tell your web-server to not log these requests through your web-server's configuration.

#### e.g. Apache
Put something like following lines into your apache config or .htaccess, for example.
```
SetEnvIf User-Agent "pingbot" nolog

CustomLog logs/access_log combined env=!nolog
```

## Update apps

```
$ cd /path/to/repos

$ export AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXXX
$ export AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
$ export AWS_DEFAULT_REGION=$YOUR_REGION_TO_DEPLOY

$ ./scripts/update.sh
```

## Delete apps

```
$ cd /path/to/repos

$ export AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXXX
$ export AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
$ export AWS_DEFAULT_REGION=$YOUR_REGION_TO_DEPLOY

$ ./scripts/delete.sh
```

## Disable scheduled health checking

You can disable scheduled event if you just want to stop health checking not to delete whole apps.

```
EVENT_NAME=$( aws cloudformation describe-stacks --region $AWS_DEFAULT_REGION --stack-name pingbot --query 'Stacks[*].Outputs[?OutputKey==`ScheduledEventName`].OutputValue' --output text )

$ aws events disable-rule --name $EVENT_NAME
```

To re-enable it

```
EVENT_NAME=$( aws cloudformation describe-stacks --region $AWS_DEFAULT_REGION --stack-name pingbot --query 'Stacks[*].Outputs[?OutputKey==`ScheduledEventName`].OutputValue' --output text )

$ aws events enable-rule --name $EVENT_NAME
```
