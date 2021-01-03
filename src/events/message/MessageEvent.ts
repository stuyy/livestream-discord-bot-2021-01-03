import BaseEvent from '../../utils/structures/BaseEvent'
import { GuildEmoji, Message, WebhookClient } from 'discord.js'
import DiscordClient from '../../client/client'

const webhookClient = new WebhookClient(
  'insert webhook id',
  process.env.WEBHOOK_TOKEN!
)

export default class MessageEvent extends BaseEvent {
  private whitelist = ['', '']
  constructor() {
    super('message')
  }

  extractCode = (str: string) => {
    const codeRegex = /discord.(?:gg|com)(?:\/(?:invite))?\/(.*)/
    const match = codeRegex.exec(str)
    if (!match || match.length === 0) return
    return match[1]
  }

  hasInviteLink = (message: Message) => {
    const regex = /discord.(gg|com\/invite)\/(.*)/
    const inviteLink = regex.exec(message.content)
    if (!inviteLink || inviteLink.length === 0) return false
    const match = inviteLink.shift()!
    return match
  }

  validateInvite = async (client: DiscordClient, code: string) => {
    const inviteLink = await client.fetchInvite(code)
    const { guild } = inviteLink
    return this.whitelist.includes(guild!.id)
  }

  replaceEmojis = (
    msg: string,
    matches: string[],
    emojis: (GuildEmoji | undefined)[]
  ) => {
    for (const i in matches) {
      const regex = new RegExp(String.raw`<${matches[i]}\d+>`)
      const regexp = new RegExp(matches[i], 'g')
      if (regex.test(msg)) {
        continue
      } else {
        msg = msg.replace(regexp, emojis[i] ? `${emojis[i]}` : '')
      }
      console.log(msg)
    }
    return msg
  }

  async run(client: DiscordClient, message: Message) {
    if (message.author.bot) return
    const emojiRegex = /(:(\w*):)/g
    const matches = message.content.match(emojiRegex)!
    const cleanMatches = matches.map((str) => str.replace(/:/g, ''))

    const emojis = cleanMatches.map((str) =>
      client.emojis.cache.find((emoji) => emoji.name === str)
    )

    const newMsg = this.replaceEmojis(message.content, matches, emojis)
    webhookClient.edit({
      avatar: message.author.displayAvatarURL(),
      name: message.author.username,
    })
    webhookClient.send(newMsg)
    const match = this.hasInviteLink(message)
    if (match) {
      const code = this.extractCode(match)!
      const valid = await this.validateInvite(client, code)
      if (!valid) return message.delete()
    }

    if (message.content.startsWith(client.prefix)) {
      const [cmdName, ...cmdArgs] = message.content
        .slice(client.prefix.length)
        .trim()
        .split(/\s+/)
      const command = client.commands.get(cmdName)
      if (command) {
        command.run(client, message, cmdArgs)
      }
    }
  }
}
