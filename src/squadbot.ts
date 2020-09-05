import {
  Client,
  Message,
  MessageReaction,
  PartialUser,
  User,
} from "discord.js";

const commands = {
  ping: {
    description: "responds with pong",
    execute: (message: Message) => {
      message.channel.send("pong");
    },
  },
};

type Command = keyof typeof commands;

const handleMessage = (message: Message, client: Client) => {
  if (!client.user) {
    return;
  }
  if (message.author.id === client.user.id) {
    return;
  }

  if (message.mentions.has(client.user)) {
    let messageSplit = message.content.split(" ");
    if (messageSplit.length > 1) {
      let command = messageSplit[1] as Command;
      executeCommand(command, message);
    }
  }

  if (message.content === "!react") {
    message.react("😄");
  }
};

const handleMessageReactionAdd = (
  reaction: MessageReaction,
  _: User | PartialUser
) => {
  const mirrorReaction = (reaction: MessageReaction) => {
    // for custom emojis you must use the id (and actual emojis don't have an id)
    reaction.message.react(reaction.emoji.id ?? reaction.emoji.name);
  };

  if (["kiwicat", "catcow", "😩"].includes(reaction.emoji.name)) {
    mirrorReaction(reaction);
  }
};

const executeCommand = (command: Command, message: Message) => {
  if (commands[command]) {
    commands[command].execute(message);
  }
};

const SquadBot = {
  handleMessage,
  handleMessageReactionAdd,
};

export { SquadBot };
