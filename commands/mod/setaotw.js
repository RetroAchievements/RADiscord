const logger = require('pino')({
  useLevelLabels: true,
  timestamp: () => `,"time":"${new Date()}"`,
});

const { ROLE_MOD, ROLE_AOTW } = process.env;
const Command = require('../../structures/Command.js');

module.exports = class SetAotwCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setaotw',
      group: 'mod',
      guildOnly: true,
      memberName: 'setaotw',
      description: 'Offers AotW Winner role to designated user.',
      examples: ['!setaotw @user'],
      args: [
        {
          key: 'username',
          prompt: 'Who would you like to give the role to?',
          type: 'user',
        },
      ],
    });
  }

  async run(msg, { username }) {
    const callerIsMod = await msg.member.roles.has(ROLE_MOD);
    if (!callerIsMod) {
      return msg.reply('Only moderators can use such command.');
    }

    const aotwRole = await msg.guild.roles.get(ROLE_AOTW);
    if (!aotwRole) {
      return msg.reply(
        ":warning: Looks like there's no role for AotW winners in this server (or maybe I just don't know the role ID).",
      );
    }

    const user = await msg.guild.fetchMember(username);
    // no need to check for success, the args config in the constructor guarantees that 'username' is valid.

    const userHasAotw = await user.roles.has(ROLE_AOTW);
    if (userHasAotw) {
      return msg.reply(`The user **${user.displayName}** already has the **${aotwRole.name}** role.`);
    }

    return user.addRole(aotwRole)
      .then(() => {
        logger.info(
          { msg: `@Mod ${msg.member.displayName} added ${aotwRole.name} to ${user.displayName}` },
        );
        msg.say(
          `:trophy: Congratulations **${user.displayName}**. You have been awarded **${aotwRole.name}** role!`,
        );
      })
      .catch((err) => {
        logger.error(err);
        msg.reply(`I wasn't able to give the **${aotwRole.name}** role to **${user.displayName}**... :frowning2:`);
      });
  }
};
