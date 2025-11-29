const fs = require('fs')
const botToken = require('./botToken.json')
let users = []
let state = {}
const { Telegraf, Markup } = require('telegraf')




const bot = new Telegraf(botToken.botToken)
bot.start((ctx) => {

    ctx.reply("\nВыберите вариант:",
        Markup.inlineKeyboard([
            [
                Markup.button.callback("клиент", "cmd_1"),
                Markup.button.callback("сотруднк", "cmd_2"),
            ]
        ])
    );
});

bot.action("cmd_1", (ctx) => {
    ctx.answerCbQuery();
    const userId = ctx.from.id
    state[userId] = { "step":"wait_name", "data": {}}
    return bot.telegram.sendMessage(ctx.chat.id, "Введите имя:");
});


bot.on('text', (ctx) => {
    const userId = ctx.from.id
    const message = ctx.message.text
    if (!state[userId]) return 
    const userState = state[userId]
    if (userState.step === "wait_name") {
        userState.data.username = message;
        userState.step = "wait_address";
        return ctx.reply("Введите адрес:")
    }

    if (userState.step === "wait_address") {
        userState.data.address = message;
        userState.step = "wait_time";
        return ctx.reply("Введите время:");
    }
  

    if (userState.step === "wait_time") {
        userState.data.time = message;
        userState.step = "confirm";

        return ctx.reply(
            `Все верно?\n` +
            `Имя: ${userState.data.username}\n` +
            `Адрес: ${userState.data.address}\n` +
            `Время: ${userState.data.time}\n\n`,
         Markup.inlineKeyboard([
            [Markup.button.callback("ДА", "yes")],
            [Markup.button.callback("НЕТ", "no")]
        ]))
    }
})
 bot.action("yes", (ctx) => {
    const userId = ctx.from.id;
    ctx.answerCbQuery();

    if (!state[userId]) return ctx.reply("Начните заново: /start");

    const userData = state[userId].data;

    userData.status = false;
    userData.executor = "";

    users.push(userData);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    delete state[userId];

    ctx.reply("Отправлено на обработку.");
});
  






bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

