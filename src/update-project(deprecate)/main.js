import chalk from 'chalk';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';

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
  ]);

  await tasks.run();
  console.log('%s Update ready', chalk.green.bold('DONE'));
  return true;
}
