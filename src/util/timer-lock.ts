import User from '../model/user.js';

export const expToTimerLockCap = (exp: number) =>
    10 * 60 * 1000 + 168 * 60 * 60 * 1000 * (exp / (exp + 7200));

export const getActualTimerLockLimit = (user: User) => Math.min(
    user.timerLockLimit || Number.MAX_SAFE_INTEGER,
    expToTimerLockCap(user.exp),
);

export const isTimerLocked = (user: User, group: number) =>
    user.groups[group].timerLockedUntil > Date.now();
