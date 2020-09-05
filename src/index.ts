import { Client } from "discord.js";
import { SquadBot } from "./squadbot";

const DEV = process.env.DEV;
const client = new Client();

const token = DEV ? require("../token.dev.js") : require("../token.js");

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("messageReactionAdd", (reaction, user) => {
  SquadBot.handleMessageReactionAdd(reaction, user);
});

client.on("message", (message) => {
  SquadBot.handleMessage(message, client);
});

client.login(token);
