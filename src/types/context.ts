import { Context } from 'telegraf';
import { Update } from 'telegraf/types';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { Message } from 'typegram';
import { Group } from '../model/group';
import { User } from '../model/user';

export interface MyContext<U extends Update = Update> extends Context<U> {
    user: User;
    /** Reply target of the message, otherwise self. */
    targetUser: User;
    group?: Group;
    arguments: string[];
    /** Your fn should throw if cast was failed. */
    castArgument: <T>(index: number, fn: (arg: string) => T) => T;
    quietReply: (markdown: string, extra?: ExtraReplyMessage) => Promise<Message.TextMessage>;
    quietQuoteReply: (markdown: string, extra?: ExtraReplyMessage) => Promise<Message.TextMessage>;
    /** Send an auto-delete message if inside a group. */
    toast: (markdown: string, ms?: number, extra?: ExtraReplyMessage) => Promise<Message.TextMessage>;
}

export type MyMessageContext<M extends Message = Message> = MyContext<Update.MessageUpdate<M>>;
export type MyTextMessageContext = MyMessageContext<Message.TextMessage>;
