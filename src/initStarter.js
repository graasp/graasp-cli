import _ from 'lodash';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import util from 'util';
import replaceInFilePkg from 'replace-in-file';
import { replace as replaceJSON } from 'replace-json-property';
import HostedGitInfo from 'hosted-git-info';
import { deleteSync } from 'del';
import fsExistsCached from 'fs-exists-cached';
import inquirer from 'inquirer';
import {
  DEFAULT_PATH,
  DEFAULT_STARTER,
  GRAASP_IGNORE_FILE,
  HTML_TEMPLATE,
  STARTERS,
  YAML_TEMPLATE,
} from './config.js';
import writeEnvFiles from './writeEnvFiles.js';
import { spawn } from './utils.js';

const { sync: existsSync } = fsExistsCached;
const { replaceInFile } = replaceInFilePkg;
const readFile = util.promisify(fs.readFile);

// chooses the starter to use based on type, framework and language
const getStarter = async (type, framework, lang) => {
  const typeChoices = STARTERS[type];
  if (!typeChoices) {
    console.error(`there is no starter corresponding to your type (${type})`);
    return false;
  }
  const frameworkChoices = typeChoices[framework];
  if (!frameworkChoices) {
    console.error(
      `there is no starter corresponding to your type (${type}), framework ${framework}`
    );
    return false;
  }
  const starter = frameworkChoices[lang];
  if (!starter) {
    console.error(
      `there is no starter corresponding to your type (${type}), framework (${framework}) and programming language (${lang})`
    );
    const answer = await inquirer.prompt({
      name: `Use default starter (${DEFAULT_STARTER})`,
      type: 'confirm',
    });
    if (answer) {
      return DEFAULT_STARTER;
    }
    return false;
  }
  return starter;
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
    if (shouldUseYarn()) {
      console.log('switching to yarn v2...');
      await spawn('yarn set version berry');
      await spawn('yarn');
    } else {
      await spawn('npm install');
    }
  } finally {
    process.chdir(prevDir);
  }
};

// remove files in .graaspignore file
const removeIgnoredFiles = async (rootPath) => {
  const prevDir = process.cwd();

  console.log('removing ignored files');
  process.chdir(rootPath);

  try {
    const text = await readFile(GRAASP_IGNORE_FILE, { encoding: 'utf8' });
    const lines = text.split('\n');

    // pattern cannot be empty
    const files = lines.filter((line) => line !== '');

    // delete matching files, including hidden ones
    deleteSync(files, { dot: true });
  } catch (e) {
    console.error(e);
  } finally {
    process.chdir(prevDir);
  }
};

