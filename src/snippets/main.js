const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');
const walkSync = require('walk-sync');

const templateGen = (data, type) => {
  const { name, needData, needSelectors, allowResults, allowOptions, help, description } = data;
  let counter = 1;

  let snippet = {
    scope: 'yaml,plaintext',
    prefix: `ppd${type === 'atom' ? 'a' : 't'}_${name}`,
    description: description,
    body: [`- ${name}:`],
  };

  snippet.body.push('    ' + `description: $${counter++}`);
  snippet.body.push('    ' + `bindDescription: "'$${counter++}: ' + 0"`);

  const genLine = (lineData, helpName, invert) => {
    let helpData = help && help[helpName] && help[helpName][lineData];
    let helpString = '';
    let helpDefault;
    if (typeof helpData === 'string') {
      helpString = ' # ' + help[helpName][lineData];
    }
    if (typeof helpData === 'object') {
      helpString = ' # ' + help[helpName][lineData].description;
      helpDefault = help[helpName][lineData].default;
    }

    if (lineData.match(/\?/)) {
      lineData = lineData.replace(/\?/g, '');
      helpString = helpString === '' ? ' # [optional]' : helpString + ' [optional]';
    }

    let mainPart = `${lineData}: ${helpDefault ? helpDefault : '$' + counter}`;
    if (invert) {
      mainPart = `$${counter}: ${lineData}`;
    }
    return { mainPart, helpString };
  };

  const genBlock = (blockData, counter, helpName, prefix, invert = false) => {
    if (blockData) {
      if (blockData.length === 1) {
        const { mainPart, helpString } = genLine(blockData[0], helpName, invert);
        snippet.body.push(`    ${prefix}: { ${mainPart} }${helpString}`);
        counter += 1;
      } else {
        snippet.body.push(`    ${prefix}:`);
        for (let i = 0; i < blockData.length; i++) {
          const { mainPart, helpString } = genLine(blockData[i], helpName, invert);
          snippet.body.push(`      ${mainPart}${helpString}`);
          counter += 1;
        }
      }
    }
    return counter;
  };

  counter = genBlock(needData, counter, 'data', 'data');
  counter = genBlock(needData, counter, 'data', 'bindData');
  counter = genBlock(needSelectors, counter, 'selectors', 'selector');
  counter = genBlock(needSelectors, counter, 'selectors', 'bindSelector');
  counter = genBlock(allowOptions, counter, 'options', 'options');

  if (needData || needSelectors) {
    snippet.body.push('    ' + `if: "true"`);
    snippet.body.push('    ' + `errorIf: "false"`);
  }

  genBlock(allowResults, counter, 'results', 'result', true);

  if (allowResults) {
    snippet.body.push('    ' + `errorIfResult: "false"`);
    snippet.body.push('    ' + `while: "false"`);
  }
  snippet.body.push('    ' + `repeat: 1`);
  snippet.body.push('    ' + `debug: false`);

  return snippet;
};

const resolveTags = (content = {}) => {
  const { runTest = [], beforeTest = [], afterTest = [], tags = [] } = content || {};
  let tagsNew = tags;
  const nestedContent = [...runTest, ...beforeTest, ...afterTest].map((v) => Object.values(v)).flat();
  for (const nested of nestedContent) {
    tagsNew = [...tagsNew, ...resolveTags(nested)];
  }
  return [...new Set(tagsNew)];
};

const createSnippets = async (options) => {
  const exts = ['.yaml', '.yml', '.ppd'];
  const allContent = [];

  // Get files from tests folder
  walkSync(options.root, { ignore: options.ignore })
    .map((v) => path.join(options.root, v))
    .filter((v) => exts.includes(path.parse(v).ext))
    .forEach((filePath) => {
      try {
        const full = yaml.safeLoadAll(fs.readFileSync(filePath, 'utf8'));
        for (let v of full) {
          v.filePath = filePath;
          v.type = v.type || 'test';
          allContent.push(v);
        }
      } catch (error) {}
    });

  // Get atoms from mode_modules
  if (options.packages) {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    walkSync(nodeModulesPath)
      .map((v) => path.join(nodeModulesPath, v))
      .filter((v) => exts.includes(path.parse(v).ext))
      .forEach((filePath) => {
        try {
          const full = yaml.safeLoadAll(fs.readFileSync(filePath, 'utf8'));
          for (let v of full) {
            v.filePath = filePath;
            if (v.type === 'atom') {
              allContent.push(v);
            }
          }
        } catch (error) {}
      });
  }

  const allTags = [
    ...new Set(
      allContent
        .map((v) => resolveTags(v))
        .flat()
        .sort((a, b) => (a > b ? 1 : -1)),
    ),
  ];

  const snippets = allContent.reduce((result, v) => {
    if (v.type === 'test') {
      result[`PPD test ${v.name}`] = templateGen(v, 'test');
    }
    if (v.type === 'atom') {
      result[`PPD atom ${v.name}`] = templateGen(v, 'atom');
    }
    return result;
  }, {});

  allTags.forEach((v) => {
    snippets[`PPD tag ${v}`] = {
      scope: 'yaml,plaintext',
      prefix: `тэг_${v}`,
      description: `Тэг '${v}'`,
      body: [`${v}, `],
    };
  });

  snippets[`PPD allTags`] = {
    scope: 'yaml,plaintext',
    prefix: `тэги`,
    description: `Все теги которые есть в проекте`,
    body: [allTags.join('\n')],
  };

  fs.writeFileSync(path.join(process.cwd(), '.vscode', 'ppd.code-snippets'), JSON.stringify(snippets, null, 2));
  console.log('Create snippets');
};

module.exports = { createSnippets };
