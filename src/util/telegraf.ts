import { Composer, Middleware, MiddlewareFn } from 'telegraf';
import { NonemptyReadonlyArray } from 'telegraf/typings/util.js';
import { User as TelegramUser, Chat } from 'typegram';
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

export function markdownTextMention(user: User | TelegramUser | Chat.ChannelChat) {
    if (!user) {
        return '';
    }
    if ('type' in user) {
        const firstName = markdownEscape(user.title);
        const username = markdownEscape(user.username);
        return ` [${firstName}](https://t.me/${username}) `;
    } else if (user.id < 0 && 'firstName' in user) {
        const firstName = markdownEscape(user.firstName);
        const username = markdownEscape(user.username);
        return ` [${firstName}](https://t.me/${username}) `;
    } else {
        const firstName = markdownEscape(
            (user as User).firstName ?? (user as TelegramUser).first_name);
        const lastName = markdownEscape(
            (user as User).lastName ?? (user as TelegramUser).last_name);
        return ` [${lastName ? lastName + ' ' : ''}${firstName}](tg://user?id=${user.id}) `;
    }
}

export function markdownEscape(str?: string) {
    return str
        ? '_*[]()~`>#+-=|{}.!'.split('')
            .reduce((str, char) => str.replaceAll(char, '\\' + char), str)
        : str;
}

export function getTelegramUserInfo(
    user: TelegramUser | Chat.ChannelChat,
): Pick<User, 'id' | 'username' | 'firstName' | 'lastName'> {
    if ('type' in user) {
        return {
            id: user.id,
            username: user.username,
            firstName: user.title,
        };
    } else {
        return {
            id: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
        };
    }
}
