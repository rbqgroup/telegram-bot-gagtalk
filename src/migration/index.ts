import db from '../db.js';
import migration_1 from './1.js';
import migration_2 from './2.js';

export const migrations: Migration[] = [
    migration_1,
    migration_2,
].sort((a, b) => a.version - b.version);

export async function migrate() {
    let version: number;
    try {
        version = parseFloat(await db.get('version'));
    } catch {
        version = migrations[migrations.length - 1].version;
        await db.put('version', version.toString());
    }
    console.log('Current database version: ' + version);
    for (const migration of migrations) {
        if (migration.version > version) {
            console.log('Migrating database to version ' + migration.version + '...');
            // Should crash if error has occured
            await migration.up();
            version = migration.version;
            await db.put('version', migration.version.toString());
        }
    }
}

export type Migration = {
    version: number;
    semver: string;
    up: () => Promise<void>;
    down?: () => Promise<void>;
}
