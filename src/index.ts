import { Client } from "discord.js";
import { SquadBot } from "./squadbot";

const token = process.env.DEV
  ? require("../token.dev.js")
  : process.env.BOT_TOKEN;
const client = new Client();

new SquadBot(client, token);
