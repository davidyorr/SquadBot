import { Client } from "discord.js";
import { SquadBot } from "./squadbot";

const DEV = process.env.DEV;
const client = new Client();

const token = DEV ? require("../token.dev.js") : process.env.BOT_TOKEN;

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("message", SquadBot.handleMessage);

client.on("messageReactionAdd", SquadBot.handleMessageReactionAdd);

client.on("messageReactionRemove", SquadBot.handleMessageReactionRemove);

client.login(token);
