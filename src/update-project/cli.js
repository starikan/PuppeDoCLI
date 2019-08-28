import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main';

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--yes': Boolean,
      '--npm': Boolean,
      '--atoms': Boolean,
      '-y': '--yes',
      '-n': '--npm',
      '-a': '--atoms',
    },
    {
      argv: rawArgs.slice(2),
    },
  );
  return {
    yes: args['--yes'] || false,
    npm: args['--npm'] || args['--yes'] ? true : false,
    atoms: args['--atoms'] || args['--yes'] ? true : false,
  };
}

async function promptForMissingOptions(options) {
  const questions = [];
  if (!options.npm) {
    questions.push({
      type: 'confirm',
      name: 'npm',
      message: 'Update NPM packages?',
      default: true,
    });
  }

  if (!options.atoms) {
    questions.push({
      type: 'confirm',
      name: 'atoms',
      message: 'Update Atoms?',
      default: true,
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    npm: options.npm || answers.npm,
    atoms: options.atoms || answers.atoms,
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createProject(options);
  // console.log(options);
}
