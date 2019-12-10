import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');
import sns = require('@aws-cdk/aws-sns');
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources';

/* This Stack should be deployed wherever the buildbot master runs. */
export class FreeBsdAmiRegistryStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        /*
         * The FreeBSD project publishes notifications to a public topic for
         * new snapshot AMIs.
        */
        const amiTopicArn = 'arn:aws:sns:us-east-1:782442783595:FreeBSDAMI';
        const amiTopic = sns.Topic.fromTopicArn(this, 'FreeBSD-AMI-Topic', amiTopicArn);

        /*
         * An S3 bucket serves as a registry of the latest modified AMIs.
         * The AMI identifier is stored in an S3 object which can be accessed
         * by the OpenZFS buildbot infrastructure.
         */
        const amiRegistry = new s3.Bucket(this, 'FreeBSD-AMI-Registry');
        amiRegistry.grantPublicAccess(); /* read-only public access */

        /*
         * A Lambda function filters the event notifications and updates the
         * registry when we have a new AMI.
         */
        const amiFunction = new lambda.Function(this, 'FreeBSD-AMI-Function', {
            code: lambda.Code.fromAsset('./ami-function-lambda-code'),
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: 'index.handler',
            environment: {
                AMI_REGISTRY: amiRegistry.bucketName,
            },
            events: [ new SnsEventSource(amiTopic) ],
        });
        amiRegistry.grantPut(amiFunction);
    }
}
