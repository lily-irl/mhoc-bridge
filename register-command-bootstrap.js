const { REST, Routes } = require('discord.js');
const config = require('./credentials.json');
const thread = require('./src/thread');

const rest = new REST({ version: '10' }).setToken(config.DISCORD.token);

(async () => {
    try {
        console.log('Registering the /thread command.');
        const data = await rest.put(
            Routes.applicationCommands(config.DISCORD.clientId),
            { body: [thread.data.toJSON()] }
        );
        console.log(`Registered ${data.length} commands.`)
    } catch (err) {
        console.error(err);
    }
})();