import arg from 'arg';
import inquirer from 'inquirer';
import { createSnippets } from './main';
import path from 'path';

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--root': String,
      // '--add': String,
      '--packages': Boolean,
      // '--ignore': Array,
      '-r': '--root',
      // '-a': '--add',
      '-p': '--packages',
      // '-i': '--ignore',
    },
    {
      argv: rawArgs.slice(2),
    },
  );
  return {
    root: args['--root'],
    // add: args['--add'] || false,
    packages: args['--packages'],
    // ignore: args['--ignore'],
  };
}

async function promptForMissingOptions(options) {
  const questions = [];

  if (!options.root) {
    questions.push({
      type: 'input',
      name: 'root',
      message: 'Please choose ROOT folder',
      default: path.join(process.cwd(), 'tests'),
    });
  }

  // if (!options.add) {
  //   questions.push({
  //     type: 'input',
  //     name: 'add',
  //     message: 'Additional folders',
  //     default: '',
  //   });
  // }

  if (!options.packages) {
    questions.push({
      type: 'input',
      name: 'packages',
      message: 'Atoms in node_modules',
      default: true,
    });
  }

  // if (!options.ignore) {
  //   questions.push({
  //     type: 'input',
  //     name: 'ignore',
  //     message: 'Folders to ignore',
  //     default: [],
  //   });
  // }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    root: options.root || answers.root,
    // add: (options.add || answers.add).split(','),
    packages: options.packages || answers.packages,
    // ignore: options.ignore || answers.ignore,
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createSnippets(options);
}
