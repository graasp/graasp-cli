import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { DEFAULT_PATH, BUILD_DIRECTORY, BUILD_PACKAGE_NAME } from './config.js';

const removeFileIfExists = (filepath) => {
  try {
    fs.statSync(filepath);
    fs.unlinkSync(filepath);
  } catch (e) {
    // do nothing
    // the file does not exist
  }
};

const createPackageFile = () => {
  try {
    const buildDirPath = path.resolve(DEFAULT_PATH, BUILD_DIRECTORY);
    const zipPath = path.join(buildDirPath, BUILD_PACKAGE_NAME);

    removeFileIfExists(zipPath);

    // archive build folder into zip
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warning(err);
      }
    });
    archive.on('error', (err) => {
      console.log('error');
      // remove resulting file
      removeFileIfExists(zipPath);
      throw err;
    });
    archive.pipe(output);
    archive.directory(buildDirPath, false);
    archive.finalize();
  } catch (err) {
    console.error(err);
  }
};

export default createPackageFile;
