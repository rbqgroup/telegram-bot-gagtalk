import { readFile } from 'fs/promises';
import type { GagTypes } from 'gagtalk-mandarin';
import { parse } from 'yaml';

type Config = Readonly<{
    token: string;
    gagList: Readonly<{
        name: string;
        type: keyof typeof GagTypes;
    }>[];
}>;

const config = parse(await readFile('config.yaml', { encoding: 'utf8' })) as Config;

export default config;
