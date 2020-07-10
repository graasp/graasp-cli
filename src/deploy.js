import AWS from 'aws-sdk';
import s3 from 's3-node-client';
import dotenv from 'dotenv';

const path = require('path');

// default build directory
const BUILD = 'build/';

/**
 * Returns an object with all variables loaded from a environment
 * @param {string} environmentName is the suffix after .env.*
 */

const deploy = async (opts) => {
  // const { path } = opts;

  const usageMessage = console.log(
    'usage: $0 [-e <path/to/file>] [-v <version string>] [-b <path/to/build>]',
  );

  console.log(`Exectued with path: ${opts.path}`);
  console.log(usageMessage);

  // fetch environment variables
  dotenv.config({ path: path.resolve(process.cwd(), '.env.dev') });
  /* eslint-disable no-unused-vars */
  const {
    REACT_APP_GRAASP_DEVELOPER_ID,
    REACT_APP_GRAASP_APP_ID,
    REACT_APP_GRAASP_DOMAIN,
    REACT_APP_HOST,
    REACT_APP_VERSION,
    REACT_APP_BASE,
    NODE_ENV,
    BUCKET,
    AWS_DEFAULT_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    DISTRIBUTION,
  } = process.env;
  /* eslint-enable no-unused-vars */

  AWS.config.getCredentials(function (err) {
    if (err) console.error(err.stack);
    // credentials not loaded
    else {
      console.log('Access key:', AWS.config.credentials.accessKeyId);
    }
  });

  const APP_PATH = `${REACT_APP_GRAASP_DEVELOPER_ID}/${REACT_APP_GRAASP_APP_ID}/${REACT_APP_VERSION}`;

  const client = s3.createClient({ s3Client: new AWS.S3() });

  const params = {
    localDir: BUILD,
    deleteRemoved: true, // default false, whether to remove s3 objects
    // that have no corresponding local file.

    s3Params: {
      Bucket: BUCKET,
      Prefix: APP_PATH,
      // other options supported by putObject, except Body and ContentLength.
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
    },
  };
  const uploader = client.uploadDir(params);
  uploader.on('error', function (err) {
    console.error('unable to sync:', err.stack);
  });
  uploader.on('progress', function () {
    console.log('progress', uploader.progressAmount, uploader.progressTotal);
  });
  uploader.on('end', function () {
    console.log('done uploading');
  });

  console.log(
    `published app to https://${REACT_APP_HOST}/${APP_PATH}/index.html`,
  );

  return true;
};

export default deploy;
