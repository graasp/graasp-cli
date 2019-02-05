import path from 'path';
import execSync from 'child_process';
import execa from 'execa';
import fs from 'fs-extra';
import HostedGitInfo from 'hosted-git-info';
import { sync as existsSync } from 'fs-exists-cached';
import { DEFAULT_STARTER } from './config';

// use execa to spawn a better child process
const spawn = (cmd) => {
  const [file, ...args] = cmd.split(/\s+/);
  return execa(file, args, { stdio: 'inherit' });
};

/**
 * checks for the existence of yarn package
 * use yarnpkg instead of yarn to avoid conflict with Hadoop yarn
 * see: https://github.com/yarnpkg/yarn/issues/673
 * @returns {boolean} true if yarn exists, false otherwise
 */
const shouldUseYarn = () => {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

// executes `npm install` or `yarn install` in rootPath
const install = async (rootPath) => {
  const prevDir = process.cwd();

  console.log('installing packages...');
  process.chdir(rootPath);

  try {
    const cmd = shouldUseYarn() ? spawn('yarnpkg') : spawn('npm install');
    await cmd;
  } finally {
    process.chdir(prevDir);
  }
};

const clone = async (hostInfo, rootPath) => {
  let url;
  // let people use private repos accessed over ssh
  if (hostInfo.getDefaultRepresentation() === 'sshurl') {
    url = hostInfo.ssh({ noCommittish: true });
    // otherwise default to normal git syntax
  } else {
    url = hostInfo.https({ noCommittish: true, noGitPlus: true });
  }

  const branch = hostInfo.committish ? `-b ${hostInfo.committish}` : '';

  console.log(`creating new site from git: ${url}`);

  await spawn(`git clone ${branch} ${url} ${rootPath} --single-branch`);

  console.log('created starter directory layout');

  await fs.remove(path.join(rootPath, '.git'));

  await install(rootPath);
};

const initStarter = async (projectDirectory, options = {}) => {
  const rootPath = projectDirectory || process.cwd();

  const { starter = DEFAULT_STARTER } = options;

  if (existsSync(path.join(rootPath, 'package.json'))) {
    console.error(`directory ${rootPath} is already an npm project`);
    return false;
  }

  const hostedInfo = HostedGitInfo.fromUrl(starter);
  return clone(hostedInfo, rootPath);
};

export default initStarter;
