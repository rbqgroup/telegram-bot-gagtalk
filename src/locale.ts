export * from './locale/zh.js';

export function format(template: string, replace: { [key: string]: any }) {
    for (const [key, value] of Object.entries(replace)) {
        template = template.replaceAll(`\$${key}`, value?.toString());
    }
    return template;
}
