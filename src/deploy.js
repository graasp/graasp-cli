import AWS from 'aws-sdk';
import s3 from 's3-node-client';
import dotenv from 'dotenv';
import fs from 'fs';
import cliProgress from 'cli-progress';

const validateTag = (tag) => {
  console.log(`warning: tag ${tag} is not validated. Needs to be implemented`);
  return true;
  /* Does not work yet ====================> Find out why...
  // prettier-ignore
  const pattern = new RegExp('^v([0-9]+\.){0,2}(\*|[0-9]+)$');
  if (tag === 'latest' || tag.test(pattern)) {
    console.log(`info: validated tag ${tag}`);
    return true;
  }
  console.error(`error: unable to validate version '${tag}'`);
  return false;
  */
};

const validateEnv = async (env) => {
  if (fs.existsSync(env)) {
    console.log(`info: validated environment file ${env}`);
    return true;
  }
  console.log(`error: environment file '${env}' does not exist`);
  return false;
};

const validateBuild = async (build) => {
  if (fs.existsSync(build)) {
    console.log(`info: validated build directory ${build}`);
    return true;
  }
  console.log(`error: build directory '${build}' does not exist`);
  return false;
};

const varIsDefined = (variable) => {
  return typeof variable !== 'undefined';
};

const deploy = async (opts) => {
  const { tag, env, build } = opts;

  // Validate command options
  if (!validateTag(tag) || !validateEnv(env) || !validateBuild(build)) {
    console.error('Abort...');
    return false;
  }

  // fetch environment variables
  // dotenv.config({ path: path.resolve(process.cwd(), '.env.dev') });
  dotenv.config({ path: env });
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

  // ensure the correct app variables are defined
  if (
    !varIsDefined(REACT_APP_HOST) ||
    !varIsDefined(REACT_APP_GRAASP_DEVELOPER_ID) ||
    !varIsDefined(REACT_APP_GRAASP_APP_ID)
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

  // ensure the correct aws credentials are defined
  if (
    !varIsDefined(BUCKET) ||
    !varIsDefined(AWS_ACCESS_KEY_ID) ||
    !varIsDefined(AWS_SECRET_ACCESS_KEY)
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
  }

  console.log(
    `info: publishing app ${REACT_APP_GRAASP_APP_ID} version ${REACT_APP_VERSION}`,
  );

  // configure the deployment
  AWS.config.getCredentials(function (err) {
    if (err) {
      // credentials not loaded
      console.error(err.stack);
    }
  });

  const APP_PATH = `${REACT_APP_GRAASP_DEVELOPER_ID}/${REACT_APP_GRAASP_APP_ID}/${REACT_APP_VERSION}`;

  const client = s3.createClient({ s3Client: new AWS.S3() });

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
  uploader.on('error', function (err) {
    console.error('unable to sync:', err.stack);
  });
  uploader.on('progress', function () {
    progressBar.start(uploader.progressTotal, 0);
    progressBar.update(uploader.progressAmount);
  });
  uploader.on('end', function () {
    progressBar.stop();
    // TODO: insert here code that should be executed once the upload is done
    //       e.g. invalidate cache
  });

  console.log(
    `info: published app to https://${REACT_APP_HOST}/${APP_PATH}/index.html`,
  );

  // ensure the correct distribution variables are defined
  if (!varIsDefined(DISTRIBUTION)) {
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
  const cloudfront = new AWS.CloudFront();
  cloudfront.createInvalidation(invalidationParams, function (err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(data); // successful response
  });

  return true;
};

export default deploy;
