import { enqueue } from '../util/queue.js';
import { MyContext } from '../types/context.js';

export default async function UtilsMiddleware(ctx: MyContext, next: () => Promise<void>) {
    ctx.quietReply = (markdown, extra?) => {
        return enqueue(() => ctx.reply(markdown, {
            parse_mode: 'MarkdownV2',
            disable_notification: true,
            ...extra
        }));
    };
    ctx.quietQuoteReply = (markdown, extra?) => {
        return enqueue(() => ctx.quietReply(markdown, {
            reply_to_message_id: ctx.message?.message_id,
            allow_sending_without_reply: true,
            ...extra
        }));
    };
    ctx.toast = async (markdown, ms?, extra?) => {
        ms ??= 2000 + markdown.length * 125;
        const msg = await ctx.quietReply(markdown, extra);
        if (ctx.chat!.type != 'private') {
            setTimeout(() => enqueue(() => ctx.deleteMessage(msg.message_id)), ms);
        }
        return msg;
    };
    ctx.targetIsSelf = () => ctx.user?.id == ctx.targetUser?.id;
    await next();
}
