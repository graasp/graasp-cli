import aws from 'aws-sdk';
// import s3 from 's3-node-client';
import dotenv from 'dotenv';
import fs from 'fs';
// import cliProgress from 'cli-progress';
import _ from 'lodash';
import { promisify } from './utils';

const validateTag = (tag) => {
  // Both compilation hints because of backslashes used in RegExp but unecessary by conception in JS Strings
  // Furthermore, the escaption is needed so RegExp will interpret the String correctly.
  // prettier-ignore
  // eslint-disable-next-line no-useless-escape
  const pattern = new RegExp('^v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(\\-[0-9A-Za-z]*)?$')
  if (tag === 'latest' || pattern.test(tag)) {
    console.log(`info: validated tag ${tag}`);
    return true;
  }
  console.error(`error: unable to validate version '${tag}'`);
  return false;
};

const validateEnv = (env) => {
  if (fs.existsSync(env)) {
    console.log(`info: validated environment file ${env}`);
    return true;
  }
  console.log(`error: environment file '${env}' does not exist`);
  return false;
};

const validateBuild = (build) => {
  if (fs.existsSync(build)) {
    console.log(`info: validated build directory ${build}`);
    return true;
  }
  console.log(`error: build directory '${build}' does not exist`);
  return false;
};

const validateAppVariables = ({
  REACT_APP_HOST,
  REACT_APP_GRAASP_DEVELOPER_ID,
  REACT_APP_GRAASP_APP_ID,
}) => {
  if (
    _.isUndefined(REACT_APP_HOST) ||
    _.isUndefined(REACT_APP_GRAASP_DEVELOPER_ID) ||
    _.isUndefined(REACT_APP_GRAASP_APP_ID)
  ) {
    console.error(
      'error: environment variables REACT_APP_GRAASP_APP_ID, REACT_APP_GRAASP_DEVELOPER_ID and/or REACT_APP_HOST are not defined',
    );
    console.error(
      'error: you can specify them through a .env file in the app root folder',
    );
    console.error('error: or through another file specified with the -e flag');
    return false;
  }
  return true;
};

const validateAwsCredentialsVariables = ({
  BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
}) => {
  if (
    _.isUndefined(BUCKET) ||
    _.isUndefined(AWS_ACCESS_KEY_ID) ||
    _.isUndefined(AWS_SECRET_ACCESS_KEY)
  ) {
    console.error(
      'error: environment variables BUCKET, AWS_ACCESS_KEY_ID and/or AWS_SECRET_ACCESS_KEY are not defined',
    );
    console.error(
      'error: make sure you setup your credentials file correctly using the scripts/setup.sh script',
    );
    console.error(
      'error: and contact your favourite Graasp engineer if you keep running into trouble',
    );
    return false;
  }
  return true;
};

const deploy = async (opts) => {
  const { tag, env, build } = opts;

  // validate command options
  if (!validateTag(tag) || !validateEnv(env) || !validateBuild(build)) {
    console.error('aborting deployment...');
    return false;
  }

  // load environment
  dotenv.config({ path: env });

  // validate environment variables
  if (
    !validateAppVariables(process.env) ||
    !validateAwsCredentialsVariables(process.env)
  ) {
    return false;
  }

  const { REACT_APP_GRAASP_APP_ID, REACT_APP_VERSION } = process.env;

  /*

  const {
    REACT_APP_GRAASP_DEVELOPER_ID,
    REACT_APP_GRAASP_APP_ID,
    REACT_APP_HOST,
    REACT_APP_VERSION,
    BUCKET,
    DISTRIBUTION,
  } = process.env;

*/

  console.log(
    `publishing app ${REACT_APP_GRAASP_APP_ID} version ${REACT_APP_VERSION}`,
  );

  const getAwsCredentialsPromise = promisify(aws.config.getCredentials);
  console.log('Before promise');
  getAwsCredentialsPromise()
    .then((err) => {
      console.log('In then promises');
      if (err) {
        // credentials not loaded
        console.error(err.stack);
      }
    })
    .catch((err) => {
      console.log('In catch promises');
      if (err) {
        // credentials not loaded
        console.error(err.stack);
      }
    });
  console.log('After promise');

  return false;
  /*
  // configure the deployment
  aws.config.getCredentials((err) => {
    if (err) {
      // credentials not loaded
      console.error(err.stack);
    }
  });

  const APP_PATH = `${REACT_APP_GRAASP_DEVELOPER_ID}/${REACT_APP_GRAASP_APP_ID}/${REACT_APP_VERSION}`;

  const client = s3.createClient({ s3Client: new aws.S3() });

  const params = {
    localDir: build,
    deleteRemoved: true, // default false, whether to remove s3 objects
    // that have no corresponding local file.

    s3Params: {
      Bucket: BUCKET,
      Prefix: APP_PATH,
      // other options supported by putObject, except Body and ContentLength.
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
    },
  };
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  const uploader = client.uploadDir(params);
  uploader.on('error', (err) => {
    console.error('unable to sync:', err.stack);
  });
  uploader.on('progress', () => {
    progressBar.start(uploader.progressTotal, 0);
    progressBar.update(uploader.progressAmount);
  });
  uploader.on('end', () => {
    progressBar.stop();
    // TODO: insert here code that should be executed once the upload is done
    //       e.g. invalidate cache
  });

  console.log(
    `info: published app to https://${REACT_APP_HOST}/${APP_PATH}/index.html`,
  );

  // ensure the correct distribution variables are defined
  if (_.isUndefined(DISTRIBUTION)) {
    console.error('error: environment variable DISTRIBUTION is not defined');
    console.error(
      'error: contact your favourite Graasp engineer if you keep running into trouble',
    );
    return false;
  }

  // invalidate cloudfront distribution
  const pathsToInvalidate = [`/${APP_PATH}/*`];
  const invalidationParams = {
    DistributionId: DISTRIBUTION,
    InvalidationBatch: {
      CallerReference: new Date().toString(),
      Paths: {
        Quantity: pathsToInvalidate.length,
        Items: pathsToInvalidate,
      },
    },
  };
  const cloudfront = new aws.CloudFront();
  cloudfront.createInvalidation(invalidationParams, (err, data) => {
    if (err) {
      // an error occurred
      console.error(err, err.stack);
    } else {
      // successful response
      console.log(data);
    }
  });

  return true;
  */
};

export default deploy;
