import execa from 'execa';

// use execa to spawn a better child process
/* eslint-disable-next-line import/prefer-default-export */
export const spawn = (cmd, opts = { stdio: 'inherit' }) => {
  const [file, ...args] = cmd.split(/\s+/);
  return execa(file, args, opts);
};
