#!/usr/bin/env node

// https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/
const fs = require('fs');

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const { execSync } = require('child_process');

const cwd = process.cwd();

const autoinit = require('npm-autoinit');
const simpleGit = require('simple-git')(cwd);

const directoryExists = filePath => {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
};

const run = async () => {
  clear();

  console.log(chalk.yellow(figlet.textSync('PuppeDo CLI', { horizontalLayout: 'full' })));

  await autoinit(cwd, () => {
    console.log(chalk.green('- Init NPM success'));
  });

  if (!directoryExists('./atoms')) {
    try {
      await simpleGit.clone('https://github.com/starikan/PuppeDoAtoms', 'atoms');
      console.log(chalk.green('- clone https://github.com/starikan/PuppeDoAtoms to "atoms" success'));
    } catch (err) {}
  }

  if (!directoryExists('./data')) {
    fs.mkdirSync('data');
    console.log(chalk.green('- Data directory created success'));
  }
  if (!directoryExists('./tests')) {
    fs.mkdirSync('tests');
    console.log(chalk.green('- Tests directory created success'));
  }
  if (!directoryExists('./envs')) {
    fs.mkdirSync('envs');
    console.log(chalk.green('- Envs directory created success'));
  }

  try {
    execSync('npm i https://github.com/starikan/PuppeDo -S');
    console.log(chalk.green('- PuppeDo installed success'));
  } catch (err) {}
};

run();
