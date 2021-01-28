const { createSnippets } = require('./src/snippets/main');

if (!module.parent) {
  const { createProject } = require('./src/create-project/main');
  createProject();
  module.exports.createProject = createProject;
}

module.exports.createSnippets = createSnippets;
