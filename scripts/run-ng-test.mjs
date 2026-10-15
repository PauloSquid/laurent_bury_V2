// Lance `ng test`. Depuis Node 25, Node expose son propre localStorage, qui masque celui
// de jsdom dans les tests : on le désactive quand la version de Node le propose.
import { spawnSync } from 'node:child_process';

const major = Number(process.versions.node.split('.')[0]);
const flag = major >= 25 ? '--no-experimental-webstorage' : '';
const env = { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, flag].filter(Boolean).join(' ') };
const result = spawnSync('npx', ['ng', 'test', ...process.argv.slice(2)], { stdio: 'inherit', env, shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
