import { UserError } from './error-handler.js';
import { format, Templates } from '../locale.js';
import { MyTextMessageContext } from '../types/context.js';
import { enqueue } from '../util/queue.js';
import { markdownEscape } from '../util/telegraf.js';

export class CommandArgumentsCountMismatchError extends UserError {
    constructor(requireCount: number, providedCount: number) {
        super(format(Templates.argsMismatch, {
            expected: requireCount,
            actual: providedCount,
        }));
        this.name = 'CommandArgumentsCountMismatchError';
    }
}

export class ArgumentInvalidError extends UserError {
    constructor(index: number, value: string, cause?: unknown) {
        super(format(Templates.argInvalid, {
            index: index + 1,
            value: markdownEscape(value),
        }), { cause });
        this.name = 'ArgumentInvalidError';
    }
}

export default async function ArgumentsMiddleware(
    ctx: MyTextMessageContext,
    next: () => Promise<void>,
) {
    ctx.arguments = parse(ctx.message?.text);
    ctx.castArgument = (index, fn) => {
        try {
            return fn(ctx.arguments[index]);
        } catch (ex) {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            throw new ArgumentInvalidError(index, ctx.arguments[index], ex);
        }
    };
    await next();
}

export function assertArgument(
    index: number,
    predicate: (arg: string) => boolean,
) {
    return (ctx: MyTextMessageContext, next: () => Promise<void>) => {
        if (!predicate(ctx.arguments[index])) {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            throw new ArgumentInvalidError(index, ctx.arguments[index]);
        }
        next();
    }
}

export function assertArgumentsAtLeast(count: number) {
    return async (ctx: MyTextMessageContext, next: () => Promise<void>) => {
        if (ctx.arguments.length < count) {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            throw new CommandArgumentsCountMismatchError(count, ctx.arguments.length);
        }
        await next();
    }
}

export function assertArgumentsAtMost(count: number) {
    return async (ctx: MyTextMessageContext, next: () => Promise<void>) => {
        if (ctx.arguments.length > count) {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            throw new CommandArgumentsCountMismatchError(count, ctx.arguments.length);
        }
        await next();
    }
}

export function assertArgumentsCountExact(count: number) {
    return async (ctx: MyTextMessageContext, next: () => Promise<void>) => {
        if (ctx.arguments.length !== count) {
            enqueue(() => ctx.deleteMessage(ctx.message.message_id));
            throw new CommandArgumentsCountMismatchError(count, ctx.arguments.length);
        }
        await next();
    }
}

function parse(str: string) {
    if (typeof str != 'string') return [];
    if (!str.startsWith('/')) return [];
    let args = str.split(/\s/);
    args.shift();
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('"')) {
            let end = -1, j = i;
            for (; j < args.length; j++) {
                if (args[j].endsWith('"')) {
                    end = j;
                    break;
                }
            }
            if (end >= 0) {
                let joined = args.slice(i, j + 1).join(' ');
                joined = joined.slice(1, joined.length - 1);
                args.splice(i, j - i + 1, joined);
            }
        }
    }
    return args.filter(s => s.length > 0);
}
