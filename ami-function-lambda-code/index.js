const AWS = require('aws-sdk');

const architectures = { 'x86_64': 'amd64', 'arm64': 'arm64' };
const region = 'us-west-1';
const amiRegistry = process.env['AMI_REGISTRY'];

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

/**
 * Handle snapshot AMI notifications published by the FreeBSD project.
 *
 * The message format is as follows:
 *
{
    "v1": {
        "ReleaseVersion": "12.0-STABLE",
        "ImageVersion": "stable/12@344851",
        "Regions": {
            "eu-north-1": [
                {
                    "Name": "FreeBSD 12.0-STABLE-amd64-2019-03-07",
                    "ImageId": "ami-0a6869ad3d6921c7d",
                    "Architecture": "x86_64"
                }
            ]
        }
    }
}
 *
 * Returns an array of s3.putObject() promises for the matching images.
 */
function messageHandler(message) {
    const {
        v1: {
            ReleaseVersion: releaseVersion,
            ImageVersion: imageVersion,
            Regions: regions
        }
    } = JSON.parse(message);

    if (releaseVersion === undefined ||
        imageVersion === undefined ||
        regions === undefined) {
        const err = 'unrecognized message';
        console.error(`Error: ${err}`);
        console.error(message);
        throw new Error(err);
    }

    const images = regions[region];

    if (images === undefined || releaseVersion.startsWith('11.')) {
        /* Nothing to do for this event. */
        return [];
    }

    return images
        .map(image => {
            /*
             * Match images by architecture.
             * Unwanted images are nulled out.
             * Desired images get Arch added.
             */
            const { Architecture: architecture } = image;
            if (architecture === undefined)
                return null;
            const arch = architectures[architecture];
            if (arch === undefined)
                return null;
            return {
                Arch: arch,
                ...image
            };
        })
        .filter(image => image !== null) /* Remove the nulls. */
        .map(({
            Name: name,
            ImageId: imageId,
            Arch: arch
        }) => {
            /*
             * Store the image metadata in an S3 object.
             * Returns a promise.
             */
            const data = {
                Name: name,
                ImageId: imageId,
                ImageVersion: imageVersion
            };
            return s3.putObject({
                Bucket: amiRegistry,
                Key: `${arch}/${releaseVersion}/latest.json`,
                Body: JSON.stringify(data),
                ContentType: 'application/json'
            }).promise();
        });
}

exports.handler = async function({ Records: records }) {
    await Promise.all(
        records.flatMap(
            ({ Sns: { Message: message } }) => messageHandler(message)
        )
    );
    return {};
};
