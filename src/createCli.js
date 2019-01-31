import yargs from 'yargs';

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
      command: 'new [rootPath] [starter]',
      desc: 'Create new Graasp app.',
    })
    .wrap(cli.terminalWidth())
    .demandCommand(1, 'Pass --help to see all available commands and options.')
    .strict()
    .showHelpOnFail(true)
    .recommendCommands()
    .parse(argv.slice(2));
};


export default createCli;
