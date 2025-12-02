const { performer } = require("./forPerformer/performer.js");
const { v4: uuidv4 } = require('uuid');
const { goBack } = require('./buttonBack.js')
const fs = require('fs')
const botToken = require('./botToken.json')
const { botMessageId } = require('./buttonBack.js') //<----------- импортируем обьект для бота
let users 
let state = {}




const { Telegraf, Markup } = require('telegraf')

    const array = fs.readFileSync("users.json", "utf8")
    users = JSON.parse(array)



const bot = new Telegraf(botToken.botToken)
bot.start((ctx) => {
    ctx.reply("тут будет описание", 
        Markup.inlineKeyboard(
            [
                [
                    Markup.button.callback("продолжить", "cmd"),

                ]
            ]
        )
)
}
)
 

//=========================начальная кнопка продолжения=====================
bot.action("cmd", (ctx) => {
    ctx.answerCbQuery()
    ctx.deleteMessage()
    ctx.reply("выберете ваш вариант",
        Markup.inlineKeyboard([[
            Markup.button.callback("клиент", "cmd_1"),
            Markup.button.callback("исполнитель", "cmd_2"),
            Markup.button.callback("правила", "cmd_3")
        ]])
    )
})

//=======================кнопка правил====================
bot.action("cmd_3", async (ctx) =>  {
    await ctx.deleteMessage()
    await ctx.reply("тут будут правила", goBack("cmd"))
    
})



bot.action('cmd_2', async (ctx) => {
    await ctx.deleteMessage();
    await ctx.answerCbQuery();
    const userId = ctx.from.id; 
    
    //==========удаление==============
    if (botMessageId[userId] && botMessageId[userId].length > 0) {
        for (const item of botMessageId[userId]) {
            try {
                await ctx.deleteMessage(item)
               
            }
            catch (e) {
                console.log(`Не удалось удалить сообщение ${item}:`, e.description || e);
            }
        }
        botMessageId[userId] = []
    }
    //=======================================================================
    performer(bot, ctx, state);
});

bot.action("cmd_1", (ctx) => {
    ctx.deleteMessage()
    ctx.answerCbQuery();
    const userId = ctx.from.id
    state[userId] = { "step":"wait_name", "data": {}}
    return bot.telegram.sendMessage(ctx.chat.id, "Введите имя:", goBack("cmd"));
        
});


bot.on('text', (ctx) => {
    const userId = ctx.from.id
    const message = ctx.message.text
    if (!state[userId]) return 
    const userState = state[userId]
    if (userState.step === "wait_name") {
        userState.data.username = message;
        userState.step = "wait_address";
        return ctx.reply("Введите адрес:", goBack("cmd"))
    }

    if (userState.step === "wait_address") {
        userState.data.address = message;
        userState.step = "wait_data";
        return ctx.reply("введите дату:", goBack("cmd"));
    }
   if (userState.step === "wait_data") {
        userState.data.data = message;
        userState.step = "wait_time";
        return ctx.reply("введите время:", goBack("cmd"));
    }

    if (userState.step === "wait_time") {
        userState.data.time = message;
        userState.step = "confirm";

        return ctx.reply(
            `Все верно?\n` +
            `Имя: ${userState.data.username}\n` +
            `Адрес: ${userState.data.address}\n` +
            `Время: ${userState.data.data}\n` +
            `Время: ${userState.data.time}\n\n`,
         Markup.inlineKeyboard([
            [Markup.button.callback("ДА", "yes")],
            [Markup.button.callback("НЕТ", "no")]
        ]))
    }
})

bot.action("no", (ctx) => {
    ctx.deleteMessage()
    ctx.answerCbQuery();
    delete state[userId]
    ctx.reply("Информация сброшена", goBack("cmd"))
})
bot.action("yes", async (ctx) => {
    ctx.deleteMessage()
    ctx.answerCbQuery()
    const userId = ctx.from.id;;
    const id = uuidv4()
    ctx.answerCbQuery();
    if (!state[userId])
        return ctx.reply("Начните заново", goBack("ctx"));
    const userData = state[userId].data;

        userData.status = false;
        userData.executor = "";
        userData.id = id
        userData.isDone = false
        userData.idUser = ctx.from.id

    users.push(userData);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    delete state[userId];

     await ctx.reply("Отправлено на обработку.",goBack("cmd"));
});






bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

