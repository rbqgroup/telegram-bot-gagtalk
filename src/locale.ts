import zh from './locale/zh.js';

export const Templates = zh.Templates;

export function format(template: string, ...args: any[]): string {
    for (let i = 0; i < args.length; i++) {
        template = template.replace(new RegExp(`\\$${i}`, 'g'), args[i].toString());
    }
    return template;
}
