const { Telegraf, Markup } = require('telegraf')
const fs = require('fs');
const { json } = require('stream/consumers');
const { goBack } = require('../buttonBack.js')
const { botMessageId } = require('../buttonBack.js'); //<----------- импортируем обьект для бота
const { message } = require('telegraf/filters');


//=====================================================================================




const performer = (bot, ctx) => {

//============================================================
 ctx.reply("\nВыберите вариант:",
        Markup.inlineKeyboard([
            [
                Markup.button.callback("Взять заказ", "cmd_2.1"),
                Markup.button.callback("Ваши заказы", "cmd_2.2"),
                Markup.button.callback("Назад", "cmd"),
            ]
        ])
    );
    //========функция для сбора id================================================
    const messageId = {}
    
     
//==========Список заказов====================================================
    bot.action('cmd_2.1', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();

    const userId = ctx.from.id; //<-------- добываем айди пользователя
    botMessageId[userId] = botMessageId[userId] || []  
 

    // Загружаем список заказов
    let orderList = [];
    if (fs.existsSync("users.json")) {
        try {
            orderList = JSON.parse(fs.readFileSync("users.json", "utf8"));
        } catch (e) {
            orderList = [];
        }
    }

    const filter = orderList.filter(item => item.status === false);

    // Если свободных заказов нет
    if (filter.length === 0) {
         await ctx.reply("Свободных заказов нет", goBack("cmd_2"));

        return;
    }

    // Выводим каждый заказ
    for (const item of filter) {
        const msg =  await ctx.reply(
            `Имя: ${item.username}\nАдрес: ${item.address}\nДата: ${item.data}\nВремя: ${item.time}\n`,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback("взять", `take_${item.id}`)
                ]
            ])
        )
        botMessageId[userId].push(msg.message_id) 
        messageId[item.id] = messageId[item.id] || []
        messageId[item.id].push({mesID: msg.message_id, userId: userId}) 
    }
    await ctx.reply("Нажмите кнопку ниже, чтобы вернуться", goBack("cmd_2"));
});
   //============================мои заказы==========================================================================================
    bot.action("cmd_2.2", (ctx) => {
         ctx.answerCbQuery()
        ctx.deleteMessage()
    ctx.reply("\nВыберите вариант:",
        Markup.inlineKeyboard([
            [
                Markup.button.callback("Активные заказы", "cmd_2.1.1"),
                Markup.button.callback("Выполненые", "cmd_2.2.1"),
                Markup.button.callback("назад", "cmd_2"),
            ]  
        ]
        )
    )
}
    )
//========Нажатие на кнопку взять заказа===============================================================================
    bot.action(/take_(.+)/, (ctx) => {
        ctx.deleteMessage()
        ctx.answerCbQuery()
        
        
        const orderId = ctx.match[1]
    
        const orderUserList = JSON.parse(fs.readFileSync("users.json", "utf8"));
        const index = orderUserList.findIndex(item => item.id == orderId ); 
        const executorId = ctx.from.id
        if (index !== -1) {
            orderUserList[index].status = true;
            orderUserList[index].executor = executorId
            fs.writeFileSync("users.json", JSON.stringify(orderUserList, null, 2))
        }

        for (const key in messageId) // проверяет совпадениеп ключа  со значение которое переделаось из кнопки (айди заказа)
        {
            if (key === orderId) // если айди совпадают
            {
                const od = messageId[key][0] // жедается переменная с 2 значениями айди сообщения и айди заказчика
                for (const item in botMessageId)  // перебераем обьект на совпадение ключа
                    if (Number(item) === od.userId) // если айди заказчика совпадают с переданными айди заказчика
                    {
                        botMessageId[od.userId] = botMessageId[od.userId].filter(obj => obj !== od.mesID)  // фильтрует массив делая новый без айди сообщения
                    }                   
            }
        }
      
        bot.telegram.sendMessage(orderUserList[index].idUser, `ваш заказ взял: @${(ctx.from.username)}`)     
    })
 
    //============================на кнопку заказы активные===================================================================================
    bot.action("cmd_2.1.1", async (ctx) => {
        await ctx.answerCbQuery()
        await ctx.deleteMessage();
        
        const myId = ctx.from.id 
        const orderList = JSON.parse(fs.readFileSync("users.json", "utf8"))
        let filtered 

       
        
        if (!orderList) return
        filtered = orderList.filter(item => item.executor === myId && item.isDone !== true)
        if (filtered.length === 0) {
             await ctx.reply("нет активных", goBack('cmd_2'))
            return
        }

      for (const item of filtered) {
          await  ctx.reply(
            `Имя: ${item.username}\nАдрес: ${item.address}\nДата: ${item.data}\nВремя: ${item.time}`,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback("Выполнено", `done_${item.id}`),
                    Markup.button.callback("Отменить", `delete_${item.id}`)
                ]
            ])
          )
    }
        await ctx.reply("нажать", goBack('cmd_2'))
         
    })
    //=====================кнопка выплненые заказы выполненые===============================
    bot.action("cmd_2.2.1", async (ctx) => {
        ctx.deleteMessage()
        ctx.answerCbQuery()
        const myId = ctx.from.id 
        const orderList = JSON.parse(fs.readFileSync("users.json", "utf8"))
        let filtered 
        if (!orderList) return
        filtered = orderList.filter(item => item.executor === myId && item.isDone === true)
        if (filtered.length === 0) {
            await ctx.reply("нет выполненых", goBack('cmd_2.2'))
            return
         }
         
         let text = filtered.map(item => `Имя: ${item.username}\nАдрес: ${item.address}\nДата: ${item.data}\nВремя: ${item.time}`).join("\n\n");
         ctx.reply(text, goBack("cmd_2"));         
    })
//=====================кнопка выполнить======================================
    bot.action(/done_(.+)/, (ctx) => {
        ctx.deleteMessage()
        ctx.answerCbQuery()
        const orderId = ctx.match[1]
        const orderList = JSON.parse(fs.readFileSync("users.json", "utf8"))
        const index = orderList.findIndex(item => item.id == orderId)
        orderList[index].isDone = true
        fs.writeFileSync("users.json", JSON.stringify(orderList, null, 2))
         bot.telegram.sendMessage(orderList[index].idUser, `ваш заказ был выполнен: @${(ctx.from.username)}`) 
})
    //=======================кнопка удалить заказ=====================================
    bot.action(/delete_(.+)/, (ctx) => {
        ctx.deleteMessage()
        ctx.answerCbQuery()
        const orderId = ctx.match[1]
        const orderList = JSON.parse(fs.readFileSync("users.json", "utf8"))
        const index = orderList.findIndex(item => item.id == orderId)
            orderList[index].status = false;
            orderList[index].executor = ''
         fs.writeFileSync("users.json", JSON.stringify(orderList, null, 2))
         bot.telegram.sendMessage(orderList[index].idUser, `ваш заказ был отменен: @${(ctx.from.username)}`) 
})
















}// скобка функции

module.exports = { performer };

