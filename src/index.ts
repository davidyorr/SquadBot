const DEV = process.env.DEV;

import { Client } from "discord.js";

const bot = new Client();

const token = DEV ? require('../token.dev.js') : require('../token.js');

const SquadBot = require('./squadbot.js')(bot);

bot.on('ready', () => {
  console.log('I am ready!');
});

bot.on('message', (message) => {
  SquadBot.parseMessage(message);
});

bot.login(token);