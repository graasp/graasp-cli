import path from 'path';
import { execSync } from 'child_process';
import execa from 'execa';
import fs from 'fs-extra';
import HostedGitInfo from 'hosted-git-info';
import { sync as existsSync } from 'fs-exists-cached';
import { DEFAULT_STARTER } from './config';
import writeEnvFiles from './writeEnvFiles';

// use execa to spawn a better child process
const spawn = (cmd, opts = { stdio: 'inherit' }) => {
  const [file, ...args] = cmd.split(/\s+/);
  return execa(file, args, opts);
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

// creates an new git repository
const initGit = async (rootPath) => {
  const prevDir = process.cwd();

  console.log('creating new git repository...');
  process.chdir(rootPath);

  try {
    execSync('git init', { stdio: 'ignore' });
  } finally {
    process.chdir(prevDir);
  }
};

// perform initial commit
const commit = async (rootPath) => {
  const prevDir = process.cwd();

  console.log('performing initial commit...');
  process.chdir(rootPath);

  try {
    await spawn('git add -A', { stdio: 'ignore' });

    // cannot spawn this because of the way we are splitting the command
    execSync('git commit -m "chore: initial commit from graasp cli"', { stdio: 'ignore' });
    console.log('performed initial commit');
  } catch (e) {
    // if we successfully initialized but couldn't commit, maybe the commit
    // author config is not set, or the repository is being set in a directory
    // that conflicts with our dependencies, e.g. inside a package that has a
    // babel-eslint version incompatible with create-react-app, so if we get to
    // this state, we remove the git files and show a message to the user
    try {
      console.log('could not initialize the git repository');
      console.log('is your commit author config set?');
      console.log('might you be running this command inside a package with babel-eslint?');
      await fs.remove('.git');
    } catch (removeErr) {
      // ignore
    }
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

  await initGit(rootPath);

  console.log('initialized git repository');

  await install(rootPath);

  await writeEnvFiles(rootPath);

  await commit(rootPath);
};

const initStarter = async (projectDirectory, options = {}) => {
  const rootPath = projectDirectory || process.cwd();

  const { starter = DEFAULT_STARTER } = options;

  if (existsSync(path.join(rootPath, 'package.json'))) {
    console.error(`destination path '${rootPath}' is already an npm project`);
    return false;
  }

  if (existsSync(path.join(rootPath, '.git'))) {
    console.error(`destination path '${rootPath}' is already a git repository`);
    return false;
  }

  const hostedInfo = HostedGitInfo.fromUrl(starter);
  return clone(hostedInfo, rootPath);
};

export default initStarter;
