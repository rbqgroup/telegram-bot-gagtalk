import { readFile } from 'fs/promises';
import { GagTypes } from 'gagtalk-mandarin';
import { parse } from 'yaml';

type Config = Readonly<{
    token: string;
    botUsername: string;
    expGainCooldown: number;
    admins: number[];
    gagList: Readonly<{
        name: string;
        type: keyof typeof GagTypes;
        exp: number;
    }>[];
}>;

const config = parse(await readFile('config.yaml', { encoding: 'utf8' })) as Config;

export default config;
