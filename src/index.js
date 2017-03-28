const Discord = require('discord.js');
const bot = new Discord.Client();

const Auth = require('../auth.json');
const token = Auth.token;

const SquadBot = require('./squadbot.js');

bot.on('ready', () => {
  console.log('I am ready!');
});

bot.on('message', (message) => {
  SquadBot.parseMessage(message);
});

bot.login(token);
