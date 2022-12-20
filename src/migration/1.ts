import { Migration } from './index.js';
import { users } from '../db.js';

const version = 1;
const semver = '2.3.1';

async function up() {
    try {
        await users.del(777000);
    } catch {}
}

export default <Migration>{
    version,
    semver,
    up,
};
