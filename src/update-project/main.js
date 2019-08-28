import chalk from 'chalk';
import fs from 'fs-extra';
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';

async function installAtoms(options) {
  fs.removeSync('atoms');
  const result = await execa('git', ['clone', 'https://github.com/starikan/PuppeDoAtoms', 'atoms'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to install atoms'));
  }
  return;
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
  };

  const tasks = new Listr([
    {
      title: 'Update dependencies',
      task: () => projectInstall({ cwd: options.targetDirectory }),
      enabled: () => options.npm,
      skip: () => (!options.npm ? 'Pass --install to automatically install dependencies' : undefined),
    },
    {
      title: 'Update atoms',
      task: () => installAtoms({ cwd: options.targetDirectory }),
      enabled: () => options.atoms,
      skip: () => (!options.atoms ? 'Pass --atoms to automatically install atoms' : undefined),
    },
  ]);

  await tasks.run();
  console.log('%s Update ready', chalk.green.bold('DONE'));
  return true;
}
