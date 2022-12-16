import { Composer } from 'telegraf';
import config from '../config.js';
import { format, formatTime, Templates } from '../locale.js';
import { enqueue } from '../util/queue.js';
import { expToTimerLockCap } from '../util/timer-lock.js';
import { MyContext } from '../types/context.js';
import { shortTimeSpanToMilliseconds } from '../util/convert.js';
import { markdownTextMention } from '../util/telegraf.js';

const { command } = Composer<MyContext>;
const { gagList } = config;
const sortedGagList = [...config.gagList].sort((a, b) => a.exp - b.exp);

const commonCommands = new Composer<MyContext>();

commonCommands.use(
    command('gaglist', ctx => {
        const text = sortedGagList.reduce(
            (str, gag) => `${str}\n\`${gag.exp.toFixed().padStart(4)}\` \`${gag.name}\``,
            Templates.gagListHeader);
        enqueue(() => ctx.quietReply(text));
    }),
    command('gagpref', ctx => {
        const gagName = ctx.arguments.shift();
        if (gagName) {
            if (gagList.map(gag => gag.name).includes(gagName)) {
                const gag = gagList.find(gag => gag.name == gagName)!;
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
                enqueue(() => ctx.deleteMessage(ctx.message.message_id));
                enqueue(() => ctx.toast(format(Templates.argInvalid, {
                    index: 1,
                    value: gagName,
                })));
            }
        } else {
            enqueue(() => ctx.quietQuoteReply(format(Templates.currentGagPref, {
                gagName: ctx.user.defaultGagName,
            })));
        }
    }),
    command('timerlimit', ctx => {
        let time = ctx.castArgument(0, shortTimeSpanToMilliseconds);
        if (typeof time == 'number') {
            time = time ? Math.max(600000, time) : 0;
            ctx.user.timerLockLimit = time;
            enqueue(() => ctx.toast(Templates.succeed));
        } else {
            enqueue(() => ctx.quietQuoteReply(format(Templates.currentTimerLockLimit, {
                userTimeLimit: ctx.user.timerLockLimit
                    ? formatTime(ctx.user.timerLockLimit)
                    : 'none',
                expTimeLimit: formatTime(expToTimerLockCap(ctx.user.exp)),
            })));
        }
    }),
    command('xp', ctx => ctx.targetUser && enqueue(() =>
        ctx.quietQuoteReply(format(Templates.currentExp, {
            targetUser: markdownTextMention(ctx.targetUser),
            exp: ctx.targetUser.exp,
        }))
    )),
);

export { commonCommands };
export default commonCommands;
