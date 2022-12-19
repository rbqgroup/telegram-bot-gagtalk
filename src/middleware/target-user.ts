import { Chat } from 'typegram';
import { users } from '../db.js';
import { User } from '../model/user.js';
import { MyMessageContext } from '../types/context.js';
import { getTelegramUserInfo } from '../util/telegraf.js';

/** Same as UserMiddleware, but for message reply target users. */
export default async function TargetUserMiddleware(
    ctx: MyMessageContext,
    next: () => Promise<void>,
) {
    if ('reply_to_message' in ctx.message &&
        ctx.message.reply_to_message &&
        'from' in ctx.message.reply_to_message && (
            ctx.message.reply_to_message.from?.is_bot === false ||
            ctx.message.reply_to_message.sender_chat?.type == 'channel'
        )
    ) {
        const userInfo = getTelegramUserInfo(
            ctx.message.reply_to_message.sender_chat as Chat.ChannelChat | undefined
            ?? ctx.message.reply_to_message.from!
        );
        if (userInfo.id && userInfo.id != ctx.user.id) {
            try {
                ctx.targetUser = await users.get(userInfo.id);
            } catch {
                ctx.targetUser = new User();
            }
            Object.assign(ctx.targetUser, userInfo);
        }
    }
    ctx.targetUser ??= ctx.user;

    await next();

    if (ctx.targetUser && ctx.targetUser != ctx.user) {
        await users.put(ctx.targetUser.id, ctx.targetUser);
    }
}
