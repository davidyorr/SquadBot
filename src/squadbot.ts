import { Client, Message } from "discord.js";

const Commands = {
  ping: {
    description: "responds with pong",
    execute: (message: Message) => {
      message.channel.send("pong");
    },
  },
};

const parseMessage = (message: Message) => {
  if (message.author.id === bot.user.id) {
    return;
  }

  if (message.mentions.has(bot.user)) {
    let messageSplit = message.content.split(" ");
    if (messageSplit.length > 1) {
      let command = messageSplit[1] as keyof typeof Commands;
      executeCommand(command, message);
    }
  }
};

const executeCommand = (command: keyof typeof Commands, message: Message) => {
  if (Commands[command]) {
    Commands[command].execute(message);
  } else {
    message.channel.send("sorry");
  }
};

const SquadBot = {
  Commands,
  parseMessage,
  executeCommand,
};

var bot: any;

export = (discordBot: Client) => {
  bot = discordBot;
  return SquadBot;
};
