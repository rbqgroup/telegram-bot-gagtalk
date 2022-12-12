import { Telegraf } from 'telegraf';
import config from './config.js';
import { onInlineQuery } from './bot.js';
import { Templates } from './locale.js';

const bot = new Telegraf(config.token);

bot.start(async ctx => await ctx.reply(Templates.start));
bot.help(async ctx => await ctx.reply(Templates.help, { parse_mode: 'MarkdownV2' }));
bot.command('privacy', async ctx => await ctx.reply(Templates.privacy));

bot.on('inline_query', onInlineQuery);

bot.launch();

console.log('Bot is now online.');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
