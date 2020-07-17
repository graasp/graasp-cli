import execa from 'execa';

// use execa to spawn a better child process
export const spawnProcess = (cmd, opts = { stdio: 'inherit' }) => {
  const [file, ...args] = cmd.split(/\s+/);
  return execa(file, args, opts);
};

export const promisify = (fn) => (...args) => {
  Promise.resolve(fn(...args)).then(
    () => process.exit(0),
    // err => report.panic(err)
  );
};
