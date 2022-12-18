import { Composer } from 'telegraf';
import config from '../config.js';
import { format, formatTime, Templates } from '../locale.js';
import { enqueue } from '../util/queue.js';
import { expToTimerLockCap } from '../util/timer-lock.js';
import { MyContext } from '../types/context.js';
import { shortTimeSpanToMilliseconds } from '../util/convert.js';
import { markdownTextMention } from '../util/telegraf.js';
import { ArgumentInvalidError, assertArgumentsAtMost, assertArgumentsCountExact } from '../middleware/arguments.js';

const { command } = Composer<MyContext>;

const commonCommands = new Composer<MyContext>();

commonCommands.use(
    command('gaglist', assertArgumentsCountExact(0), ctx => {
        const sortedGagList = [...config.gagList].sort((a, b) => a.exp - b.exp);
        const text = sortedGagList.reduce(
            (str, gag) => `${str}\n\`${gag.exp.toFixed().padStart(4)}\` \`${gag.name}\``,
            Templates.gagListHeader);
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        enqueue(() => ctx.quietReply(text));
    }),
    command('gagpref', assertArgumentsAtMost(1), ctx => {
        const gagName = ctx.arguments.shift();
        if (gagName) {
            if (!ctx.targetIsSelf()) {
                enqueue(() => ctx.deleteMessage(ctx.message.message_id));
                enqueue(() => ctx.toast(Templates.forbidChangeOtherUsersSettings));
                return;
            }
            if (config.gagList.map(gag => gag.name).includes(gagName)) {
                const gag = config.gagList.find(gag => gag.name == gagName)!;
                if (gag.exp <= ctx.user.exp) {
                    ctx.user.defaultGagName = gagName;
                    enqueue(() => ctx.toast(Templates.succeed));
                } else {
                    enqueue(() => ctx.deleteMessage(ctx.message.message_id));
                    enqueue(() => ctx.toast(format(Templates.expNotEnough, {
                        targetUser: markdownTextMention(ctx.user),
                        gagName,
                        required: gag.exp,
                        actual: ctx.user.exp,
                    })));
                }
            } else {
                throw new ArgumentInvalidError(0, gagName);
            }
        } else {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            enqueue(() => ctx.quietReply(format(Templates.currentGagPref, {
                targetUser: markdownTextMention(ctx.targetUser),
                gagName: ctx.targetUser.defaultGagName,
            })));
        }
    }),
    command('timerlimit', assertArgumentsAtMost(1), ctx => {
        let time = ctx.castArgument(0, shortTimeSpanToMilliseconds);
        if (typeof time == 'number') {
            if (!ctx.targetIsSelf()) {
                enqueue(() => ctx.deleteMessage(ctx.message.message_id));
                enqueue(() => ctx.toast(Templates.forbidChangeOtherUsersSettings));
                return;
            }
            time = time ? Math.max(600000, time) : 0;
            ctx.user.timerLockLimit = time;
            enqueue(() => ctx.toast(Templates.succeed));
        } else {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            enqueue(() => ctx.quietReply(format(Templates.currentTimerLockLimit, {
                targetUser: markdownTextMention(ctx.targetUser),
                userTimeLimit: ctx.targetUser.timerLockLimit
                    ? formatTime(ctx.targetUser.timerLockLimit)
                    : 'none',
                expTimeLimit: formatTime(expToTimerLockCap(ctx.targetUser.exp)),
            })));
        }
    }),
    command('xp', assertArgumentsCountExact(0), ctx => ctx.targetUser && (
        enqueue(() => ctx.deleteMessage(ctx.message.message_id)),
        enqueue(() => ctx.quietReply(format(Templates.currentExp, {
            targetUser: markdownTextMention(ctx.targetUser),
            exp: ctx.targetUser.exp,
        })))
    )),
);

export { commonCommands };
export default commonCommands;