// creates a new git repository
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

  console.log('performing initial commit (running linter and tests)...');
  process.chdir(rootPath);

  try {
    await spawn('git add -A', { stdio: 'ignore' });
    console.log('this may take some time');
    // cannot spawn this because of the way we are splitting the command
    execSync('git commit -m "chore: initial commit from graasp cli"', {
      stdio: 'ignore',
    });
    console.log('performed initial commit');
  } catch (e) {
    // if we successfully initialized but couldn't commit, maybe the commit
    // author config is not set, or the repository is being set in a directory
    // that conflicts with our dependencies, e.g. inside a package that has a
    // babel-eslint version incompatible with create-react-app, so if we get to
    // this state, we remove the git files and show a message to the user
    try {
      console.error(e);
      console.log('could not initialize the git repository');
      console.log('is your commit author config set?');
      console.log(
        'might you be running this command inside a package with babel-eslint?'
      );
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
};

const writeReadme = async (rootPath, name, type) => {
  const string = `# Graasp ${_.capitalize(type)}: ${name}`;
  try {
    await fs.writeFile(path.join(rootPath, 'README.md'), string, 'utf8');
  } catch (e) {
    console.error(e);
  }
};

const replaceInFilesByType = async (patterns, template, newValue) => {
  const options = {
    files: patterns,
    from: new RegExp(template, 'g'),
    to: newValue,
  };
  try {
    const res = await replaceInFile(options);
    return res.filter((f) => f.hasChanged);
  } catch (e) {
    return [];
  }
};

const replaceProjectName = async (rootPath, fullName, projectName) => {
  const prevDir = process.cwd();
  console.log('branding project...');
  process.chdir(rootPath);
  try {
    // replace in yaml
    const yamlFiles = await Promise.all(
      ['.github/workflows/*.yaml', '.github/workflows/*.yml'].map(
        async (pattern) =>
          replaceInFilesByType(pattern, YAML_TEMPLATE, fullName)
      )
    );
    console.log(
      'Yaml files:',
      yamlFiles.flat().map((f) => f.file)
    );

    // replace in html
    const htmlFiles = await replaceInFilesByType(
      'public/*.html',
      HTML_TEMPLATE,
      fullName
    );
    console.log(
      'HTML files:',
      htmlFiles.map((f) => f.file)
    );

    // replace name in package.json
    replaceJSON('./package.json', 'name', projectName, { silent: true });
    replaceJSON('./public/manifest.json', 'name', projectName, {
      silent: true,
    });
    replaceJSON('./public/manifest.json', 'short_name', projectName, {
      silent: true,
    });
  } catch (e) {
    // todo: add logger
    console.error(e);
  } finally {
    process.chdir(prevDir);
  }
};

const checkDeploymentMethod = async (rootPath, useGithubActions) => {
  if (!useGithubActions) {
    try {
      await fs.remove(path.join(rootPath, '.github'));
    } catch (e) {
      console.error(e);
    }
  }
};

/**
 *
 * @param {{ starter?:  string,
 *  name: string,
 *  type: "app",
 *  framework: "react",
 *  lang: "ts" | "js",
 *  githubActions: boolean,
 *  graaspAppId: string,
 *  p?: string }
 * } options Selected options to initialize the starter
 * @returns whether the initialization has succeeded
 */
async function initStarter(options) {
  const {
    starter: userProvidedStarter,
    name,
    type,
    framework,
    lang,
    githubActions,
    graaspAppId,
    p = DEFAULT_PATH,
  } = options;
  let starter = userProvidedStarter;

  if (!starter) {
    starter = await getStarter(type, framework, lang);
    if (!starter) {
      return false;
    }
  }

  // enforce naming convention
  const projectName = `graasp-${type}-${name
    .split(' ')
    .join('-')}`.toLowerCase();
  const projectDirectory = path.join(p, projectName);

  // check for existing project in project directory
  if (existsSync(path.join(projectDirectory, 'package.json'))) {
    console.error(
      `destination path '${projectDirectory}' is already an npm project`
    );
    return false;
  }

  // check for existing git repo in project directory
  if (existsSync(path.join(projectDirectory, '.git'))) {
    console.error(
      `destination path '${projectDirectory}' is already a git repository`
    );
    return false;
  }

  // clone starter kit to project directory
  const hostedInfo = HostedGitInfo.fromUrl(starter);
  if (!hostedInfo) {
    console.error(
      `"${starter}" could not be resolved to a git repository, please provide a valid repository address`
    );
    return false;
  }
  await clone(hostedInfo, projectDirectory);

  // write environment files
  await writeEnvFiles(projectDirectory, {
    graaspAppId,
  });

  // only remove ignored files if graaspignore file detected
  if (existsSync(path.join(projectDirectory, GRAASP_IGNORE_FILE))) {
    await removeIgnoredFiles(projectDirectory);
  }

  await replaceProjectName(projectDirectory, name, projectName);

  await initGit(projectDirectory);

  console.log('initialized git repository');

  await install(projectDirectory);

  // deployment method (removes .github directory when not using GitHub Actions)
  await checkDeploymentMethod(projectDirectory, githubActions);

  // write readme
  await writeReadme(projectDirectory, name, type);

  return commit(projectDirectory);
}

export default initStarter;
