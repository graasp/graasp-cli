import fs from 'fs-extra';
import path from 'path';
import {
  DEV,
  LOCAL,
  PROD,
  TEST,
} from './config';

const writeRemoteEnvFile = async (
  env,
  rootPath,
  {
    graaspDeveloperId = '',
    graaspAppId = '',
    awsAccessKeyId = '',
    awsSecretAccessKey = '',
  } = {},
) => {
  const host = env === PROD ? 'apps.graasp.eu' : 'apps.dev.graasp.eu';
  const bucket = `graasp-apps-${env}`;
  const string = `REACT_APP_GRAASP_DEVELOPER_ID=${graaspDeveloperId}
    REACT_APP_GRAASP_APP_ID=${graaspAppId}
    REACT_APP_GRAASP_DOMAIN=graasp.eu
    REACT_APP_HOST=${host}
    REACT_APP_VERSION=latest
    REACT_APP_BASE=//$REACT_APP_HOST/$REACT_APP_GRAASP_DEVELOPER_ID/$REACT_APP_GRAASP_APP_ID/$REACT_APP_VERSION/
    NODE_ENV=production
    BUCKET=${bucket}
    AWS_DEFAULT_REGION=us-east-1
    AWS_ACCESS_KEY_ID=${awsAccessKeyId}
    AWS_SECRET_ACCESS_KEY=${awsSecretAccessKey}
  `;
  try {
    await fs.writeFile(path.join(rootPath, `.env.${env}`), string, 'utf8');
  } catch (e) {
    console.error(e);
  }
};

const writeLocalEnvFile = async (env, rootPath) => {
  const string = `REACT_APP_GRAASP_DEVELOPER_ID=
    REACT_APP_GRAASP_APP_ID=
    REACT_APP_GRAASP_DOMAIN=localhost
    REACT_APP_HOST=
    REACT_APP_VERSION=
    REACT_APP_BASE=
  `;
  try {
    await fs.writeFile(path.join(rootPath, '.env.local'), string, 'utf8');
  } catch (e) {
    console.error(e);
  }
};

const writeTestEnvFile = async (env, rootPath) => {
  const string = '';
  try {
    await fs.writeFile(path.join(rootPath, '.env.test'), string, 'utf8');
  } catch (e) {
    console.error(e);
  }
};


const writeEnvFile = async (env, rootPath, opts) => {
  switch (env) {
    case TEST:
      return writeTestEnvFile(env, rootPath);
    case LOCAL:
      return writeLocalEnvFile(env, rootPath);
    case DEV:
    case PROD:
      return writeRemoteEnvFile(env, rootPath, opts);
    default:
      return false;
  }
};


const writeEnvFiles = async (rootPath, opts) => {
  console.log('writing environment files...');
  await Promise.all([LOCAL, DEV, PROD, TEST].map((env) => writeEnvFile(env, rootPath, opts)));
  console.log('wrote environment files');
};

export default writeEnvFiles;
