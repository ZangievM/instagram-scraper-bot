const Telegraf = require('telegraf')
const http = require('http')
const ip = process.env.IP || 'localhost'
const port = process.env.PORT || 8080
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const api = require('./instApi')
const stringHelper = require('./stringHelper')
const config = require('./config')
const database = require('./database')

const SEARCH = '🔍 Search by hashtag'
const GET_ALL = '😎 Get All posts'
const GET_FROM_CHANNEL = '📢 Get posts from specified channel'

const bot = new Telegraf(config.telegramToken)

bot.use(Telegraf.log())

bot.start(async (ctx) => {
  // Open main keyboard of bot
  replyMain(ctx.reply)
  // Saving users id and chatId and use them in future if it needed
  await database.insertUser(ctx.from.id,ctx.chat.id)
})

bot.command('main', ({
  reply
}) => {
  return replyMain(reply)
})

bot.hears(SEARCH, async (ctx) => {
  return ctx.reply('Search: \n Write hashtags separated with space')
})
bot.hears(GET_FROM_CHANNEL, async (ctx) => {
  let usernames = stringHelper.getArrowUsernames(api.links)
  let buttons = usernames.map(element => Markup.callbackButton(element, element))
  return ctx.reply('Please, choose channel', Markup.inlineKeyboard(buttons, {
    columns: 1
  }).extra())
})
bot.hears(GET_ALL, async (ctx) => {
  let posts = await database.getAllPosts()
  let promises = []
  for (const post of posts) {
    promises.push(ctx.reply(post))
  }
  return Promise.all(promises)
})

bot.hears(/^🔙/, async (ctx) => {
  return replyMain(ctx.reply)
})

bot.command('special', (ctx) => {
  return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
    return markup.resize()
      .keyboard([
        markup.contactRequestButton('Send contact'),
        markup.locationRequestButton('Send location')
      ])
  }))
})


bot.action(/^➡️/, async (ctx, next) => {
  const text = ctx.match.input
  let users = stringHelper.sliceUsers(text)
  console.log('Users', users);

  let promises = users.map(user => database.getPostsFromUser(user))
  let result = await Promise.all(promises)
  console.log('Results', result);
  let posts = result.reduce((res, item) => res.concat(item))
  console.log('Posts', posts);
  if (posts.length == 0) return next()
  let proms = []
  for (const post of posts) {
    proms.push(ctx.reply(post))
  }
  return Promise.all(proms)
})

bot.hears(/^#/, async (ctx) => {
  const text = ctx.message.text
  const entities = ctx.message.entities
  const tags = stringHelper.sliceEntities(text, entities, 'hashtag')
  let posts = await database.findWithHashTags(tags)
  let promises = []
  for (const post of posts) {
    promises.push(ctx.reply(post))
  }
  const last = `Founded ${promises.length} post(-s) with this hashtag(-s)`
  promises.push(ctx.reply(last))
  return Promise.all(promises)
})

bot.action(/.+/, (ctx) => {
  return ctx.answerCbQuery(`Nothing was found`)
})

bot.launch()

const server = http.createServer((request, response) => {
  response.writeHead(200, {
    'Content-Type': 'text/html'
  })
})
server.listen(port)
console.log(`Server listening at http://${ip}:${port}/`)


function replyMain(reply, message = 'Please, choose what you want:') {
  return reply(message, Markup
    .keyboard([
      [GET_ALL, GET_FROM_CHANNEL, SEARCH]
    ])
    .oneTime()
    .resize()
    .extra()
  )
}
async function updatePosts() {
  try {
    let res = await api.getPosts()
    let promises = res.map(element => database.handleObject(element))
    await Promise.all(promises)
  } catch (error) {
    console.laog('Error in handling posts', error);
  }
}
updatePosts()
setInterval(async () => {
  await updatePosts()
}, 36000000)