import { Level } from 'level';
import { Group } from './model/group';
import { User } from './model/user';

console.log('Opening LevelDB...');

const db = new Level('./data');
await db.open();

const users = db.sublevel<number, User>('user', { valueEncoding: 'json' });
const groups = db.sublevel<number, Group>('group', { valueEncoding: 'json' });

export { db, users, groups };
export default db;
