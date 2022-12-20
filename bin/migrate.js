#!/usr/bin/env node

import { migrations } from '../build/migration/index.js';

const args = process.argv.slice(2);
const operation = args.shift();
const version = args.shift();
const migration = migrations.find(m => m.version == version);

if (['up', 'down'].includes(operation) && migration) {
    await migration[operation]?.();
} else {
    console.log(`
Usage:
  node bin/migrate.js up|down <migrationVersion>
`);
}
