import { Composer } from 'telegraf';
import { message } from 'telegraf/filters';
import config from '../config.js';
import { format, formatTime, Templates } from '../locale.js';
import { ArgumentInvalidError, assertArgument, assertArgumentsAtMost, assertArgumentsCountExact } from '../middleware/arguments.js';
import { Permission, Permissions } from '../model/user-group-status.js';
import { enqueue } from '../util/queue.js';
import { getActualTimerLockLimit } from '../util/timer-lock.js';
import { MyContext, MyTextMessageContext } from '../types/context.js';
import { shortTimeSpanToMilliseconds } from '../util/convert.js';
import { enabledGroupChat, markdownEscape, markdownTextMention } from '../util/telegraf.js';
import { users } from '../db.js';
import { User } from '../model/user.js';

const { on, command } = Composer<MyContext>;

const groupCommands = new Composer<MyContext>();

groupCommands.use(enabledGroupChat(
    command('start', ctx => enqueue(() => ctx.deleteMessage(ctx.message.message_id))),
    command(['privacy', 'gaghelp'], ctx => {
        const command = ctx.message.text
            .slice(1, ctx.message.entities![0]!.length + 1)
            .split('@')[0];
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        enqueue(() => ctx.toast(format(Templates.seePM, {
            command: markdownEscape(command),
        })));
    }),
    command('help', ctx => {
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        enqueue(() => ctx.toast(Templates.shortHelp));
    }),
    command('gag', assertArgumentsAtMost(1), permissionCheck, ctx => {
        const gagName = ctx.arguments[0] || ctx.targetUser.defaultGagName;
        const gag = config.gagList.find(gag => gag.name == gagName);
        const status = ctx.targetUser.groups[ctx.chat.id];
        if (!status.gagName) {
            if (gag) {
                if (gag.exp <= ctx.targetUser.exp) {
                    status.gagName = gagName;
                    enqueue(() => ctx.quietReply(format(
                        ctx.targetIsSelf() ? Templates.selfGagged : Templates.gagged,
                        {
                            user: markdownTextMention(ctx.user),
                            targetUser: markdownTextMention(ctx.targetUser),
                            gagName,
                        }
                    )));
                } else {
                    enqueue(() => ctx.toast(format(Templates.expNotEnough, {
                        targetUser: markdownTextMention(ctx.targetUser),
                        gagName,
                        required: gag.exp,
                        actual: ctx.targetUser.exp,
                    })));
                }
            } else {
                throw new ArgumentInvalidError(0, gagName);
            }
        } else {
            enqueue(() => ctx.toast(format(Templates.alreadyGagged, {
                targetUser: markdownTextMention(ctx.targetUser),
                gagName: status.gagName,
            })));
        }
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
    }),
    command('ungag', assertArgumentsCountExact(0), permissionCheck, async ctx => {
        const { gagName, timerLockedUntil, ownerLockedBy } = ctx.targetUser.groups[ctx.chat.id];
        if (gagName) {
            if (timerLockedUntil > Date.now()) {
                enqueue(() => ctx.toast(format(Templates.ungagPreventedByTimerLock, {
                    targetUser: markdownTextMention(ctx.targetUser),
                    time: formatTime(timerLockedUntil - Date.now()),
                })));
            } else {
                if (ownerLockedBy) {
                    const ownerUser = await users.get(ownerLockedBy);
                    enqueue(() => ctx.toast(format(Templates.ungagPreventedByOwnerLock, {
                        targetUser: markdownTextMention(ctx.targetUser),
                        ownerUser: markdownTextMention(ownerUser),
                    })));
                } else {
                    ctx.targetUser.groups[ctx.chat.id].gagName = '';
                    enqueue(() => ctx.quietReply(format(
                        ctx.targetIsSelf() ? Templates.selfUngagged : Templates.ungagged,
                        {
                            user: markdownTextMention(ctx.user),
                            targetUser: markdownTextMention(ctx.targetUser),
                        }
                    )));
                }
            }
        } else {
            enqueue(() => ctx.toast(format(Templates.notGagged, {
                targetUser: markdownTextMention(ctx.targetUser),
            })));
        }
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
    }),
    command('timeradd', assertArgumentsAtMost(1), permissionCheck, ctx => {
        const time = ctx.castArgument(0, shortTimeSpanToMilliseconds) ?? 600000;
        const status = ctx.targetUser.groups[ctx.chat.id];
        if (status.gagName) {
            // No more than limit
            status.timerLockedUntil = Math.min(
                // This way we don't need to deal with expiry
                Math.max(status.timerLockedUntil, Date.now()) + time,
                // No less than current lock time
                Math.max(
                    status.timerLockedUntil,
                    Date.now() + getActualTimerLockLimit(ctx.targetUser),
                ),
            );
            const remainingTime = status.timerLockedUntil - Date.now();
            enqueue(() => ctx.quietReply(format(
                ctx.targetIsSelf() ? Templates.selfTimerLockAdded : Templates.timerLockAdded,
                {
                    user: markdownTextMention(ctx.user),
                    targetUser: markdownTextMention(ctx.targetUser),
                    time: formatTime(time),
                    remainingTime: formatTime(remainingTime),
                }
            )));
        } else {
            enqueue(() => ctx.toast(format(Templates.notGagged, {
                targetUser: markdownTextMention(ctx.targetUser),
            })));
        }
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
    }),
    command('timerremaining', assertArgumentsCountExact(0), ctx => {
        const time = ctx.targetUser.groups[ctx.chat.id].timerLockedUntil;
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        enqueue(() => ctx.quietReply(format(
            time > Date.now() ? Templates.timerLockRemainingTime : Templates.timerLockExpired,
            {
                targetUser: markdownTextMention(ctx.targetUser),
                time: formatTime(time - Date.now()),
            }
        )));
    }),
    command('lock', assertArgumentsCountExact(0), permissionCheck, async ctx => {
        const status = ctx.targetUser.groups[ctx.chat.id];
        if (status.ownerLockedBy) {
            const ownerUser = await users.get(status.ownerLockedBy);
            enqueue(() => ctx.toast(format(Templates.alreadyOwnerLocked, {
                targetUser: markdownTextMention(ctx.targetUser),
                ownerUser: markdownTextMention(ownerUser),
            })));
        } else {
            if (ctx.targetUser.trustedUsersId.includes(ctx.user.id) || ctx.targetIsSelf()) {
                if (status.gagName) {
                    status.ownerLockedBy = ctx.user.id;
                    enqueue(() => ctx.quietReply(format(Templates.ownerLocked, {
                        user: markdownTextMention(ctx.user),
                        targetUser: markdownTextMention(ctx.targetUser),
                    })));
                } else {
                    enqueue(() => ctx.toast(format(Templates.notGagged, {
                        targetUser: markdownTextMention(ctx.targetUser),
                    })));
                }
            } else {
                enqueue(() => ctx.toast(format(Templates.notTrusted, {
                    user: markdownTextMention(ctx.user),
                    targetUser: markdownTextMention(ctx.targetUser),
                })));
            }
        }
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
    }),
    command('unlock', assertArgumentsCountExact(0), permissionCheck, async ctx => {
        const status = ctx.targetUser.groups[ctx.chat.id];
        if (status.ownerLockedBy) {
            const ownerUser = await users.get(status.ownerLockedBy);
            if (ctx.user.id == ownerUser.id) {
                status.ownerLockedBy = 0;
                enqueue(() => ctx.quietReply(format(Templates.ownerLockRemoved, {
                    user: markdownTextMention(ctx.user),
                    targetUser: markdownTextMention(ctx.targetUser),
                })));
            } else {
                enqueue(() => ctx.toast(format(Templates.ownerLockRemoveFailed, {
                    ownerUser: markdownTextMention(ownerUser),
                })));
            }
        } else {
            enqueue(() => ctx.toast(format(Templates.notOwnerLocked, {
                targetUser: markdownTextMention(ctx.targetUser),
            })));
        }
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
    }),
    command('permission',
        assertArgumentsAtMost(1),
        assertArgument(0, arg => !arg || Permissions.includes(arg as Permission)),
        ctx => {
            const permission = ctx.arguments.shift() as Permission | undefined;
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            if (permission) {
                if (!ctx.targetIsSelf()) {
                    enqueue(() => ctx.deleteMessage(ctx.message.message_id));
                    enqueue(() => ctx.toast(Templates.forbidChangeOtherUsersSettings));
                    return;
                }
                ctx.user.groups[ctx.chat.id].permission = permission;
                enqueue(() => ctx.quietReply(format({
                    self: Templates.setPermissionSelf,
                    trusted: Templates.setPermissionTrusted,
                    everyone: Templates.setPermissionEveryone,
                }[permission], {
                    user: markdownTextMention(ctx.user),
                })));
            } else {
                enqueue(() => ctx.quietReply(format(Templates.currentPermission, {
                    targetUser: markdownTextMention(ctx.targetUser),
                    permission: ctx.targetUser.groups[ctx.chat.id].permission,
                })));
            }
        },
    ),
    command('ranking', assertArgumentsCountExact(0), async ctx => {
        const usersInGroup = ((await Promise.all(ctx.group!.usersId
            .map(async id => {
                try {
                    return await users.get(id);
                } catch {
                    return;
                }
            })))
            .filter(user => user && user.exp) as User[])
            .sort((a, b) => b.exp - a.exp).slice(0, 20);
        const text = usersInGroup.reduce((str, user) => `${str}
\`${user.exp.toFixed().padStart(5)}\`  \
${markdownEscape(user.lastName ? user.lastName + ' ' : '')}\
${markdownEscape(user.firstName)}`,
            Templates.expRankingHeader);
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        enqueue(() => ctx.quietReply(text));
    }),
    on(message('text', 'reply_to_message'),
        command('trust', assertArgumentsCountExact(0), ctx => {
            if (!ctx.user.trustedUsersId.includes(ctx.targetUser.id) && !ctx.targetIsSelf()) {
                ctx.user.trustedUsersId.push(ctx.targetUser.id);
                enqueue(() => ctx.quietReply(format(Templates.trusted, {
                    user: markdownTextMention(ctx.user),
                    targetUser: markdownTextMention(ctx.targetUser),
                })));
            }
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        }),
        command('distrust', assertArgumentsCountExact(0), ctx => {
            const index = ctx.user.trustedUsersId.indexOf(ctx.targetUser.id);
            if (index >= 0) {
                ctx.user.trustedUsersId.splice(index, 1);
                enqueue(() => ctx.quietReply(format(Templates.distrusted, {
                    user: markdownTextMention(ctx.user),
                    targetUser: markdownTextMention(ctx.targetUser),
                })));
            }
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        }),
    ),
));

async function permissionCheck(ctx: MyTextMessageContext, next: () => Promise<void>) {
    let allowed = false;
    switch (ctx.targetUser.groups[ctx.chat.id].permission) {
        case 'everyone':
            allowed = true;
            break;
        case 'trusted':
            allowed = ctx.targetUser.trustedUsersId.includes(ctx.user.id)
                || ctx.targetIsSelf();
            break;
        case 'self':
            allowed = ctx.targetIsSelf();
            break;
    }
    if (allowed) {
        await next();
    } else {
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        enqueue(() => ctx.toast(format(Templates.noPermission, {
            targetUser: markdownTextMention(ctx.targetUser),
        })));
    }
}

export { groupCommands };
export default groupCommands;
