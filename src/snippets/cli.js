import arg from 'arg';
import inquirer from 'inquirer';
import { createSnippets } from './main';

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--root': String,
      '--add': String,
      '--packages': String,
      '-r': '--root',
      '-a': '--add',
      '-p': '--packages',
    },
    {
      argv: rawArgs.slice(2),
    },
  );
  return {
    root: args['--root'] || false,
    add: args['--add'] || false,
    packages: args['--packages'] || false,
  };
}

async function promptForMissingOptions(options) {
  const questions = [];

  if (!options.root) {
    questions.push({
      type: 'input',
      name: 'root',
      message: 'Please choose ROOT folder',
      default: process.cwd(),
    });
  }

  if (!options.add) {
    questions.push({
      type: 'input',
      name: 'add',
      message: 'Additional folders',
      default: '',
    });
  }

  if (!options.packages) {
    questions.push({
      type: 'input',
      name: 'packages',
      message: 'Packages with tests',
      default: '',
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    root: options.root || answers.root,
    add: (options.add || answers.add).split(','),
    packages: (options.packages || answers.packages).split(','),
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createSnippets(options);
}
