import fs from 'fs-extra';
import path from 'path';
import { DEV, LOCAL, TEST } from './config.js';

const writeDevEnvFile = async (rootPath, { graaspAppId = '' } = {}) => {
  const string = `# this app is used when you develop the app
# it uses the mock API which enables a lighter and faster development workflow
REACT_APP_GRAASP_APP_ID=${graaspAppId}
REACT_APP_MOCK_API=true
REACT_APP_GRAASP_DOMAIN=localhost
REACT_APP_API_HOST=http://localhost:3636`;
  try {
    await fs.writeFile(path.join(rootPath, '.env.development'), string, 'utf8');
  } catch (e) {
    console.error(e);
  }
};

const writeLocalEnvFile = async (rootPath, { graaspAppId }) => {
  const string = `# this file is used when you want to run the app against
# the local Docker backend and the Graasp frontend
PORT=3005
REACT_APP_GRAASP_APP_ID=${graaspAppId}
REACT_APP_GRAASP_DOMAIN=localhost
REACT_APP_API_HOST=http://localhost:3000
REACT_APP_MOCK_API=false
NODE_ENV=production`;
  try {
    await fs.writeFile(path.join(rootPath, '.env.local'), string, 'utf8');
  } catch (e) {
    console.error(e);
  }
};

const writeTestEnvFile = async (
  rootPath,
  { graaspAppId = '', mockApi = true } = {}
) => {
  const string = `# this file is used when you want to test your app with Cypress
PORT=3333
CYPRESS_BASE_URL=http://localhost:3333
REACT_APP_GRAASP_APP_ID=${graaspAppId}
REACT_APP_GRAASP_DOMAIN=localhost
REACT_APP_API_HOST=http://localhost:3636
REACT_APP_MOCK_API=${mockApi}`;
  try {
    await fs.writeFile(path.join(rootPath, '.env.test'), string, 'utf8');
  } catch (e) {
    console.error(e);
  }
};

const writeEnvFile = async (env, rootPath, opts) => {
  switch (env) {
    case TEST:
      return writeTestEnvFile(rootPath, opts);
    case LOCAL:
      return writeLocalEnvFile(rootPath, opts);
    case DEV:
      return writeDevEnvFile(rootPath, opts);
    default:
      return false;
  }
};

const writeEnvFiles = async (rootPath, opts) => {
  console.log('writing environment files...');
  await Promise.all(
    [LOCAL, DEV, TEST].map((env) => writeEnvFile(env, rootPath, opts))
  );
  console.log('wrote environment files');
};

export default writeEnvFiles;
