import type { Context, NarrowedContext } from 'telegraf';
import type { InlineQueryResultArticle, Update } from 'telegraf/types';
import { GagTypes, garble } from 'gagtalk-mandarin';
import config from './config.js';

const { gagList } = config;

export async function onInlineQuery(ctx: NarrowedContext<Context, Update.InlineQueryUpdate>) {
    let results = gagList.map((gag): InlineQueryResultArticle => {
        const garbled = garble(ctx.inlineQuery.query, GagTypes[gag.type]);
        return {
            type: 'article',
            id: gag.name,
            title: gag.name,
            description: garbled,
            input_message_content: {
                message_text: ctx.inlineQuery.query
                    ? `（透过${gag.name}）${garbled}`
                    : `（透过${gag.name}呜咽了一声）`,
                parse_mode: ctx.inlineQuery.query ? undefined : 'MarkdownV2',
            },
        };
    });
    await ctx.answerInlineQuery(results, { cache_time: 0 });
}
