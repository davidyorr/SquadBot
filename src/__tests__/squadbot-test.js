const chai = require('chai');
const asserttype = require('chai-asserttype');
const expect = chai.expect;
chai.use(asserttype);

const SquadBot = require('../squadbot.js')('bot');

describe('SquadBot', () => {
  describe('.Commands', () => {
    it('each command should contain a description that is a string', () => {
      Object.keys(SquadBot.Commands).forEach( commandName => {
        const command = SquadBot.Commands[commandName];
        const message = `SquadBot.Commands.${commandName}`;
        expect(command, message).to.have.property('description');
        expect(command.description, message).to.be.string();
      });
    });
    it('each command should contain an execute function', () => {
      Object.keys(SquadBot.Commands).forEach( commandName => {
        const command = SquadBot.Commands[commandName];
        const message = `SquadBot.Commands.${commandName}`;
        expect(command, message).to.have.property('execute');
        expect(command.execute, message).to.be.function();
      });
    });
  });
});
