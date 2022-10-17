import yargs from 'yargs';
import prompt from './prompt.js';
import {
  DEFAULT_STARTER,
  FRAMEWORK_CHOICES,
  STARTER_TYPE_CHOICES,
} from './config.js';
import createPackageFile from './createPackageFile.js';

const promisify =
  (fn) =>
  (...args) => {
    Promise.resolve(fn(...args)).then(
      () => {
        process.exit(0);
      }
      // err => report.panic(err)
    );
  };

const createCli = (argv) => {
  const cli = yargs();

  cli
    .usage('Usage: $0 <command> [options]')
    .alias('h', 'help')
    .alias('v', 'version')
    .option('verbose', {
      default: false,
      type: 'boolean',
      describe: 'Turn on verbose output',
      global: true,
    })
    .option('no-color', {
      default: false,
      type: 'boolean',
      describe: 'Turn off the color in output',
      global: true,
    });

  // create a new app or lab
  return (
    cli
      .command({
        command: 'new',
        desc: 'Create new Graasp app.',
        builder: (_) => {
          _.option('s', {
            alias: 'starter',
            type: 'string',
            describe: `Set starter. Defaults to ${DEFAULT_STARTER}`,
          })
            .option('f', {
              alias: 'framework',
              choices: Object.keys(FRAMEWORK_CHOICES),
              describe: 'Set development framework (e.g. React, ...)',
            })
            .option('t', {
              alias: 'type',
              choices: Object.keys(STARTER_TYPE_CHOICES),
              describe: 'Type of application (app)',
            })
            .option('p', {
              alias: 'path',
              type: 'string',
              describe: 'Path where project directory will be set up.',
            });
        },
        handler: promisify(prompt),
      })
      // package an app built files into a zip file
      .command({
        command: 'package',
        describe: 'Package the build folder of an app into a zip file.',
        handler: promisify(createPackageFile),
      })
      .wrap(cli.terminalWidth())
      .demandCommand(
        1,
        'Pass --help to see all available commands and options.'
      )
      .strict()
      .showHelpOnFail(true)
      .recommendCommands()
      .parse(argv.slice(2))
  );
};

export default createCli;
