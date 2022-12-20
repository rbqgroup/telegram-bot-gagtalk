import config from '../config.js';
import { UserGroupStatus } from './user-group-status.js';

export class User {

    /** Positive for normal users, negative if the user is a channel. */
    id!: number;
    firstName!: string;
    lastName?: string;
    username?: string;

    createdTime: number = Date.now();

    defaultGagName: string = config.gagList.find(gag => !gag.exp)?.name ?? '';

    exp: number = 0;
    expLastEarnedTime: number = 0;

    groups: { [chatId: string]: UserGroupStatus } = {};

    trustedUsersId: number[] = [];

    timerLockLimit: number = 0;
}

export default User;
