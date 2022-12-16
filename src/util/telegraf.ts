import { Composer, Middleware, MiddlewareFn } from 'telegraf';
import { NonemptyReadonlyArray } from 'telegraf/typings/util.js';
import { User as TelegramUser } from 'typegram';
import { User } from '../model/user.js';
import { MyContext, MyTextMessageContext } from '../types/context.js';

const { compose, optional } = Composer<MyContext>;

export function subcommand<C extends MyTextMessageContext>(
    command: string,
    ...fns: NonemptyReadonlyArray<Middleware<C>>
): MiddlewareFn<C> {
    return ((ctx, next) => {
        if (ctx.arguments[0] == command) {
            ctx.arguments.shift();
            compose(fns)(ctx, next);
        } else {
            next();
        }
    });
}

export function enabledGroupChat<C extends MyContext>(
    ...fns: NonemptyReadonlyArray<Middleware<C>>
): MiddlewareFn<C> {
    return optional(ctx => ctx.group?.botEnabled == true, ...fns);
}

export function markdownTextMention(user: User | TelegramUser) {
    if (!user) {
        return '';
    }
    const firstName = markdownEscape(
        (user as User).firstName ?? (user as TelegramUser).first_name);
    const lastName = markdownEscape(
        (user as User).lastName ?? (user as TelegramUser).last_name);
    return ` [${lastName ? lastName + ' ' : ''}${firstName}](tg://user?id=${user.id}) `;
}

export function markdownEscape(str?: string) {
    return str
        ? '_*[]()~`>#+-=|{}.!'.split('')
            .reduce((str, char) => str.replaceAll(char, '\\' + char), str)
        : str;
}
