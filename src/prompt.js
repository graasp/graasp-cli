import inquirer from 'inquirer';
import { validate as UUIDValidate, v4 } from 'uuid';
import initStarter from './initStarter.js';

const validateGraaspAppId = (value) => {
  // allow valid v4 uuids
  if (UUIDValidate(value) || value === '') {
    return true;
  }
  return 'Graasp App ID is not valid. Leave it empty so that we automatically generate one for you.';
};

const prompt = async (opts) => {
  const { type } = opts;

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Name',
      default: 'My App',
    },
    {
      type: 'list',
      message: 'Type',
      name: 'type',
      choices: [
        {
          name: 'App',
          checked: true,
        },
        {
          name: 'Lab',
        },
      ],
      filter: (val) => val.toLowerCase(),
      when: () => Boolean(!type),
    },
    {
      type: 'list',
      message: 'Framework',
      name: 'framework',
      choices: [
        {
          name: 'React',
          checked: true,
        },
      ],
      filter: (val) => val.toLowerCase(),
    },
    {
      type: 'list',
      message: 'Language',
      name: 'lang',
      choices: [
        {
          name: 'TypeScript',
          checked: true,
        },
        // todo: add another template for JS
      ],
      filter: (val) => val.toLowerCase(),
    },
    {
      type: 'confirm',
      name: 'mockApi',
      message: 'Use mocked API',
      default: true,
    },
    {
      type: 'confirm',
      name: 'githubActions',
      message: 'Deploy using GitHub Actions (recommended)',
      default: true,
    },
    {
      type: 'input',
      name: 'graaspAppId',
      message: 'Graasp App ID',
      default: () => v4(),
      validate: validateGraaspAppId,
    },
  ]);

  // default to random graasp app id
  if (answers.graaspAppId === '') {
    answers.graaspAppId = v4();
  }

  const config = {
    ...answers,
    ...opts,
  };
  return initStarter(config);
};

export default prompt;
