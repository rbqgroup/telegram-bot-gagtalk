import { users } from '../db.js';
import { User } from '../model/user.js';
import { MyMessageContext } from '../types/context.js';

export default async function TargetUserMiddleware(
    ctx: MyMessageContext,
    next: () => Promise<void>,
) {
    if ('reply_to_message' in ctx.message &&
        ctx.message.reply_to_message &&
        'from' in ctx.message.reply_to_message &&
        ctx.message.reply_to_message.from &&
        !ctx.message.reply_to_message.from.is_bot
    ) {
        const { id, username, first_name, last_name } = ctx.message.reply_to_message.from;
        if (id && id != ctx.user.id) {
            try {
                ctx.targetUser = await users.get(id);
            } catch {
                ctx.targetUser = new User();
            }
            ctx.targetUser.id = id;
            ctx.targetUser.firstName = first_name;
            ctx.targetUser.lastName = last_name;
            ctx.targetUser.username = username;
        }
    }
    ctx.targetUser ??= ctx.user;

    await next();

    if (ctx.targetUser && ctx.targetUser != ctx.user) {
        await users.put(ctx.targetUser.id, ctx.targetUser);
    }
}
