const logger = require('pino')({
  useLevelLabels: true,
  timestamp: () => `,"time":"${new Date()}"`,
});

const { ROLE_MOD, AOTW_ROLE_ID } = process.env;
const Command = require('../../structures/Command.js');

module.exports = class RemoveAOTWCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'removeaotw',
      group: 'mod',
      memberName: 'removeaotw',
      aliases: ['aotwremove'],
      description: 'Removes the AOTW Winner role from designated user.',
      examples:['!removeaotw @user', '!removeaotw'],
      args: [
        {
          key: 'username',
          prompt: 'Who would you like to have the role removed from?',
          type: 'user',
          default: '',
        },
      ],
    });
  }

  async run(msg, { username }) {
    // check if AOTW WINNER role exists on the channel
    const aotwRole = await msg.guild.roles.get(AOTW_ROLE_ID);
    // check if requesting user is mod user
    const isMod = await msg.member.roles.has(ROLE_MOD);

    if(!isMod){
      return;
    }

    if (username !== '') {
      // check if the requested user to be given role exists
      const user = await msg.guild.fetchMember(username);

      const hasAOTW = await user.roles.has(AOTW_ROLE_ID);

      // if the the user has the role, if not do nothing
      if (!hasAOTW) {
        return;
      }

      // if all checks pass give the role to the user
      if (user && aotwRole) {
        // remove role from the user
        await user.removeRole(aotwRole).catch(logger.error);
        logger.info({ msg: `@Mod ${msg.member.displayName} removed ${aotwRole.name} from ${user.displayName}` });
        msg.say(`**${aotwRole.name}** has been removed from user **${user.displayName}**.`);
      }
    } else {
      await msg.channel.send('Are you sure you want to remove from all users? Please confirm with `yes` or `y` if so.');

      const filter = (res) => res.content.includes('yes') || res.content.toLowerCase() === 'y';

      const msgs = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 3000,
      });

      if (msgs.size) {
        const users = msg.guild.members;
        let aotwUsers = 0;
        users.forEach(async (user) => {
          if (user.roles.has(AOTW_ROLE_ID)) {
            aotwUsers += 1;
            await user.removeRole(aotwRole);
          }
        });
        logger.info({ msg: `@Mod ${msg.member.displayName} removed ${aotwRole.name} from ${aotwUsers} users` });
        msg.say(`**${aotwRole.name}** role has been removed from **${aotwUsers}** users.`);
      } else {
        msg.say('Cancelled command.');
      }
    }
  }
};
