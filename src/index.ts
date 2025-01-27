import { Client, GatewayIntentBits } from "discord.js";
import { SquadBot } from "./squadbot";

const token =
  process.env.NODE_ENV === "dev"
    ? require("../token.dev.js")
    : process.env.BOT_TOKEN;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

new SquadBot(client, token);
