import chalk from 'chalk';
import fs from 'fs-extra';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';

const URL = require('url').URL;
const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

async function initGit(options) {
  const result = await execa('git', ['init'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

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

  const currentFileUrl = import.meta.url;
  let templateDir;
  if (process.platform === 'win32') {
    templateDir = path.resolve(
      new URL(currentFileUrl).pathname.replace('/', ''),
      '../../templates',
      options.template.toLowerCase(),
    );
  } else {
    templateDir = path.resolve(new URL(currentFileUrl).pathname, '../../templates', options.template.toLowerCase());
  }
  options.templateDirectory = templateDir;

  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (err) {
    console.error('%s Invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
  }

  const tasks = new Listr([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Install dependencies',
      task: () => projectInstall({ cwd: options.targetDirectory }),
      enabled: () => options.install,
      skip: () => (!options.install ? 'Pass --install to automatically install dependencies' : undefined),
    },
    {
      title: 'Install atoms',
      task: () => installAtoms({ cwd: options.targetDirectory }),
      enabled: () => options.atoms,
      skip: () => (!options.atoms ? 'Pass --atoms to automatically install atoms' : undefined),
    },
    {
      title: 'Initialize git',
      task: () => initGit(options),
      enabled: () => options.git,
      skip: () => (!options.git ? 'Pass --git to automatically init git' : undefined),
    },
  ]);

  await tasks.run();
  console.log('%s Project ready', chalk.green.bold('DONE'));
  return true;
}
