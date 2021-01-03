import { registerCommands, registerEvents } from './utils/registry'
import config from '../slappey.json'
import DiscordClient from './client/client'

async function bootstrap() {
  const client = new DiscordClient({})
  client.prefix = config.prefix || client.prefix
  await registerCommands(client, '../commands')
  await registerEvents(client, '../events')
  await client.login(config.token)
}

bootstrap()
