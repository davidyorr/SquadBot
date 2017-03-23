const Discord = require('discord.js');

const bot = new Discord.Client();

const Auth = require('../auth.json');
const token = Auth.token;

const parseMessage = (message) => {
  if (message.author.id === bot.user.id) {
    return;
  }

  if (message.isMentioned(bot.user)) {
    let messageSplit = message.content.split(' ');
    if (messageSplit.length > 1) {
      let command = messageSplit[1];
      executeCommand(command, message);
    }
  }
}

const executeCommand = (command, message) => {
  switch (command) {
    case 'ping': {
      message.channel.sendMessage('pong');
    }
  }
}

bot.on('ready', () => {
  console.log('I am ready!');
});

bot.on('message', (message) => {
  parseMessage(message);
});

bot.login(token);