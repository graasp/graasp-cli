import yargs from 'yargs';
import initStarter from './initStarter';
import { DEFAULT_STARTER } from './config';

const promisify = fn => (...args) => {
  Promise.resolve(fn(...args)).then(
    () => process.exit(0),
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

  return cli
    .command({
      command: 'new [projectDirectory]',
      desc: 'Create new Graasp app.',
      builder: _ => _.option('s', {
        alias: 'starter',
        type: 'string',
        default: DEFAULT_STARTER,
        describe: `Set starter. Defaults to ${DEFAULT_STARTER}`,
      }),
      handler: promisify(
        ({
          starter,
          projectDirectory,
        }) => initStarter(projectDirectory, { starter }),
      ),
    })
    .wrap(cli.terminalWidth())
    .demandCommand(1, 'Pass --help to see all available commands and options.')
    .strict()
    .showHelpOnFail(true)
    .recommendCommands()
    .parse(argv.slice(2));
};


export default createCli;
