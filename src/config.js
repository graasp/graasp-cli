// todo: change to the main branch
export const DEFAULT_STARTER = 'graasp/graasp-app-starter-ts';
export const DEFAULT_FRAMEWORK = 'react';
export const DEFAULT_PATH = './';
export const BUILD_DIRECTORY = 'build';
export const ENV_TEMPLATE_FOLDER = '.env_templates';

// define types of starters that exist
export const STARTER_TYPE_APP = 'app';
export const STARTER_TYPE_CHOICES = {
  [STARTER_TYPE_APP]: 'App',
};

// define frameworks supported
export const FRAMEWORK_REACT = 'react';
export const FRAMEWORK_CHOICES = {
  [FRAMEWORK_REACT]: 'React',
};

// define available languages
export const LANGUAGE_TYPESCRIPT = 'ts';
export const LANGUAGE_JAVASCRIPT = 'js';
export const LANGUAGE_CHOICES = {
  [LANGUAGE_TYPESCRIPT]: 'TypeScript',
  [LANGUAGE_JAVASCRIPT]: 'JavaScript',
};

// combine options into an object to select the appropriate starter url
export const STARTERS = {
  [STARTER_TYPE_APP]: {
    [FRAMEWORK_REACT]: {
      [LANGUAGE_TYPESCRIPT]: DEFAULT_STARTER,
    },
  },
};

export const BUILD_PACKAGE_NAME = 'package.zip';

// environments
export const TEST = 'test';
export const LOCAL = 'local';
export const DEV = 'development';

// file names
export const GRAASP_IGNORE_FILE = '.graaspignore';

// replacement strings
// eslint-disable-next-line no-template-curly-in-string, no-useless-escape
export const YAML_TEMPLATE = 'GRAASP_TEMPLATE_FULL_NAME';
export const HTML_TEMPLATE = '%GRAASP_TEMPLATE_FULL_NAME%';
export const APP_ID_TEMPLATE = '{{GRAASP_APP_ID}}';
