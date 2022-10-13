import fs from 'fs-extra';
import path from 'path';
import util from 'util';
import {
  DEV,
  ENV_TEMPLATE_FOLDER,
  LOCAL,
  TEMPLATE_APP_ID,
  TEST,
} from './config.js';

const readFile = util.promisify(fs.readFile);

const writeEnvFiles = async (rootPath, opts) => {
  console.log('writing environment files...\n');
  await Promise.all(
    [TEST, LOCAL, DEV].map(async (env) => {
      const fileName = `.env.${env}`;
      try {
        const fileContent = await readFile(
          path.join(rootPath, ENV_TEMPLATE_FOLDER, fileName),
          'utf-8'
        );
        const newContent = fileContent.replace(
          TEMPLATE_APP_ID,
          opts.graaspAppId
        );
        await fs.writeFile(path.join(rootPath, fileName), newContent, 'utf8');
      } catch (e) {
        console.error(e);
      }
    })
  );
  console.log('wrote environment files');
};

export default writeEnvFiles;
