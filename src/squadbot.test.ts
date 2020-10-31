import { SquadBot } from "./squadbot";

import { MockDiscordJs } from "../jest/mock/discordjs";

describe("SquadBot", () => {
  let mockDiscordJs: MockDiscordJs;

  beforeEach(() => {
    mockDiscordJs = new MockDiscordJs();
    new SquadBot(mockDiscordJs.Client, "");
  });

  describe("ready", () => {
    it("prints ready message to console", () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      mockDiscordJs.Client.emit("ready");
      expect(console.log).toHaveBeenCalledWith("I am ready!");
      console.log = originalConsoleLog;
    });
  });

  describe("message", () => {
    it("echoes a message if two different users have posted identical messages back to back", () => {
      const userA = mockDiscordJs.mockUser({
        id: "mock-user-a-id",
      });
      const userB = mockDiscordJs.mockUser({
        id: "mock-user-b-id",
      });
      const messageA = mockDiscordJs.mockMessage({
        author: userA,
        content: "echo me",
      });
      const messageB = mockDiscordJs.mockMessage({
        author: userB,
        content: "echo me",
      });

      // just emitting the messages doesn't add them to the cache
      mockDiscordJs.addMessageToCache(messageA);
      mockDiscordJs.addMessageToCache(messageB);

      const spy = jest.spyOn(mockDiscordJs.TextChannel, "send");

      mockDiscordJs.Client.emit("message", messageB);

      expect(spy).toHaveBeenCalledWith("echo me");
    });

    describe("!champdmg", () => {
      it("notifies the user if there is no summoner name", () => {
        const user = mockDiscordJs.mockUser({
          id: "mock-user-id",
        });
        const message = mockDiscordJs.mockMessage({
          author: user,
          content: "!champdmg",
        });

        const spy = jest.spyOn(mockDiscordJs.TextChannel, "send");

        mockDiscordJs.Client.emit("message", message);

        expect(spy).toHaveBeenCalledWith(
          'missing summoner name: "!champdmg SummonerName"'
        );
      });
    });

    describe("!gold", () => {
      it("notifies the user if there is no summoner name", () => {
        const user = mockDiscordJs.mockUser({
          id: "mock-user-id",
        });
        const message = mockDiscordJs.mockMessage({
          author: user,
          content: "!gold",
        });

        const spy = jest.spyOn(mockDiscordJs.TextChannel, "send");

        mockDiscordJs.Client.emit("message", message);

        expect(spy).toHaveBeenCalledWith(
          'missing summoner name: "!gold SummonerName"'
        );
      });
    });
  });

  describe("messageReactionAdd", () => {
    it("echoes certain standard emojis", () => {
      const messageReaction = mockDiscordJs.mockMessageReaction({
        name: "😩",
      });

      const spy = jest.spyOn(messageReaction.message, "react");

      mockDiscordJs.Client.emit(
        "messageReactionAdd" as string,
        messageReaction
      );

      expect(spy).toHaveBeenCalledWith("😩");
    });

    it("echoes certain custom emojis", () => {
      const messageReaction = mockDiscordJs.mockMessageReaction({
        name: "kiwicat",
        id: "1234",
      });

      const spy = jest.spyOn(messageReaction.message, "react");

      mockDiscordJs.Client.emit(
        "messageReactionAdd" as string,
        messageReaction
      );

      expect(spy).toHaveBeenCalledWith("1234");
    });
  });
});
