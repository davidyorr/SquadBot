const Commands = {
  'ping': {
    'description': 'responds with pong',
    'execute': (message) => {
      message.channel.sendMessage('pong');
    }
  },
  'pong': {
    'description': 'responds with pong',
    'execute': (message) => {
      message.channel.sendMessage('pong');
    }
  }
}

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
  if (Commands[command]) {
    Commands[command].execute(message);
  } else {
    message.channel.sendMessage('sorry');
  }
}

const SquadBot = {
  Commands,
  parseMessage,
  executeCommand
}

module.exports = SquadBot;