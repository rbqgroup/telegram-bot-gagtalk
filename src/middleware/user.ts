import { Update } from 'typegram';
import { users } from '../db.js';
import { UserGroupStatus } from '../model/user-group-status.js';
import { User } from '../model/user.js';
import { MyContext, MyMessageContext } from '../types/context.js';

/** Add user session to ctx and update user info after a succeed request. */
export default async function UserMiddleware(
    ctx: MyMessageContext | MyContext<Update.InlineQueryUpdate>,
    next: () => Promise<void>,
) {
    try {
        ctx.user = await users.get(ctx.from.id);
    } catch {
        ctx.user = new User();
    }
    ctx.user.id = ctx.from.id;
    ctx.user.firstName = ctx.from.first_name;
    ctx.user.lastName = ctx.from.last_name;
    ctx.user.username = ctx.from.username;
    if (ctx.chat?.type == 'group' || ctx.chat?.type == 'supergroup') {
        ctx.user.groups[ctx.chat.id] ??= new UserGroupStatus();
    }

    await next();

    if (ctx.user) {
        await users.put(ctx.user.id, ctx.user);
    }
}
