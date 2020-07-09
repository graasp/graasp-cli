import { spawn } from './utils';

const deploy = async (opts) => {
  const { path } = opts;

  console.error(`path passed '${path}'`);
  console.log(process.cwd());
  try {
    await spawn('./test.sh');
  } catch (e) {
    console.error(e);
  }
  return true;
};

export default deploy;
