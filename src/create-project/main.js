const chalk = require('chalk');
const fs = require('fs');
const ncp = require('ncp');
const path = require('path');
const { promisify } = require('util');
const execa = require('execa');
const Listr = require('listr');
const { projectInstall } = require('pkg-install');

const URL = require('url').URL;
const copy = promisify(ncp);

async function copyTemplateFiles(templateDirectory, targetDirectory) {
  return copy(templateDirectory, targetDirectory, {
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

const createProject = async (options = {}) => {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
  };

  const currentFileUrl = import.meta.url;
  let templateDir;
  if (process.platform === 'win32') {
    templateDir = path.resolve(
      new URL(currentFileUrl).pathname.replace('/', ''),
      '../../../templates',
      options.template.toLowerCase(),
    );
  } else {
    templateDir = path.resolve(new URL(currentFileUrl).pathname, '../../../templates', options.template.toLowerCase());
  }
  options.templateDirectory = templateDir.replace(/%20/g, ' ');

  try {
    if (!fs.existsSync(options.templateDirectory)) {
      fs.mkdirSync(options.templateDirectory);
    }
  } catch (err) {
    console.log(err);
    console.error('%s Invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
  }

  const tasks = new Listr([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options.templateDirectory, options.targetDirectory),
      enabled: () => options.template,
    },
    {
      title: 'Install dependencies',
      task: () => projectInstall({ cwd: options.targetDirectory }),
      enabled: () => options.install,
      skip: () => (!options.install ? 'Pass --install to automatically install dependencies' : undefined),
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
};

module.exports = { createProject };
