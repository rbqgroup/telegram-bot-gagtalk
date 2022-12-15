import { MyContext } from '../types/context.js';
import { Templates } from '../locale.js';
import { enqueue } from '../util/queue.js';

export class UserError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message ?? Templates.userError, options);
        super.name = 'UserError';
    }
}

export default async function ErrorHandlerMiddleware(ctx: MyContext, next: () => Promise<void>) {
    try {
        await next();
    } catch (ex) {
        if (ex instanceof UserError) {
            const message = ex.message || Templates.unknownError;
            enqueue(() => ctx.toast(message));
        } else {
            console.error(ex);
            enqueue(() => ctx.quietReply(Templates.unknownError));
        }
    }
}
