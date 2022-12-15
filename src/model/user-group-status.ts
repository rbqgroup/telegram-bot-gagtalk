export class UserGroupStatus {
    gagName: string = '';
    timerLockedUntil: number = 0;
    ownerLockedBy: number = 0;
    permission: Permission = 'trusted';
}

export const Permissions = ['self', 'trusted', 'everyone'] as const;
export type Permission = typeof Permissions[number];
