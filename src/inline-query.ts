import { InlineQueryResultArticle, Update } from 'telegraf/types';
import { GagTypes, garble } from 'gagtalk-mandarin';
import config from './config.js';
import { MyContext } from './types/context.js';
import { format, Templates } from './locale.js';

const { gagList } = config;

export async function onInlineQuery(ctx: MyContext<Update.InlineQueryUpdate>) {
    const wearingGags = new Set(
        Object.values(ctx.user.groups).map(group => group.gagName).filter(name => name)
    );
    let results = gagList
        .filter(gag => !(
            ctx.inlineQuery.chat_type?.endsWith('group')
            && wearingGags.size
            && !wearingGags.has(gag.name)
        ))
        .map((gag): InlineQueryResultArticle => {
            const garbled = garble(ctx.inlineQuery.query, GagTypes[gag.type]);
            return {
                type: 'article',
                id: gag.name,
                title: gag.name,
                description: garbled,
                input_message_content: {
                    message_text: ctx.inlineQuery.query
                        ? format(Templates.viaBotPrefix, { gagName: gag.name }) + garbled
                        : format(Templates.viaBotEmptyText, { gagName: gag.name }),
                    parse_mode: ctx.inlineQuery.query ? undefined : 'MarkdownV2',
                },
            };
        });
    ctx.answerInlineQuery(results, { cache_time: 0 });
}
