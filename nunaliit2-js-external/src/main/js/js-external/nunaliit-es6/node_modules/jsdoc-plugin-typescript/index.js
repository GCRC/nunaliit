const path = require('path');
const fs = require('fs');
const env = require('jsdoc/env');

const config = env.conf.typescript;
if (!config) {
  throw new Error('Configuration "typescript" for jsdoc-plugin-typescript missing.');
}
if (!'moduleRoot' in config) {
  throw new Error('Configuration "typescript.moduleRoot" for jsdoc-plugin-typescript missing.');
}
const moduleRoot = config.moduleRoot;
const moduleRootAbsolute = path.join(process.cwd(), moduleRoot);
if (!fs.existsSync(moduleRootAbsolute)) {
  throw new Error('Directory "' + moduleRootAbsolute + '" does not exist. Check the "typescript.moduleRoot" config option for jsdoc-plugin-typescript');
}

const importRegEx = /import\(["']([^"']*)["']\)\.([^ \.\|\}><,\)=\n]*)([ \.\|\}><,\)=\n])/g;
const typedefRegEx = /@typedef \{[^\}]*\} ([^ \r?\n?]*)/;
const noClassdescRegEx = /@(typedef|module|type)/;
const slashRegEx = /\\/g;

const moduleInfos = {};
const fileNodes = {};

function getModuleInfo(moduleId, parser) {
  if (!moduleInfos[moduleId]) {
    const moduleInfo = moduleInfos[moduleId] = {
      namedExports: {}
    };
    if (!fileNodes[moduleId]) {
      const absolutePath = path.join(process.cwd(), moduleRoot, moduleId + '.js');
      if (!fs.existsSync(absolutePath)) {
        return null;
      }
      const file = fs.readFileSync(absolutePath, 'UTF-8');
      fileNodes[moduleId] = parser.astBuilder.build(file, absolutePath);
    }
    const node = fileNodes[moduleId];
    if (node.program && node.program.body) {
      const classDeclarations = {};
      const nodes = node.program.body;
      for (let i = 0, ii = nodes.length; i < ii; ++i) {
        const node = nodes[i];
        if (node.type === 'ClassDeclaration') {
          classDeclarations[node.id.name] = node;
        } else if (node.type === 'ExportDefaultDeclaration') {
          const classDeclaration = classDeclarations[node.declaration.name];
          if (classDeclaration) {
            moduleInfo.defaultExport = classDeclaration.id.name;
          }
        } else if (node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'ClassDeclaration') {
          moduleInfo.namedExports[node.declaration.id.name] = true;
        }
      }
    }
  }
  return moduleInfos[moduleId];
}

function getDefaultExportName(moduleId, parser) {
  return getModuleInfo(moduleId, parser).defaultExport;
}

function getDelimiter(moduleId, symbol, parser) {
  return getModuleInfo(moduleId, parser).namedExports[symbol] ? '.' : '~'
}

