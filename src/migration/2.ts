import { Migration } from './index.js';
import { groups } from '../db.js';

const version = 2;
const semver = '2.3.2';

async function up() {
    try {
        for await (const [id, group] of groups.iterator()) {
            const set = new Set(group.usersId);
            set.delete(777000);
            group.usersId = [...set];
            await groups.put(id, group);
        }
    } catch {}
}

export default <Migration>{
    version,
    semver,
    up,
};
