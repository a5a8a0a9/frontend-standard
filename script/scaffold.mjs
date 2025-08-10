import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function log(msg) { console.log(`[scaffold] ${msg}`); }

function cp(src, dest) { fs.cpSync(src, dest, { recursive: true, force: true }); }

function upsert(file, content) {
  const p = path.join(root, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
function writeJSON(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n'); }

try {
  log('Create temp workspace...');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'young-ng-'));
  const appName = 'generated';

  log('Scaffold Angular 20 (strict)...');
  execSync(`npm create @angular@20 ${appName} -- --strict --skip-git --standalone --style=scss`, { cwd: tmp, stdio: 'inherit' });

  const srcDir = path.join(tmp, appName);
  log('Copy Angular files into repository root...');
  cp(srcDir + path.sep, root);

  // Patch package.json: add scripts & dev deps
  const pkgPath = path.join(root, 'package.json');
  const pkg = readJSON(pkgPath);
  pkg.scripts = {
    ...(pkg.scripts ?? {}),
    "start": pkg.scripts?.start ?? "ng serve",
    "build": pkg.scripts?.build ?? "ng build",
    "test": pkg.scripts?.test ?? "ng test",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  };
  pkg.devDependencies = {
    ...(pkg.devDependencies ?? {}),
    "prettier": pkg.devDependencies?.prettier ?? "^3.3.0",
    "eslint": pkg.devDependencies?.eslint ?? "^9.0.0",
    "@typescript-eslint/parser": pkg.devDependencies?.["@typescript-eslint/parser"] ?? "^7.0.0",
    "@typescript-eslint/eslint-plugin": pkg.devDependencies?.["@typescript-eslint/eslint-plugin"] ?? "^7.0.0",
    "@angular-eslint/eslint-plugin": pkg.devDependencies?.["@angular-eslint/eslint-plugin"] ?? "^20.0.0",
    "@angular-eslint/eslint-plugin-template": pkg.devDependencies?.["@angular-eslint/eslint-plugin-template"] ?? "^20.0.0",
    "@angular-eslint/template-parser": pkg.devDependencies?.["@angular-eslint/template-parser"] ?? "^20.0.0",
    "eslint-plugin-import": pkg.devDependencies?.["eslint-plugin-import"] ?? "^2.29.0",
    "eslint-config-prettier": pkg.devDependencies?.["eslint-config-prettier"] ?? "^9.1.0"
  };
  writeJSON(pkgPath, pkg);

  // Ensure strict in tsconfig
  const tsconfigPath = path.join(root, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const ts = readJSON(tsconfigPath);
    ts.compilerOptions = ts.compilerOptions || {};
    ts.compilerOptions.strict = true;
    ts.angularCompilerOptions = { ...(ts.angularCompilerOptions || {}), strictTemplates: true };
    writeJSON(tsconfigPath, ts);
  }

  // Inject young-ng configs (overwrite)
  log('Apply .editorconfig / .prettierrc / ESLint / VSCode settings...');
  upsert('.editorconfig', `# Editor configuration, see https://editorconfig.org\nroot = true\n\n[*]\ncharset = utf-8\nindent_style = tab\nindent_size = 2\ninsert_final_newline = true\ntrim_trailing_whitespace = true\n\n[*.ts]\nquote_type = single\nij_typescript_use_double_quotes = false\n\n[*.md]\nmax_line_length = off\ntrim_trailing_whitespace = false\n`);
  upsert('.prettierrc', JSON.stringify({
    tabWidth: 2,
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 140,
    arrowParens: 'avoid',
    overrides: [{ files: ['*.html'], options: { trailingComma: 'none' } }]
  }, null, 2) + '\n');
  upsert('.eslintrc.cjs', `module.exports = {\n  root: true,\n  env: { es2022: true, browser: true, node: true },\n  parser: '@typescript-eslint/parser',\n  parserOptions: { project: ['./tsconfig.eslint.json'], tsconfigRootDir: __dirname },\n  plugins: ['@typescript-eslint', '@angular-eslint', 'import'],\n  extends: [\n    'eslint:recommended',\n    'plugin:@typescript-eslint/recommended',\n    'plugin:@angular-eslint/recommended',\n    'plugin:@angular-eslint/template/process-inline-templates',\n    'plugin:import/recommended',\n    'plugin:import/typescript',\n    'prettier'\n  ],\n  rules: {\n    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],\n    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],\n    'prefer-const': 'warn',\n    'eqeqeq': ['error', 'smart'],\n    'import/order': ['warn', { groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']], 'newlines-between': 'always', alphabetize: { order: 'asc', caseInsensitive: true } }],\n    '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component'] }],\n    '@angular-eslint/directive-class-suffix': ['error', { suffixes: ['Directive'] }]\n  },\n  overrides: [{ files: ['*.html'], parser: '@angular-eslint/template-parser', extends: ['plugin:@angular-eslint/template/recommended'], rules: {} }]\n};\n`);
  upsert('tsconfig.eslint.json', JSON.stringify({ extends: './tsconfig.json', compilerOptions: { noEmit: true }, include: ['**/*.ts', '**/*.html'] }, null, 2) + '\n');
  upsert('.vscode/settings.json', `{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "always",
    "source.sortImports": "always"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode", "editor.tabSize": 2 },
  "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode", "editor.tabSize": 2 },
  "[scss]": { "editor.defaultFormatter": "esbenp.prettier-vscode", "editor.tabSize": 2 },
  "[html]": { "editor.defaultFormatter": "esbenp.prettier-vscode", "editor.tabSize": 2 },
  "[css]": { "editor.defaultFormatter": "esbenp.prettier-vscode", "editor.tabSize": 2 },
  "[jsonc]": { "editor.defaultFormatter": "esbenp.prettier-vscode", "editor.tabSize": 2 },
  "[markdown]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
}
`);
  upsert('.vscode/extensions.json', JSON.stringify({ recommendations: [
    'segerdekort.angular-cli', 'angular.ng-template', 'nrwl.angular-console', 'ghaschel.vscode-angular-html',
    'editorconfig.editorconfig', 'esbenp.prettier-vscode', 'rvest.vs-code-prettier-eslint', 'formulahendry.auto-close-tag',
    'yoavbls.pretty-ts-errors', 'streetsidesoftware.code-spell-checker', 'zignd.html-css-class-completion', 'gruntfuggly.todo-tree',
    'oouo-diogo-perdigao.docthis', 'eamodio.gitlens', 'lihui.vs-color-picker', 'kevinyang.ctlorem', 'adpyke.codesnap', 'vscode-icons-team.vscode-icons'
  ] }, null, 2) + '\n');

  log('Install dev dependencies (eslint / prettier / angular-eslint)...');
  execSync('npm i -D prettier@^3.3 eslint@^9 @typescript-eslint/parser@^7 @typescript-eslint/eslint-plugin@^7 @angular-eslint/eslint-plugin@^20 @angular-eslint/eslint-plugin-template@^20 @angular-eslint/template-parser@^20 eslint-plugin-import@^2.29 eslint-config-prettier@^9.1', { cwd: root, stdio: 'inherit' });

  log('All done! Try:');
  console.log('\n  npm start\n  npm run lint\n  npm run format\n');
} catch (err) {
  console.error('[scaffold] Failed:', err);
  process.exit(1);
}
