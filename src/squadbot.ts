import {
  Client,
  codeBlock,
  Events,
  Message,
  MessageReaction,
  PartialMessageReaction,
  TextChannel,
  VoiceBasedChannel,
} from "discord.js";
import { createCanvas } from "canvas";
import { LeagueCharts } from "league-charts";
import * as extractAudio from "ffmpeg-extract-audio";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  VoiceConnection,
} from "@discordjs/voice";

export class SquadBot {
  #client: Client;
  #charts: LeagueCharts;
  #voiceConnection: VoiceConnection | undefined;

  constructor(client: Client, token: string) {
    this.#client = client;
    this.#charts = new LeagueCharts(process.env.RIOT_TOKEN || "", {
      maxAge: 20 * 1000,
      limit: 6,
    });

    // set up handlers
    client.on(Events.ClientReady, this.#handleReady);
    client.on(Events.MessageCreate, this.#handleMessage);
    client.on(Events.MessageReactionAdd, this.#handleMessageReactionAdd);
    client.on(Events.MessageReactionRemove, this.#handleMessageReactionRemove);

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
    if (message.channel.isSendable()) {
      message.channel
        .send(codeBlock(`-- ${content} --`))
        .then(console.log)
        .catch(console.error);
    }
  };

  #handleReady = (): void => {
    console.log("I am ready!");

    const limit = 10;

    this.#client.channels.cache.forEach((channel) => {
      if (channel instanceof TextChannel) {
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
          gameName: summonerName,
          chartOptions: {
            responsive: false,
            animation: {
              duration: 0,
            },
          },
          afterRender: () => {
            if (message.channel.isSendable()) {
              message.channel
                .send({
                  files: [canvas.createPNGStream()],
                })
                .then(() => {
                  if (callback) {
                    callback();
                  }
                });
            }
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
          gameName: summonerName,
          chartOptions: {
            responsive: false,
            animation: {
              duration: 0,
            },
          },
          afterRender: () => {
            if (message.channel.isSendable()) {
              message.channel
                .send({
                  files: [canvas.createPNGStream()],
                })
                .then(() => {
                  if (callback) {
                    callback();
                  }
                });
            }
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
          gameName: summonerName,
          afterRender: () => {
            if (message.channel.isSendable()) {
              message.channel.send({
                files: [canvas.createPNGStream()],
              });
            }
          },
        })
        .catch((error) => {
          handleChartError(error);
        });
    };

    if (message.content.startsWith("!lol")) {
      const split = message.content.split(" ");
      if (split.length === 1 && message.channel.isSendable()) {
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
      if (split.length === 1 && message.channel.isSendable()) {
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
      if (split.length === 1 && message.channel.isSendable()) {
        message.channel.send('missing summoner name: "!gold SummonerName"');
        return;
      }

      const summonerName = message.content.substring("!gold".length + 1).trim();

      sendGoldChart(summonerName);
    }

    if (message.content.startsWith("!scoreboard")) {
      const split = message.content.split(" ");
      if (split.length === 1 && message.channel.isSendable()) {
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
      channel: VoiceBasedChannel,
      url: string,
      title: string,
      options: {
        volume?: number;
      } = {}
    ) => {
      this.#voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      try {
        const readableStream = await extractAudio({
          input: url,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transform: (cmd: any) => {
            cmd.audioFilters([
              {
                filter: "volume",
                options: `${options.volume ?? "0.33"}`,
              },
            ]);
          },
        });

        const audioPlayer = createAudioPlayer();
        const resource = createAudioResource<{ title: string }>(
          readableStream,
          {
            metadata: {
              title: title,
            },
          }
        );

        const subscription = this.#voiceConnection?.subscribe(audioPlayer);
        if (!subscription) {
          console.error("failed to subscribe to voice connection");
          this.#voiceConnection?.disconnect();
          return;
        }
        audioPlayer.play(resource);

        audioPlayer.on(AudioPlayerStatus.Idle, () => {
          this.#voiceConnection?.disconnect();
        });
        audioPlayer.on("error", (error) => {
          console.error(
            `Error: ${error.message} with resource ${
              (error.resource.metadata as any)?.title
            }`
          );
        });
      } catch (err) {
        console.log("error playing audio", err);
        this.#voiceConnection?.disconnect();
      }
    };

    if (message.content === "!annie") {
      if (message.member?.voice.channel) {
        joinChannelAndPlayAudio(
          message.member?.voice.channel,
          "https://i.imgur.com/iAN3UxQ.mp4",
          "annie",
          {
            volume: 0.23,
          }
        );
      }
    }

    if (message.content === "!karma") {
      if (message.member?.voice.channel) {
        joinChannelAndPlayAudio(
          message.member?.voice.channel,
          "https://i.imgur.com/2XUwT87.mp4",
          "karma",
          {
            volume: 0.33,
          }
        );
      }
    }

    if (message.content === "!cnn") {
      if (message.member?.voice.channel) {
        joinChannelAndPlayAudio(
          message.member?.voice.channel,
          "https://i.imgur.com/vZHKUBl.mp4",
          "cnn",
          {
            volume: 0.75,
          }
        );
      }
    }

    if (message.content === "!leave") {
      this.#voiceConnection?.disconnect();
    }

    if (message.content === "!roll") {
      const randomInteger = (min: number, max: number) =>
        Math.floor(Math.random() * (max - min + 1)) + min;

      if (message.channel.isSendable()) {
        message.channel.send(randomInteger(1, 6).toString());
      }
    }

    if (message.content === "!version" && message.channel.isSendable()) {
      message.channel.send(process.env.GIT_SHA || "no version found");
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

      if (value !== "" && message.channel.isSendable()) {
        message.channel.send(value);
      }
    }
  };

  #reactionsToMirror: string[] = ["kiwicat", "catcow", "😩"];

  #handleMessageReactionAdd = (
    reaction: MessageReaction | PartialMessageReaction
  ): void => {
    const mirrorReaction = (
      reaction: MessageReaction | PartialMessageReaction
    ) => {
      // for custom emojis you must use the id (and actual emojis don't have an id)
      if (reaction.emoji.id) {
        reaction.message.react(reaction.emoji.id);
      } else if (reaction.emoji.name) {
        reaction.message.react(reaction.emoji.name);
      }
    };

    if (
      reaction.emoji.name &&
      this.#reactionsToMirror.includes(reaction.emoji.name)
    ) {
      mirrorReaction(reaction);
    }
  };

  #handleMessageReactionRemove = (
    reaction: MessageReaction | PartialMessageReaction
  ): void => {
    if (
      reaction.emoji.name &&
      this.#reactionsToMirror.includes(reaction.emoji.name)
    ) {
      // if there's one reaction left and it's SquadBot, then remove it
      if (reaction.count === 1 && reaction.me) {
        reaction.message.reactions.cache
          .get(reaction.emoji.id ?? reaction.emoji.name)
          ?.remove();
      }
    }
  };
}
