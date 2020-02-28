import fs from 'fs-extra';
import path from 'path';

const yaml = require('js-yaml');
const walkSync = require('walk-sync');

const templateGen = (data, type) => {
  const { name, needData, needSelectors, allowResults, allowOptions, help, description } = data;
  let counter = 1;

  let snippet = {
    scope: 'yaml,plaintext',
    prefix: `ppd${type === 'atom' ? 'a' : 't'}_${name}`,
    description: description,
    body: [`- ${name}:`, '    ' + `description: $${counter++}`],
  };

  const genLine = (data, helpName, invert) => {
    let helpData = help && help[helpName] && help[helpName][data];
    let helpString = '';
    let helpDefault;
    if (typeof helpData === 'string') {
      helpString = ' # ' + help[helpName][data];
    }
    if (typeof helpData === 'object') {
      helpString = ' # ' + help[helpName][data].description;
      helpDefault = help[helpName][data].default;
    }

    if (data.match(/\?/)) {
      data = data.replace(/\?/g, '');
      helpString = helpString === '' ? ' # [optional]' : helpString + ' [optional]';
    }

    let mainPart = `${data}: ${helpDefault ? helpDefault : '$' + counter}`;
    if (invert) {
      mainPart = `$${counter}: ${data}`;
    }
    return { mainPart, helpString };
  };

  const genBlock = (data, counter, helpName, prefix, invert = false) => {
    if (data) {
      if (data.length === 1) {
        const { mainPart, helpString } = genLine(data[0], helpName, invert);
        snippet.body.push(`    ${prefix}: { ${mainPart} }${helpString}`);
        counter += 1;
      } else {
        snippet.body.push(`    ${prefix}:`);
        for (let i = 0; i < data.length; i++) {
          const { mainPart, helpString } = genLine(data[i], helpName, invert);
          snippet.body.push(`      ${mainPart}${helpString}`);
          counter += 1;
        }
      }
    }
    return counter;
  };

  counter = genBlock(needData, counter, 'data', 'bindData');
  counter = genBlock(needData, counter, 'data', 'data');
  counter = genBlock(needSelectors, counter, 'selectors', 'bindSelector');
  counter = genBlock(needSelectors, counter, 'selectors', 'selector');
  counter = genBlock(allowOptions, counter, 'options', 'options');

  if (needData || needSelectors) {
    snippet.body.push('    ' + `if: "true"`);
    snippet.body.push('    ' + `errorIf: "false"`);
  }

  genBlock(allowResults, counter, 'results', 'r', true);

  if (allowResults) {
    snippet.body.push('    ' + `resultFunction: ""`);
    snippet.body.push('    ' + `errorIfResult: "false"`);
    snippet.body.push('    ' + `while: "false"`);
    snippet.body.push('    ' + `repeat: 1`);
  }

  return snippet;
};

export async function createSnippets(options) {
  const exts = ['.yaml', '.yml', '.ppd'];
  const types = ['test', 'atom'];
  let allContent = [];

  let files = walkSync(options.root, { ignore: options.ignore }).map(v => path.join(options.root, v));

  if (options.packages) {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const nodeModules = walkSync(nodeModulesPath).map(v => path.join(nodeModulesPath, v));
    files = [...files, ...nodeModules];
  }

  const tests = files.filter(v => exts.includes(path.parse(v).ext));

  tests.forEach(filePath => {
    try {
      const full = yaml.safeLoadAll(fs.readFileSync(filePath, 'utf8'));
      for (let v of full) {
        v.filePath = filePath;
        if (types.includes(v.type)) {
          allContent.push(v);
        }
      }
    } catch (error) {}
  });

  const snippets = allContent.reduce((result, v) => {
    if (v.type === 'test') {
      result[`PPD test ${v.name}`] = templateGen(v, 'test');
    }
    if (v.type === 'atom') {
      result[`PPD atom ${v.name}`] = templateGen(v, 'atom');
    }
    return result;
  }, {});

  fs.writeFileSync(path.join(process.cwd(), '.vscode', 'ppd.code-snippets'), JSON.stringify(snippets));
  console.log('Create snippets');
}
