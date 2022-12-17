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

const { on, command } = Composer<MyContext>;
const { gagList } = config;

const groupCommands = new Composer<MyContext>();

groupCommands.use(enabledGroupChat(
    command('gag', assertArgumentsAtMost(1), permissionCheck, ctx => {
        const gagName = ctx.arguments[0] || ctx.targetUser.defaultGagName;
        const gag = gagList.find(gag => gag.name == gagName);
        const status = ctx.targetUser.groups[ctx.chat.id];
        if (!status.gagName) {
            if (gag) {
                if (gag.exp <= ctx.user.exp) {
                    status.gagName = gagName;
                    enqueue(() => ctx.quietReply(format(
                        ctx.user == ctx.targetUser ? Templates.selfGagged : Templates.gagged,
                        {
                            user: markdownTextMention(ctx.user),
                            targetUser: markdownTextMention(ctx.targetUser),
                            gagName,
                        }
                    )));
                } else {
                    enqueue(() => ctx.deleteMessage(ctx.message.message_id));
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
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            enqueue(() => ctx.toast(format(Templates.alreadyGagged, {
                targetUser: markdownTextMention(ctx.targetUser),
                gagName: status.gagName,
            })));
        }
    }),
    command('ungag', assertArgumentsCountExact(0), permissionCheck, ctx => {
        const { gagName, timerLockedUntil } = ctx.targetUser.groups[ctx.chat.id];
        if (timerLockedUntil > Date.now()) {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            enqueue(() => ctx.toast(format(Templates.ungagPreventedByLock, {
                targetUser: markdownTextMention(ctx.targetUser),
                time: formatTime(timerLockedUntil - Date.now()),
            })));
        } else {
            if (gagName) {
                ctx.targetUser.groups[ctx.chat.id].gagName = '';
                enqueue(() => ctx.quietReply(format(
                    ctx.user == ctx.targetUser ? Templates.selfUngagged : Templates.ungagged,
                    {
                        user: markdownTextMention(ctx.user),
                        targetUser: markdownTextMention(ctx.targetUser),
                    }
                )));
            } else {
                enqueue(() => ctx.deleteMessage(ctx.message.message_id));
                enqueue(() => ctx.toast(format(Templates.notGagged, {
                    targetUser: markdownTextMention(ctx.targetUser),
                })));
            }
        }
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
                ctx.user == ctx.targetUser
                    ? Templates.selfTimerLockAdded
                    : Templates.timerLockAdded,
                {
                    user: markdownTextMention(ctx.user),
                    targetUser: markdownTextMention(ctx.targetUser),
                    time: formatTime(time),
                    remainingTime: formatTime(remainingTime),
                }
            )));
        } else {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            enqueue(() => ctx.toast(format(Templates.timerLockAddFailed, {
                targetUser: markdownTextMention(ctx.targetUser),
            })));
        }
    }),
    command('timerremaining', assertArgumentsCountExact(0), ctx => {
        const time = ctx.targetUser.groups[ctx.chat.id].timerLockedUntil;
        enqueue(() => ctx.quietReply(format(
            time > Date.now() ? Templates.timerLockRemainingTime : Templates.timerLockExpired,
            {
                targetUser: markdownTextMention(ctx.targetUser),
                time: formatTime(time - Date.now()),
            }
        )));
    }),
    command('permission',
        assertArgumentsAtMost(1),
        assertArgument(0, arg => !arg || Permissions.includes(arg as Permission)),
        ctx => {
            const permission = ctx.arguments.shift() as Permission | undefined;
            if (permission) {
                ctx.user.groups[ctx.chat.id].permission = permission;
                enqueue(() => ctx.toast(Templates.succeed));
            } else {
                enqueue(() => ctx.quietQuoteReply(format(Templates.currentPermission, {
                    permission: ctx.user.groups[ctx.chat.id].permission,
                })));
            }
        },
    ),
    command('ranking', assertArgumentsCountExact(0), async ctx => {
        const usersInGroup = (await Promise.all(ctx.group!.usersId.map(id => users.get(id))))
            .filter(user => user && user.exp).sort((a, b) => b.exp - a.exp).slice(0, 20);
        const text = usersInGroup.reduce((str, user) => `${str}
\`${user.exp.toFixed().padStart(5)}\`  \
${markdownEscape(user.lastName ? user.lastName + ' ' : '')}\
${markdownEscape(user.firstName)}`,
            Templates.expRankingHeader);
        enqueue(() => ctx.quietReply(text));
    }),
    on(message('text', 'reply_to_message'),
        command('trust', assertArgumentsCountExact(0), ctx => {
            if (!ctx.user.trustedUsersId.includes(ctx.targetUser.id) &&
                ctx.targetUser != ctx.user) {
                ctx.user.trustedUsersId.push(ctx.targetUser.id);
            }
            enqueue(() => ctx.toast(Templates.succeed));
        }),
        command('distrust', assertArgumentsCountExact(0), ctx => {
            const index = ctx.user.trustedUsersId.indexOf(ctx.targetUser.id);
            if (index >= 0) {
                ctx.user.trustedUsersId.splice(index, 1);
            }
            enqueue(() => ctx.toast(Templates.succeed));
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
                || ctx.targetUser.id == ctx.user.id;
            break;
        case 'self':
            allowed = ctx.targetUser.id == ctx.user.id;
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
