import execa from 'execa';

// TODO: this is not optimal naming since it may cause confusion with 'spawn()' from 'child_process' module;

// use execa to spawn a better child process
/* eslint-disable-next-line import/prefer-default-export */
export const spawn = (cmd, opts = { stdio: 'inherit' }) => {
  const [file, ...args] = cmd.split(/\s+/);
  return execa(file, args, opts);
};
