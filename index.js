const { createProject } = require('./src/create-project/main');
const { createSnippets } = require('./src/snippets/main');

if (module.parent) {
  createProject();
}

module.exports = {
  createSnippets,
  createProject,
};
