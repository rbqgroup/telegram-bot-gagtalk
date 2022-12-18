import { Composer } from 'telegraf';
import { message } from 'telegraf/filters';
import config from '../config.js';
import { groups, users } from '../db.js';
import { format, Templates } from '../locale.js';
import { enqueue } from '../util/queue.js';
import { MyContext } from '../types/context.js';
import { toInt } from '../util/convert.js';
import { markdownTextMention, subcommand } from '../util/telegraf.js';

const { on, command, groupChat, acl } = Composer<MyContext>;

const adminCommands = new Composer<MyContext>();

adminCommands.use(acl(config.admins,
    command('admin',
        subcommand('group', groupChat(
            subcommand('reset', async ctx => {
                await groups.del(ctx.group!.id);
                ctx.group = undefined;
                enqueue(() => ctx.toast(Templates.succeed));
            }),
            subcommand('data', ctx => {
                enqueue(() => ctx.reply(JSON.stringify(ctx.group, null, 4)));
            }),
            subcommand('start', ctx => {
                ctx.group!.botEnabled = true;
                enqueue(() => ctx.toast(Templates.succeed));
            }),
            subcommand('stop', ctx => {
                ctx.group!.botEnabled = false;
                enqueue(() => ctx.toast(Templates.succeed));
            }),
        )),
        subcommand('user', on(message('text', 'reply_to_message'),
            // ⚠️ 警告：回复 bot 或系统消息会重置自己
            subcommand('reset', async ctx => {
                if (ctx.targetUser) {
                    await users.del(ctx.targetUser.id);
                    ctx.targetUser = undefined!;
                    enqueue(() => ctx.toast(Templates.succeed));
                }
            }),
            subcommand('data', ctx => {
                enqueue(() => ctx.reply(JSON.stringify(ctx.targetUser, null, 4)));
            }),
            subcommand('xp', ctx => {
                const exp = ctx.castArgument(0, toInt);
                ctx.targetUser.exp = exp;
                enqueue(() => ctx.toast(Templates.succeed));
            }),
            subcommand('unlock', ctx => {
                const status = ctx.targetUser.groups[ctx.chat.id];
                if (status && status.timerLockedUntil > Date.now()) {
                    const deductedExp = Math.min(
                        ctx.targetUser.exp,
                        Math.ceil((status.timerLockedUntil - Date.now()) / 600000),
                    );
                    ctx.targetUser.exp -= deductedExp;
                    status.timerLockedUntil = 0;
                    status.permission = 'self';
                    enqueue(() => ctx.quietReply(format(Templates.adminUnlockedUser, {
                        targetUser: markdownTextMention(ctx.targetUser),
                        deductedExp,
                    })));
                }
            }),
        )),
    ),
));

export { adminCommands };
export default adminCommands;
