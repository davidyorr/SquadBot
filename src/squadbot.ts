import {
  Channel,
  Client,
  Message,
  MessageReaction,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from "discord.js";
import { createCanvas } from "canvas";
import { LeagueCharts } from "league-charts";
import * as extractAudio from "ffmpeg-extract-audio";

export class SquadBot {
  #client: Client;
  #charts: LeagueCharts;
  #voiceConnection: VoiceConnection | undefined;

  constructor(client: Client, token: string) {
    this.#client = client;
    this.#charts = new LeagueCharts(process.env.RIOT_TOKEN || "");

    // set up handlers
    client.on("ready", this.#handleReady);
    client.on("message", this.#handleMessage);
    client.on("messageReactionAdd", this.#handleMessageReactionAdd);
    client.on("messageReactionRemove", this.#handleMessageReactionRemove);

    if (token !== "") {
      client
        .login(token)
        .then(() => {
          console.log("logged in");
        })
        .catch((error) => {
          console.log("error logging in", error);
        });
    }
  }

  #sendErrorMessage = (message: Message, content: string): void => {
    message.channel.send(`-- ${content} --`, {
      code: "diff",
    });
  };

  #handleReady = (): void => {
    console.log("I am ready!");

    const isTextChannel = (channel: Channel): channel is TextChannel => {
      return channel.type === "text";
    };

    const limit = 10;

    this.#client.channels.cache.forEach((channel) => {
      if (isTextChannel(channel)) {
        channel.messages
          .fetch({
            limit,
          })
          .then(() =>
            console.log(
              `added ${limit} messages from ${channel.name} to the cache`
            )
          )
          .catch((error) => {
            console.log("error adding messages to the cache", error);
          });
      }
    });
  };

  #handleMessage = async (message: Message): Promise<void> => {
    if (!this.#client.user) {
      return;
    }
    if (message.author.id === this.#client.user.id) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChartError = (error: any) => {
      console.log("error creating chart", error);
      if (error.response) {
        const errorMessage = error.response?.data?.status?.message;

        this.#sendErrorMessage(
          message,
          `Error creating chart${errorMessage ? ` : ${errorMessage}` : ""}`
        );
      } else {
        this.#sendErrorMessage(message, "Error creating chart");
      }
    };

    const sendGoldChart = (
      summonerName: string,
      callback?: () => void
    ): void => {
      const canvas = createCanvas(800, 400);

      this.#charts
        .lineChart({
          chartContext: canvas,
          chartStat: "totalGold",
          summonerName,
          chartOptions: {
            responsive: false,
            animation: {
              duration: 0,
            },
          },
          afterRender: () => {
            message.channel
              .send({
                files: [canvas.createPNGStream()],
              })
              .then(() => {
                if (callback) {
                  callback();
                }
              });
          },
        })
        .catch((error) => {
          handleChartError(error);
        });
    };

    const sendChampionDamageChart = (
      summonerName: string,
      callback?: () => void
    ): void => {
      const canvas = createCanvas(750, 500);

      this.#charts
        .barChart({
          chartContext: canvas,
          chartStat: "totalDamageDealtToChampions",
          summonerName,
          chartOptions: {
            responsive: false,
            animation: {
              duration: 0,
            },
          },
          afterRender: () => {
            message.channel
              .send({
                files: [canvas.createPNGStream()],
              })
              .then(() => {
                if (callback) {
                  callback();
                }
              });
          },
        })
        .catch((error) => {
          handleChartError(error);
        });
    };

    const sendScoreboard = (summonerName: string): void => {
      const canvas = createCanvas(800, 450);

      this.#charts
        .scoreboard({
          chartContext: canvas,
          summonerName,
          afterRender: () => {
            message.channel.send({
              files: [canvas.createPNGStream()],
            });
          },
        })
        .catch((error) => {
          handleChartError(error);
        });
    };

    if (message.content.startsWith("!lol")) {
      const split = message.content.split(" ");
      if (split.length === 1) {
        message.channel.send('missing summoner name: "!lol SummonerName"');
        return;
      }

      const summonerName = message.content.substring("!lol".length + 1).trim();

      sendGoldChart(summonerName, () =>
        sendChampionDamageChart(summonerName, () =>
          sendScoreboard(summonerName)
        )
      );
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

      sendChampionDamageChart(summonerName);
    }

    if (message.content.startsWith("!gold")) {
      const split = message.content.split(" ");
      if (split.length === 1) {
        message.channel.send('missing summoner name: "!gold SummonerName"');
        return;
      }

      const summonerName = message.content.substring("!gold".length + 1).trim();

      sendGoldChart(summonerName);
    }

    if (message.content.startsWith("!scoreboard")) {
      const split = message.content.split(" ");
      if (split.length === 1) {
        message.channel.send(
          'missing summoner name: "!scoreboard SummonerName"'
        );
        return;
      }

      const summonerName = message.content
        .substring("!scoreboard".length + 1)
        .trim();

      sendScoreboard(summonerName);
    }

    const joinChannelAndPlayAudio = async (
      channel: VoiceChannel,
      url: string,
      options: {
        volume?: number;
      } = {}
    ) => {
      this.#voiceConnection = await channel.join();

      try {
        const readableStream = await extractAudio({
          input: url,
        });

        const dispatcher = this.#voiceConnection.play(readableStream, {
          volume: options.volume ?? 0.15,
        });

        dispatcher.on("finish", () => {
          this.#voiceConnection?.disconnect();
        });
      } catch (err) {
        console.log("error playing audio", err);
      }
    };

    if (message.content === "!annie") {
      if (message.member?.voice.channel) {
        joinChannelAndPlayAudio(
          message.member?.voice.channel,
          "https://i.imgur.com/iAN3UxQ.mp4",
          {
            volume: 0.15,
          }
        );
      }
    }

    if (message.content === "!karma") {
      if (message.member?.voice.channel) {
        joinChannelAndPlayAudio(
          message.member?.voice.channel,
          "https://i.imgur.com/2XUwT87.mp4",
          {
            volume: 0.17,
          }
        );
      }
    }

    if (message.content === "!cnn") {
      if (message.member?.voice.channel) {
        joinChannelAndPlayAudio(
          message.member?.voice.channel,
          "https://i.imgur.com/vZHKUBl.mp4",
          {
            volume: 0.38,
          }
        );
      }
    }

    if (message.content === "!leave") {
      this.#voiceConnection?.disconnect();
    }

    const reactToMessageWithSameEmoji = (name: string) => {
      const id = this.#client.emojis.cache.find((emoji) => emoji.name === name);
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

      const value =
        messageA.content === messageB.content &&
        messageA.author.id !== messageB.author.id &&
        // using .bot is not exactly what we want (we want to check if it's SquadBot, not any bot)
        !messageA.author.bot &&
        !messageB.author.bot &&
        // don't echo if it's a command
        !messageA.content.startsWith("!")
          ? messageA.content
          : "";

      if (value !== "") {
        message.channel.send(value);
      }
    }
  };

  #reactionsToMirror: string[] = ["kiwicat", "catcow", "😩"];

  #handleMessageReactionAdd = (reaction: MessageReaction): void => {
    const mirrorReaction = (reaction: MessageReaction) => {
      // for custom emojis you must use the id (and actual emojis don't have an id)
      reaction.message.react(reaction.emoji.id ?? reaction.emoji.name);
    };

    if (this.#reactionsToMirror.includes(reaction.emoji.name)) {
      mirrorReaction(reaction);
    }
  };

  #handleMessageReactionRemove = (reaction: MessageReaction): void => {
    if (this.#reactionsToMirror.includes(reaction.emoji.name)) {
      // if there's one reaction left and it's SquadBot, then remove it
      if (reaction.count === 1 && reaction.me) {
        reaction.message.reactions.cache
          .get(reaction.emoji.id ?? reaction.emoji.name)
          ?.remove();
      }
    }
  };
}
