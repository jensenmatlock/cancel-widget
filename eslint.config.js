import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintrc = JSON.parse(
  fs.readFileSync(path.join(__dirname, '.eslintrc.json'), 'utf8')
);

export default [...compat.config(eslintrc)];
