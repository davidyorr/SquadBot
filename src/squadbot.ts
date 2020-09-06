import { Message, MessageReaction, PartialUser, User } from "discord.js";

const commands = {
  ping: {
    description: "responds with pong",
    execute: (message: Message) => {
      message.channel.send("pong");
    },
  },
};

type Command = keyof typeof commands;

const handleMessage = (message: Message) => {
  const client = message.client;

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
};

const reactionsToMirror: string[] = ["kiwicat", "catcow", "😩"];

const handleMessageReactionAdd = (
  reaction: MessageReaction,
  _: User | PartialUser
) => {
  const mirrorReaction = (reaction: MessageReaction) => {
    // for custom emojis you must use the id (and actual emojis don't have an id)
    reaction.message.react(reaction.emoji.id ?? reaction.emoji.name);
  };

  if (reactionsToMirror.includes(reaction.emoji.name)) {
    mirrorReaction(reaction);
  }
};

const handleMessageReactionRemove = (
  reaction: MessageReaction,
  _: User | PartialUser
) => {
  if (reactionsToMirror.includes(reaction.emoji.name)) {
    // if there's one reaction left and it's SquadBot, then remove it
    if (reaction.count === 1 && reaction.me) {
      reaction.message.reactions.cache
        .get(reaction.emoji.id ?? reaction.emoji.name)
        ?.remove();
    }
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
  handleMessageReactionRemove,
};

export { SquadBot };
