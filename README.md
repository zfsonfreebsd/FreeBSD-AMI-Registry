# FreeBSD AMI Registry

This project deploys an application stack on AWS to provide a registry of the
latest FreeBSD snapshot AMIs in the form of S3 objects containing JSON metadata
describing the latest image for a given ABI/VERSION.

For example, `$bucket/amd64/13.0-CURRENT/latest.json`:
```json
{
    "Name": "FreeBSD 13.0-CURRENT-amd64-2019-12-05",
    "ImageId": "ami-039ab72261b7fac05",
    "ImageVersion": "FreeBSD/amd64 head@355406"
}
```

A Lambda function (code in `ami-function-lambda-code`) is triggered by FreeBSD
snapshot AMI notifications on a public SNS topic. The function checks for
images matching the desired AWS region, ABI, and FreeBSD version, and puts the
appropriate data in an S3 object.

## Motivation

The metadata provided by this registry is to be used by the OpenZFS Buildbot
infrastructure to determine what AMI to use when launching a worker instance.
This allows the project to stay up to date with testing the latest FreeBSD code
without requiring constant manual intervention.

## Deployment

This project uses [AWS CDK](https://aws.amazon.com/cdk/) to provision and
deploy the necessary resources on AWS. In theory it should work in any region,
but `cdk deploy` is failing to create the subscription for the Lambda function
to be triggered by the public FreeBSD AMI topic, which is in the `us-east-1`
region, unless the stack is deployed to `us-east-1`. So for now, that region is
hard coded in the application.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

Deploy the application using the following commands:
```
npm run build
cdk deploy
```

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
