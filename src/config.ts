import { readFile } from 'fs/promises';
import { GagTypes } from 'gagtalk-mandarin';
import { parse } from 'yaml';

type Config = Readonly<{
    token: string;
    botUsername: string;
    expGainCooldown: number;
    emoji: boolean;
    admins: number[];
    gagList: Readonly<{
        name: string;
        type: keyof typeof GagTypes;
        exp: number;
    }>[];
}>;

let config: Config = {} as Config;

await loadConfig();

async function loadConfig() {
    Object.assign(config, parse(await readFile('data/config.yaml', { encoding: 'utf8' })));
}

export { config, loadConfig };
export default config;
