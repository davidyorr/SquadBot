import {
  Message,
  MessageReaction,
  PartialUser,
  User,
  VoiceConnection,
} from "discord.js";
import { createCanvas } from "canvas";
import { LeagueCharts } from "league-charts";
import * as extractAudio from "ffmpeg-extract-audio";

let connection: VoiceConnection;

const charts = new LeagueCharts(process.env.RIOT_TOKEN || "");

const handleMessage = async (message: Message) => {
  const client = message.client;

  if (!client.user) {
    return;
  }
  if (message.author.id === client.user.id) {
    return;
  }

  if (message.content.startsWith("!champdmg")) {
    const split = message.content.split(" ");
    if (split.length === 1) {
      message.channel.send('missing summoner name: "!champdmg SummonerName"');
      return;
    }

    const summonerName = message.content
      .substring("!champdmg".length + 1)
      .trim();

    const canvas = createCanvas(600, 500);

    charts
      .championDamage({
        chartContext: canvas.getContext("2d"),
        summonerName,
        chartOptions: {
          responsive: false,
          animation: {
            duration: 0,
          },
        },
        afterRender: () => {
          message.channel.send({
            files: [canvas.createPNGStream()],
          });
        },
      })
      .catch((error) => {
        console.log("error creating chart", error);
        message.channel.send("error creating chart");
      });
  }

  if (message.content.startsWith("!gold")) {
    const split = message.content.split(" ");
    if (split.length === 1) {
      message.channel.send('missing summoner name: "!gold SummonerName"');
      return;
    }

    const summonerName = message.content.substring("!gold".length + 1).trim();

    const canvas = createCanvas(800, 400);

    charts
      .teamGoldAdvantage({
        chartContext: canvas.getContext("2d"),
        summonerName,
        chartOptions: {
          responsive: false,
          animation: {
            duration: 0,
          },
        },
        afterRender: () => {
          message.channel.send({
            files: [canvas.createPNGStream()],
          });
        },
      })
      .catch((error) => {
        console.log("error creating chart", error);
        message.channel.send("error creating chart");
      });
  }

  if (message.content === "!annie") {
    if (message.member?.voice.channel) {
      connection = await message.member?.voice.channel.join();

      try {
        const readableStream = await extractAudio({
          input: "https://i.imgur.com/iAN3UxQ.mp4",
        });

        const dispatcher = connection.play(readableStream, {
          volume: 0.15,
        });

        dispatcher.on("finish", () => {
          connection.disconnect();
        });
      } catch (err) {
        console.log("error playing audio", err);
      }
    }
  }

  if (message.content === "!leave") {
    if (connection) {
      connection.disconnect();
    }
  }

  const reactToMessageWithSameEmoji = (name: String) => {
    const id = client.emojis.cache.find((emoji) => emoji.name === name);
    if (id) {
      message.react(id);
    }
  };

  if (message.content.includes(":kiwicat:")) {
    reactToMessageWithSameEmoji("kiwicat");
  }

  if (message.content.includes(":catcow:")) {
    reactToMessageWithSameEmoji("catcow");
  }

  // echo a message if two different users have posted identical messages back to back
  const previousTwoMessages = message.channel.messages.cache.last(2);
  if (previousTwoMessages.length === 2) {
    const messageA = previousTwoMessages[0];
    const messageB = previousTwoMessages[1];
    // using .bot is not exactly what we want (we want to check if it's SquadBot, not any bot)
    const value =
      messageA.content === messageB.content &&
      messageA.author.id !== messageB.author.id &&
      !messageA.author.bot &&
      !messageB.author.bot
        ? messageA.content
        : "";

    if (value !== "") {
      message.channel.send(value);
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

const SquadBot = {
  handleMessage,
  handleMessageReactionAdd,
  handleMessageReactionRemove,
};

export { SquadBot };
