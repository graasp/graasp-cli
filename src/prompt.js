import inquirer from 'inquirer';
import ObjectId from 'bson-objectid';
import {
  AWS_ACCESS_KEY_ID_LENGTH,
  AWS_SECRET_ACCESS_KEY_LENGTH,
} from './config';
import initStarter from './initStarter';

const validateGraaspDeveloperId = (value) => {
  // allow valid object ids or empty
  if (ObjectId.isValid(value) || value === '') {
    return true;
  }
  return 'Graasp Developer ID is not valid. Leave it empty if you do not have it yet.';
};

const validateGraaspAppId = (value) => {
  // allow valid object ids
  if (ObjectId.isValid(value) || value === '') {
    return true;
  }
  return 'Graasp App ID is not valid. Leave it empty so that we automatically generate one for you.';
};

const validateAwsAccessKeyId = (value) => {
  // allow valid length or empty strings
  if (value.length === AWS_ACCESS_KEY_ID_LENGTH || value === '') {
    return true;
  }
  return 'AWS Access Key ID is not valid. Leave it empty if you do not have it yet.';
};

const validateAwsSecretAccessKey = (value) => {
  // allow valid length or empty strings
  if (value.length === AWS_SECRET_ACCESS_KEY_LENGTH || value === '') {
    return true;
  }
  return 'AWS Secret Access Key is not valid. Leave it empty if you do not have it yet.';
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
      type: 'confirm',
      name: 'api',
      message: 'Use Graasp API',
      default: true,
    },
    {
      type: 'confirm',
      name: 'ecosystem',
      message: 'Deploy to Graasp Ecosystem',
      default: true,
    },
    {
      type: 'input',
      name: 'graaspDeveloperId',
      message: 'Graasp Developer ID',
      when: (responses) => Boolean(responses.ecosystem),
      validate: validateGraaspDeveloperId,
    },
    {
      type: 'input',
      name: 'graaspAppId',
      message: 'Graasp App ID',
      default: () => ObjectId().str,
      when: (responses) => Boolean(responses.ecosystem),
      validate: validateGraaspAppId,
    },
    {
      type: 'input',
      name: 'awsAccessKeyId',
      message: 'AWS Access Key ID',
      when: (responses) => Boolean(responses.ecosystem),
      validate: validateAwsAccessKeyId,
    },
    {
      type: 'password',
      name: 'awsSecretAccessKey',
      message: 'AWS Secret Access Key',
      mask: '*',
      when: (responses) => Boolean(responses.ecosystem),
      validate: validateAwsSecretAccessKey,
    },
  ]);

  // default to random graasp app id
  if (answers.graaspAppId === '') {
    answers.graaspAppId = ObjectId().str;
  }

  const config = {
    ...answers,
    ...opts,
  };
  return initStarter(config);
};

export default prompt;
