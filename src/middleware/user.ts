import { Update } from 'typegram';
import { users } from '../db.js';
import { UserGroupStatus } from '../model/user-group-status.js';
import { User } from '../model/user.js';
import { MyContext, MyMessageContext } from '../types/context.js';
import { getTelegramUserInfo } from '../util/telegraf.js';

/** Add user session to ctx and update user info after a succeed request. */
export default async function UserMiddleware(
    ctx: MyMessageContext | MyContext<Update.InlineQueryUpdate>,
    next: () => Promise<void>,
) {
    const userInfo = getTelegramUserInfo(
        ctx.inlineQuery?.from
        ?? (ctx.senderChat?.type == 'channel' ? ctx.senderChat : ctx.from)
    );
    try {
        ctx.user = await users.get(userInfo.id);
    } catch {
        ctx.user = new User();
    }
    Object.assign(ctx.user, userInfo);
    if (ctx.chat?.type == 'group' || ctx.chat?.type == 'supergroup') {
        ctx.user.groups[ctx.chat.id] ??= new UserGroupStatus();
    }

    await next();

    if (ctx.user && ctx.user.id != 777000) {
        await users.put(ctx.user.id, ctx.user);
    }
}
