const { Client, Events, GatewayIntentBits } = require('discord.js');
const snoowrap = require('snoowrap');
const config = require('../credentials.json');
const thread = require('./thread');

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers ]});
const redditClient = new snoowrap({
    userAgent: 'MHoC Bridge (/u/lily-irl) (v' + require('../package.json').version + ')',
    clientId: config.REDDIT.clientId,
    clientSecret: config.REDDIT.clientSecret,
    username: config.REDDIT.username,
    password: config.REDDIT.password
});

discordClient.once(Events.ClientReady, c => {
    console.log('MHoC Bridge is ready to go!');
});

discordClient.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'thread')
        thread.execute(interaction, redditClient, discordClient);
})

discordClient.login(config.DISCORD.token);