exports.astNodeVisitor = {

  visitNode: function(node, e, parser, currentSourceName) {
    if (node.type === 'File') {
      const relPath = path.relative(process.cwd(), currentSourceName);
      const modulePath = path.relative(path.join(process.cwd(), moduleRoot), currentSourceName).replace(/\.js$/, '');
      fileNodes[modulePath] = node;
      const identifiers = {};
      if (node.program && node.program.body) {
        const nodes = node.program.body;
        for (let i = 0, ii = nodes.length; i < ii; ++i) {
          let node = nodes[i];
          if (node.type === 'ExportNamedDeclaration' && node.declaration) {
            node = node.declaration;
          }
          if (node.type === 'ImportDeclaration') {
            node.specifiers.forEach(specifier => {
              let defaultImport = false;
              switch (specifier.type) {
                case 'ImportDefaultSpecifier':
                  defaultImport = true;
                  // fallthrough
                case 'ImportSpecifier':
                  identifiers[specifier.local.name] = {
                    defaultImport,
                    value: node.source.value
                  };
                  break;
                default:
              }
            });
          } else if (node.type === 'ClassDeclaration') {
            if (node.id && node.id.name) {
              identifiers[node.id.name] = {
                value: path.basename(currentSourceName)
              };
            }

            if (!node.leadingComments) {
              node.leadingComments = [];
              // Restructure named exports of classes so only the class, but not
              // the export are documented
              if (node.parent && node.parent.type === 'ExportNamedDeclaration' && node.parent.leadingComments) {
                for (let i = node.parent.leadingComments.length - 1; i >= 0; --i) {
                  const comment = node.parent.leadingComments[i];
                  if (comment.value.indexOf('@classdesc') !== -1 || !noClassdescRegEx.test(comment.value)) {
                    node.leadingComments.push(comment);
                    node.parent.leadingComments.splice(i, 1);
                    const ignore = parser.astBuilder.build('/** @ignore */').comments[0];
                    node.parent.leadingComments.push(ignore);
                  }
                }
              }
            }
            const leadingComments = node.leadingComments;
            if (leadingComments.length === 0 || leadingComments[leadingComments.length - 1].value.indexOf('@classdesc') === -1 &&
                noClassdescRegEx.test(leadingComments[leadingComments.length - 1].value)) {
              // Create a suitable comment node if we don't have one on the class yet
              const comment = parser.astBuilder.build('/**\n */', 'helper').comments[0];
              node.leadingComments.push(comment);
            }
            const leadingComment = leadingComments[node.leadingComments.length - 1];
            const lines = leadingComment.value.split(/\r?\n/);
            // Add @classdesc to make JSDoc show the class description
            if (leadingComment.value.indexOf('@classdesc') === -1) {
              lines[0] += ' @classdesc';
            }
            if (node.superClass) {
              // Add class inheritance information because JSDoc does not honor
              // the ES6 class's `extends` keyword
              if (leadingComment.value.indexOf('@extends') === -1) {
                lines.push(lines[lines.length - 1]);
                const identifier = identifiers[node.superClass.name];
                if (identifier) {
                  const absolutePath = path.resolve(path.dirname(currentSourceName), identifier.value);
                  const moduleId = path.relative(path.join(process.cwd(), moduleRoot), absolutePath).replace(/\.js$/, '');
                  if (getModuleInfo(moduleId, parser)) {
                    const exportName = identifier.defaultImport ? getDefaultExportName(moduleId, parser) : node.superClass.name;
                    const delimiter = identifier.defaultImport ? '~' : getDelimiter(moduleId, exportName, parser);
                    lines[lines.length - 2] = ' * @extends ' + `module:${moduleId.replace(slashRegEx, '/')}${exportName ? delimiter + exportName : ''}`;
                  }
                } else {
                  lines[lines.length - 2] = ' * @extends ' + node.superClass.name;
                }
              }
              leadingComment.value = lines.join('\n');
            }

          }
        }
      }
      if (node.comments) {
        node.comments.forEach(comment => {
          // Replace typeof Foo with Class<Foo>
          comment.value = comment.value.replace(/typeof ([^,\|\}\>]*)([,\|\}\>])/g, 'Class<$1>$2');

          // Convert `import("path/to/module").export` to
          // `module:path/to/module~Name`
          let importMatch;
          while ((importMatch = importRegEx.exec(comment.value))) {
            importRegEx.lastIndex = 0;
            let replacement;
            if (importMatch[1].charAt(0) !== '.') {
              // simplified replacement for external packages
              replacement = `module:${importMatch[1]}${importMatch[2] === 'default' ? '' : '~' + importMatch[2]}`;
            } else {
              const rel = path.resolve(path.dirname(currentSourceName), importMatch[1]);
              const moduleId = path.relative(path.join(process.cwd(), moduleRoot), rel).replace(/\.js$/, '');
              if (getModuleInfo(moduleId, parser)) {
                const exportName = importMatch[2] === 'default' ? getDefaultExportName(moduleId, parser) : importMatch[2];
                const delimiter = importMatch[2] === 'default' ? '~': getDelimiter(moduleId, exportName, parser);
                replacement = `module:${moduleId.replace(slashRegEx, '/')}${exportName ? delimiter + exportName : ''}`;
              }
            }
            if (replacement) {
              comment.value = comment.value.replace(importMatch[0], replacement + importMatch[3]);
            }
          }

          // Treat `@typedef`s like named exports
          const typedefMatch = comment.value.replace(/\r?\n?\s*\*\s/g, ' ').match(typedefRegEx);
          if (typedefMatch) {
            identifiers[typedefMatch[1]] = {
              value: path.basename(currentSourceName)
            };
          }

          // Replace local types with the full `module:` path
          Object.keys(identifiers).forEach(key => {
            const regex = new RegExp(`(@fires |[\{<\|,] ?!?)${key}`, 'g');
            if (regex.test(comment.value)) {
              const identifier = identifiers[key];
              const absolutePath = path.resolve(path.dirname(currentSourceName), identifier.value);
              const moduleId = path.relative(path.join(process.cwd(), moduleRoot), absolutePath).replace(/\.js$/, '');
              if (getModuleInfo(moduleId, parser)) {
                const exportName = identifier.defaultImport ? getDefaultExportName(moduleId, parser) : key;
                const delimiter = identifier.defaultImport ? '~' : getDelimiter(moduleId, exportName, parser);
                const replacement = `module:${moduleId.replace(slashRegEx, '/')}${exportName ? delimiter + exportName : ''}`;
                comment.value = comment.value.replace(regex, '$1' + replacement);
              }
            }
          });
        });
      }
    }
  }

};
