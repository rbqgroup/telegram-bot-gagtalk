import { groups, users } from '../db.js';
import { Group } from '../model/group.js';
import { MyMessageContext } from '../types/context.js';

/** Add group session to ctx and automatically build group_user index. */
export default async function GroupMiddleware(
    ctx: MyMessageContext,
    next: () => Promise<void>
) {
    try {
        ctx.group = await groups.get(ctx.chat.id);
    } catch {
        ctx.group = new Group();
    }
    ctx.group.id = ctx.chat.id;
    if (!ctx.group.usersId.includes(ctx.user.id)) {
        ctx.group.usersId.push(ctx.from.id);
    }
    if (!ctx.group.usersId.includes(ctx.targetUser.id)) {
        ctx.group.usersId.push(ctx.from.id);
    }

    await next();

    await groups.put(ctx.group.id, ctx.group);
}
