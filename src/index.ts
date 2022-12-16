import { Composer, Telegraf, TelegramError } from 'telegraf';
import { message } from 'telegraf/filters';
import { MyContext } from './types/context.js';
import config from './config.js';
import db from './db.js';
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

const bot = new Telegraf<MyContext>(config.token);

bot.use(ErrorHandlerMiddleware);
bot.use(UtilsMiddleware);
bot.on(message('text'), ArgumentsMiddleware as any);
bot.on(['message', 'inline_query'], UserMiddleware);
bot.on('message', groupChat(TargetUserMiddleware));
bot.on('message', groupChat(GroupMiddleware));

bot.start(ctx => enqueue(() => ctx.quietReply(Templates.start)));
bot.help(ctx => enqueue(() => ctx.quietReply(Templates.help)));
bot.command('gaghelp', ctx => enqueue(() => ctx.quietReply(Templates.gagHelp)));
bot.command('privacy', ctx => enqueue(() => ctx.quietReply(Templates.privacy)));

bot.use(groupCommands);
bot.use(adminCommands);
bot.use(commonCommands);

// below middlewares won't execute if command hits

bot.use(enabledGroupChat(on('message', GroupMessageHandlerMiddleware)));

bot.on('inline_query', onInlineQuery);

queue.doNotRetry(reason => {
    if (reason instanceof TelegramError) {
        if (reason.code == 400) {
            return true;
        }
    }
    return false;
});
bot.catch((err, ctx) => {
    if (err instanceof TelegramError) {
        if (err.description.includes('Bad Request: message to delete not found') ||
            err.description.includes('Bad Request: query is too old')) {
            return;
        }
    }
    process.exitCode = 1;
    console.error('Unhandled error while processing', ctx.update);
    throw err;
});

bot.launch();

console.log('Bot is now online.');

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
