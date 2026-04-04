import fs from 'fs';
import { spawn } from 'child_process';

const env = fs.readFileSync('.dev.vars', 'utf-8');
const key = env.match(/GEMINI_API_KEY=\"(.*)\"/)[1];
const code = fs.readFileSync('test-api-key.mjs', 'utf-8').replace('YOUR_API_KEY_HERE', key);
fs.writeFileSync('test-api-key-run.mjs', code);
