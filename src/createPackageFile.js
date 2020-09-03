import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { DEFAULT_PATH, BUILD_DIRECTORY } from './config';

const BUILD_PACKAGE_NAME = 'package.zip';

const createPackageFile = () => {
  try {
    const buildDirPath = `${DEFAULT_PATH}/${BUILD_DIRECTORY}`;
    const zipPath = path.join(buildDirPath, BUILD_PACKAGE_NAME);

    // remove previous zip file
    if (fs.existsSync(path)) {
      fs.unlinkSync(zipPath);
    }

    // archive build folder into zip
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.error(err);
      }
    });
    archive.on('error', (err) => {
      console.error(err);
    });
    archive.pipe(output);
    archive.directory(buildDirPath, false);
    archive.finalize();
  } catch (err) {
    console.error(err);
  }
};

export default createPackageFile;
