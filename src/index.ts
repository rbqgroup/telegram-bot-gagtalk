import { Composer, Telegraf, TelegramError } from 'telegraf';
import { message } from 'telegraf/filters';
import { Update } from 'typegram';
import { MyContext } from './types/context.js';
import config from './config.js';
import db from './db.js';
import { migrate } from './migration';
import queue, { enqueue } from './util/queue.js';
import { onInlineQuery } from './inline-query.js';
import { Templates } from './locale.js';
import { enabledGroupChat } from './util/telegraf.js';
import ErrorHandlerMiddleware from './middleware/error-handler.js';
import UtilsMiddleware from './middleware/utils.js';
import ArgumentsMiddleware from './middleware/arguments.js';
import UserMiddleware from './middleware/user.js';
import TargetUserMiddleware from './middleware/target-user.js';
import GroupMiddleware from './middleware/group.js';
import GroupMessageHandlerMiddleware from './middleware/group-message-handler.js';
import commonCommands from './command/common.js';
import groupCommands from './command/group.js';
import adminCommands from './command/admin.js';

const { on, groupChat } = Composer;

await migrate();

const bot = new Telegraf<MyContext>(config.token);

bot.use(ErrorHandlerMiddleware);
bot.use(UtilsMiddleware);
bot.on(message('text'), ArgumentsMiddleware as any);
bot.on(['message', 'inline_query'], UserMiddleware);
bot.on('message', TargetUserMiddleware);
bot.on('message', groupChat(GroupMiddleware));

bot.start(ctx => {
    enqueue(() => ctx.deleteMessage(ctx.message.message_id));
    enqueue(() => ctx.quietReply(Templates.start));
});

bot.use(groupCommands);
bot.use(adminCommands);
bot.use(commonCommands);

// below middlewares won't execute if command hits

bot.use(enabledGroupChat(on('message', GroupMessageHandlerMiddleware)));

bot.on('inline_query', onInlineQuery);

queue.doNotRetry(_doNotRetry);
queue.catch(_catch);
bot.catch(_catch);

bot.launch();

console.log('Bot is now online.');

function _doNotRetry(reason: any) {
    if (reason instanceof TelegramError) {
        if (reason.code == 400) {
            return true;
        }
    }
    return false;
}
function _catch(err: unknown, ctx?: MyContext<Update>) {
    if (err instanceof TelegramError) {
        if (err.code == 400) {
            if (err.description.includes('message to delete not found') ||
                err.description.includes('query is too old')) {
                return;
            } else {
                console.error(err);
                return;
            }
        }
    }
    process.exitCode = 1;
    if (ctx?.update) {
        console.error('Unhandled error while processing', ctx.update);
    }
    throw err;
}

function onExit() {
    db.close();
    clearInterval(queue._timer);
}

process.once('SIGINT', () => {
    onExit();
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    onExit();
    bot.stop('SIGTERM');
});
