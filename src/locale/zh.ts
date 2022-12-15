const Templates = {
    start: `\
欢迎这位绒布球！
/help 查看使用方法。
`,
    help: `\
*__使用说明__*

于任意聊天内，在文本框中输入：

\`\`\`
@Dwscdv3_GagtalkBot 要透过口塞说的话…
支持换行，最多 256 字（点击此段文字可复制）
\`\`\`
当前设计用于自愿 roleplaying，群组内基于定时锁的自愿强制佩戴玩法还在策划中…（新建文件夹

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

*机器音变声器*
彩蛋预设。
将汉字转为无声调拼音。
因为写起来最简单所以作为功能性测试写的预设。
`,
    privacy: `\
本 bot 通常不会记录您输入的内容，仅当程序出错时会将您发送的信息输出到日志中以便修复问题。
如您介意，请不要通过此 bot 输入隐私信息。
`,

    succeed: '✅',
    unknownError: '⚠️ 发生了未知的错误。',
    userError: '❌ 命令错误。请查看 /help 了解正确用法。',
    replyRequired: '❌ 此命令需回复其他人使用。',
    argInvalid: '❌ 参数 $index "$value" 写错了！',
    argsMismatch: '❌ 这个命令要 $expected 个参数，你只写了 $actual 个。',

    viaBotPrefix: '（透过$gagName）',
    viaBotEmptyText: '（透过$gagName呜咽了一声）',
    expGained: `\
$user的绒度增加了 1 点。
当前绒度 $exp
（绒度获取有冷却时间，请不要为此无意义刷屏。）`,
    illegalMessage: '⚠️ $user似乎忘记了自己正戴着$gagName，作为惩罚 ta 的绒度已降低 1 点。',

    gagListHeader: '*__口塞名称与所需绒度__*\n（点击名称以复制）\n',
    currentGagPref: '你喜欢戴：__$gagName__\n如要更改，在此命令后加上口塞名称。',
    currentPermission: `\
你当前的权限为：__$permission__
如要更改，在此命令后加上 self, trusted, everyone 的其中之一。`,
    noPermission: '❌ $targetUser目前不想被群友们调教。',
    currentTimerLockLimit: `\
你设置的定时锁时间上限：__$userTimeLimit__
你的绒度所允许的上限：$expTimeLimit
（取两者中较小的一个。）`,
    timerLockAdded: '✅ $user给$targetUser的口塞上的定时锁加了 $time，剩余时间：$remainingTime。',
    selfTimerLockAdded: '✅ $user给自己的口塞上的定时锁加了 $time，剩余时间：$remainingTime。',
    timerLockAddFailed: '❌ $targetUser没戴着口塞呢。',
    timerLockRemainingTime: '$targetUser的口塞上的定时锁还剩 $time。',
    timerLockExpired: '$targetUser的口塞现在没有上锁。',
    gagged: '✅ $user给$targetUser戴上了$gagName。',
    selfGagged: '✅ $user给自己戴上了$gagName。',
    alreadyGagged: '❌ $targetUser已经戴着$gagName了。',
    ungagged: '✅ $user摘下了$targetUser的口塞。',
    selfUngagged: '✅ $user摘下了自己的口塞。',
    ungagFailed: '❌ $targetUser的口塞上的定时锁还剩 $time。',
    currentExp: '$targetUser的绒度是 $exp',
    expNotEnough: '❌ $targetUser的绒度不足。$gagName需要 $required，而$targetUser只有 $actual。',
    expRankingHeader: '本群最绒的绒布球们：\n',
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
`.slice(1);
}

export { Templates, formatTime };
