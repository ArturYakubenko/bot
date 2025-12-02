const { Markup } = require('telegraf')
//----------------------обьект где хранятся месседжи
let botMessageId = {}
//=====================кнопка назад===============================
const goBack = (cmd) => { 
    return  Markup.inlineKeyboard(
        [
            [
        Markup.button.callback("назад", cmd)
            ]
        ]
    )
}




module.exports = {botMessageId, goBack}