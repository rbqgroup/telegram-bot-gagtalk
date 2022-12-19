import config from '../config.js';

const Templates = {
    start: `\
欢迎这位绒布球！
/help 查看使用方法。
`,
    help: `\
*__使用说明__*

使用 /gag 佩戴口塞后，输入：

\`\`\`
@${config.botUsername} 要透过口塞说的话…
支持换行，最多 256 字（点击此段文字可复制）
\`\`\`

*__命令列表__*
大部分命令可回复消息以选择目标。如无目标或目标无效，则目标默认为自己。
方括号内为可选参数，可以不填。
时间格式为整数 \\+ 单位（d,h,m,s），可任意组合，如 1h90m。

/gag \\[口塞名称\\] \\- 戴口塞（群）
/ungag \\- 摘口塞（群）
/gaglist \\- 查看口塞列表
/gaghelp \\- 关于各种口塞的详细效果
/gagpref \\[口塞名称\\] \\- 设置默认口塞

/timeradd \\[时间\\] \\- 定时锁增加时间（群）
/timerremaining \\- 查询定时锁剩余时间（群）
/timerlimit \\[时间\\] \\- 设置定时锁时间上限

/lock \\- 主人锁上锁，只有上锁的人有钥匙（群）
/unlock \\- 主人锁解锁（群）

/xp \\- 查询绒度
/ranking \\- 绒度排行榜（群）

/permission \\- 设置其他人对你的权限（群）
/trust \\- 将目标添加到白名单（群）
/distrust \\- 将目标从白名单中删除（群）

/allowedstickers \\- 查看允许使用的表情包列表

*__你知道吗__*
透过口塞说话支持翻译数字和日语假名。
定时锁和主人锁可以共存。

*__安全词__*
将 SOS 的摩斯电码重复哼三遍，管理员听到后会视情况解除你的定时锁。（以每 10 分钟扣 1 绒度为代价）
如果你的主人不再活跃或逾越了你的底线，请私聊管理员以解除主人锁。
`,
    gagHelp: `\
*__口塞列表__（效果从弱到强）*

*布条口塞*
基础预设，效果较为宽松。
适用于想长期佩戴口塞的同时还能和他人勉强交流的全天候绒布球。

*开口器* 继承自 空心口球
在空心口球的基础上允许翘舌音。

*空心口球* 继承自 实心口球
在实心口球的基础上允许送气音。

*实心口球*
基础预设，效果较为严格。
通常只有足够简短的句子才能够被人解读，如：对不起、谢谢、不要。
适用于害怕自己说错话的社恐型绒布球。

*深喉口塞*
基础预设，模拟了电子绒布球 bot 的口塞效果。
将汉字转换为拟声词“啊哎昂呃欸嗯呜咕哼”的其中之一，没有声调标记。
适用于想要发出萌萌的声音的可爱型绒布球\\~

*束颈口塞*
特殊预设。
将汉字转换为声调。
因为嘴巴张不开，所以只能发出鼻音。
适用于想彻底被剥夺语言能力的硬核型绒布球！
`,
    privacy: `\
本 bot 通常不会记录您输入的内容，仅当程序出错时会将您发送的信息输出到日志中以便修复问题。
如您介意，请不要通过此 bot 输入隐私信息。

您的用户名、姓名、最后发言时间等将被记录以用于群组玩法。
`,

    succeed: '✅',
    unknownError: '⚠️ 发生了未知的错误。',
    userError: '❌ 命令错误。请查看 /help 了解正确用法。',
    replyRequired: '❌ 此命令需回复其他人使用。',
    argInvalid: '❌ 参数 $index 写错了！',
    argsMismatch: '❌ 这个命令要 $expected 个参数，你写了 $actual 个。',

    viaBotPrefix: '（透过$gagName）',
    viaBotEmptyText: '（透过$gagName呜咽了一声）',
    expGained: `\
$user的绒度增加了 1 点。
当前绒度 $exp

（绒度获取有冷却时间，请不要为此无意义刷屏。）
`,
    illegalMessage: `\
⚠️$user似乎忘记了自己正戴着$gagName，ta 的绒度降低了 1 点。

（请输入 @$botName 来发送消息。）
`,
    illegalSticker: `\
⚠️$user发送的表情不在允许的表情包中，ta 的绒度降低了 1 点。

（允许的表情包见 /allowedstickers。）
`,
    allowedStickerSetsHeader: '戴口塞时允许使用下列表情包：',

    forbidChangeOtherUsersSettings: '❌ 不许修改其他人的设置！',

    gagListHeader: '*__口塞名称与所需绒度__*\n（点击名称以复制）\n',

    currentGagPref: '$targetUser喜欢戴：__$gagName__\n如要更改，在此命令后加上口塞名称。',

    currentPermission: `\
$targetUser当前的权限为：__$permission__
如要更改，在此命令后加上 self, trusted, everyone 的其中之一。
`,
    setPermissionSelf: '✅$user不想被调教了。',
    setPermissionTrusted: '✅$user想被 ta 的主人调教了！',
    setPermissionEveryone: '✅$user想被群友们调教了！',
    noPermission: '❌$targetUser目前不想被你调教。',

    currentTimerLockLimit: `\
$targetUser设置的定时锁时间上限：__$userTimeLimit__
$targetUser的绒度所允许的上限：$expTimeLimit
（取两者中较小的一个。）
`,
    timerLockAdded: '✅$user给$targetUser的口塞上的定时锁加了 $time，剩余时间：$remainingTime。',
    selfTimerLockAdded: '✅$user给自己的口塞上的定时锁加了 $time，剩余时间：$remainingTime。',
    timerLockRemainingTime: '$targetUser的口塞上的定时锁还剩 $time。',
    timerLockExpired: '$targetUser的口塞现在没有上锁。',

    ownerLocked: '✅$user给$targetUser的口塞上了锁，并把钥匙保管了起来。',
    alreadyOwnerLocked: '❌$targetUser的口塞上已经有$ownerUser的锁了。',
    ownerLockRemoved: '✅$user用钥匙解锁了$targetUser的口塞。',
    ownerLockRemoveFailed: '❌ 你没有钥匙！钥匙在$ownerUser手上。',
    notOwnerLocked: '❌$targetUser的口塞没有被主人锁锁着。',
    notTrusted: '❌$user不在$targetUser的白名单里。',

    gagged: '✅$user给$targetUser戴上了$gagName。',
    selfGagged: '✅$user给自己戴上了$gagName。',
    alreadyGagged: '❌$targetUser已经戴着$gagName了。',
    notGagged: '❌$targetUser没戴着口塞呢。',
    ungagged: '✅$user摘下了$targetUser的口塞。',
    selfUngagged: '✅$user摘下了自己的口塞。',
    ungagPreventedByTimerLock: '❌$targetUser的口塞上的定时锁还剩 $time。',
    ungagPreventedByOwnerLock: '❌$targetUser的口塞被锁住了！钥匙在$ownerUser手上。',

    currentExp: '$targetUser的绒度是 $exp',
    expNotEnough: '❌$targetUser的绒度不足。$gagName需要 $required，而$targetUser只有 $actual。',
    expRankingHeader: '本群最绒的绒布球们：\n',

    trusted: '✅$user将$targetUser加进了白名单。',
    distrusted: '✅$user将$targetUser从白名单中删掉了。',

    adminUnlockedUser: `\
$targetUser呜呜的安全词被管理员听到并批准了，ta 的口塞上的定时锁已清零，并将调教权限设置为 self。
$targetUser的绒度扣除了 $deductedExp
`,
};

function formatTime(time: number) {
    const days = Math.floor(time / 86400000);
    const hours = Math.floor(time % 86400000 / 3600000);
    const minutes = Math.floor(time % 3600000 / 60000);
    const seconds = Math.floor(time % 60000 / 1000);
    return `\
${days ? ` ${days} 天` : ''}\
${hours ? ` ${hours} 小时` : ''}\
${minutes ? ` ${minutes} 分钟` : ''}\
${seconds ? ` ${seconds} 秒` : ''}\
`.slice(1) || '0 秒';
}

export { Templates, formatTime };
