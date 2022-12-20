import db from '../db.js';
import migration_1 from './1.js';

export const migrations: Migration[] = [
    migration_1,
].sort((a, b) => a.version - b.version);

export async function migrate() {
    let version: number;
    try {
        version = parseFloat(await db.get('version'));
    } catch {
        version = 0;
    }
    for (const migration of migrations) {
        if (migration.version > version) {
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
