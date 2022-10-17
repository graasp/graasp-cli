import fs from 'fs-extra';
import path from 'path';
import util from 'util';
import {
  DEV,
  ENV_TEMPLATE_FOLDER,
  LOCAL,
  APP_ID_TEMPLATE,
  TEST,
} from './config.js';

const readFile = util.promisify(fs.readFile);

const writeEnvFiles = async (rootPath, opts) => {
  console.log('writing environment files...');
  await Promise.all(
    // loop over the type of env files
    [TEST, LOCAL, DEV].map(async (env) => {
      // create the file name
      const fileName = `.env.${env}`;
      try {
        // read the content of the env file provided by the repo
        // the template env files are stored in a ".env_template" folder in the starters
        const fileContent = await readFile(
          path.join(rootPath, ENV_TEMPLATE_FOLDER, fileName),
          'utf-8'
        );
        // replace the chosen app id the file
        const newContent = fileContent.replace(
          APP_ID_TEMPLATE,
          opts.graaspAppId
        );
        // write file to the root of the project
        await fs.writeFile(path.join(rootPath, fileName), newContent, 'utf8');
      } catch (e) {
        console.error(e);
      }
    })
  );
  console.log('wrote environment files');
};

export default writeEnvFiles;
