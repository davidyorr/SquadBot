import {
  Channel,
  Client,
  ClientUser,
  Emoji,
  Guild,
  Message,
  MessageReaction,
  TextChannel,
  User,
} from "discord.js";

export class MockDiscordJs {
  Client: Client;
  Guild: Guild;
  Channel: Channel;
  TextChannel: TextChannel;
  ClientUser: ClientUser;
  #messageIdCounter = 0;

  constructor() {
    this.Client = new Client();
    this.Guild = new Guild(this.Client, {});
    this.Channel = new Channel(this.Client, {});
    this.TextChannel = new TextChannel(this.Guild, {});
    this.ClientUser = new ClientUser(this.Client, {
      ...this.mockUser({
        id: "squadbot-user-id",
        username: "SquadBot",
        discriminator: "1234",
        avatar: "avatar",
        bot: true,
      }),
    });
    this.Client.user = this.ClientUser;
  }

  public mockUser(user?: Partial<Omit<User, "valueOf">>): User {
    return new User(this.Client, {
      bot: false,
      ...(user ?? {}),
    });
  }

  public mockMessage(message: Partial<Omit<Message, "valueOf">>): Message {
    return new Message(
      this.Client,
      {
        id: "mock-message-id-" + this.#messageIdCounter++,
        ...message,
      },
      this.TextChannel
    );
  }

  public addMessageToCache(message: Partial<Omit<Message, "valueOf">>): void {
    this.TextChannel.messages.cache.set(message.id ?? "0", message as Message);
  }

  public mockMessageReaction(
    emoji: Partial<Omit<Emoji, "valueOf">>
  ): MessageReaction {
    return new MessageReaction(
      this.Client,
      {
        emoji: {
          id: null,
          ...emoji,
        },
      },
      this.mockMessage({
        content: "message content",
      })
    );
  }
}
