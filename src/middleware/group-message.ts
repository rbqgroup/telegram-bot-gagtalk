import config from '../config.js';
import { format, Templates } from '../locale.js';
import { enqueue } from '../util/queue.js';
import { MyMessageContext } from '../types/context.js';
import { markdownTextMention } from '../util/telegraf.js';

export default async function GroupMessageMiddleware(
    ctx: MyMessageContext,
    next: () => Promise<void>,
) {
    const gagName = ctx.user.groups[ctx.chat.id]?.gagName;
    if (gagName) {
        if ('sticker' in ctx.message) {
            warnAndDeleteUngarbledMessage();
        } else if ('text' in ctx.message) {
            if (ctx.message.via_bot?.username == ctx.me &&
                ctx.message.text.startsWith(format(Templates.viaBotPrefix, { gagName }))) {
                if (Date.now() - ctx.user.expLastEarnedTime > config.expGainCooldown) {
                    ctx.user.exp++;
                    ctx.user.expLastEarnedTime = Date.now();
                    enqueue(async () => ctx.toast(format(Templates.expGained, {
                        user: markdownTextMention(ctx.user),
                        exp: ctx.user.exp,
                    })));
                }
            } else if (ctx.message.entities?.[0]?.type == 'bot_command') {
                enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            } else {
                warnAndDeleteUngarbledMessage();
            }
        }
    }
    await next();

    function warnAndDeleteUngarbledMessage() {
        ctx.user.exp = Math.max(0, ctx.user.exp - 1);
        enqueue(() => ctx.deleteMessage(ctx.message.message_id));
        enqueue(async () => ctx.toast(format(Templates.illegalMessage, {
            user: markdownTextMention(ctx.user),
            gagName,
        })));
    }
}
