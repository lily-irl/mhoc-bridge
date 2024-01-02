const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ThreadAutoArchiveDuration, ChannelType } = require('discord.js');
const database = require('./database');
const startMessage = require('./startMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thread')
        .setDescription('Base command for the MHoC Bridge')
        .addSubcommand(subcommand => {
            return subcommand
                .setName('create')
                .setDescription('Creates a new thread for a reading')
                .addChannelOption(option => {
                    return option
                        .setName('forum')
                        .setDescription('The forum channel to create a new thread under')
                        .addChannelTypes(ChannelType.GuildForum)
                        .setRequired(true);
                })
                .addStringOption(option => {
                    return option
                        .setName('code')
                        .setDescription('The reddit snowflake of the reading')
                        .setRequired(true);
                });
        })
        .addSubcommand(subcommand => {
            return subcommand
                .setName('commit')
                .setDescription('Write the comments in this thread to reddit');
        })
        .addSubcommand(subcommand => {
            return subcommand
                .setName('lock')
                .setDescription('This debate has finished: lock this thread');
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, redditClient, discordClient) {
        if (interaction.options.getSubcommand() === 'create') {
            const uid = interaction.options.getString('code');
            if (database.has(uid)) {
                const existing = database.get(uid);
                return interaction.reply({ content: `there's already a thread for this submission at <#${existing.thread}>!` })
            }
            redditClient.getSubmission(uid).fetch()
                .then(submission => {
                    interaction.options.getChannel('forum').threads.create({
                        name: submission.title,
                        autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
                        reason: `[${uid}] ${interaction.user.username} created thread`,
                        message: { content: startMessage(submission.title, uid) }
                    })
                    .then(threadChannel => {
                        database.set(uid, {
                            thread: threadChannel.id,
                            lastMessageWritten: null,
                            name: submission.title
                        });
                        return interaction.reply({ content: `created <#${threadChannel.id}> for [${submission.title}](https://redd.it/${uid})` });
                    })
                    .catch(err => {
                        if (err) {
                            console.log(err)
                            return interaction.reply({ content: 'couldn\'t create a thread: do I have adequate permissions?' });
                        }
                    })
                })
                .catch(err => {
                    if (err) return interaction.reply({ content: 'a reddit error occurred: does https://redd.it/' + uid + ' not exist, or am I ratelimited?' });
                })
        }
        if (interaction.options.getSubcommand() === 'commit') {
            await interaction.deferReply();
            const channel = interaction.channel;
            let id, thread;
            for (let [key, post] of Object.entries(database.read())) {
                if (post.thread === interaction.channel.id) {
                    thread = post;
                    id = key;
                }
            }
            if (!thread) {
                return interaction.reply({ content: 'this channel isn\'t associated with any active thread' });
            }
            const messagesToWrite = [];
            const fetchOptions = thread.lastMessageWritten ? { after: thread.lastMessageWritten } : null;
            interaction.channel.messages.fetch(fetchOptions)
                .then(async messages => {
                    let lastAuthor, lastMessage = '', firstTimestamp;
                    messages.reverse().forEach((message, id) => {
                        if (message.author.id === interaction.client.user.id) {
                            return;
                        }
                        if (message.author.username === lastAuthor) {
                            lastMessage += '\n\n' + message.content;
                            return;
                        } else {
                            firstTimestamp = message.createdTimestamp;
                        }
                        if (lastAuthor) {
                            messagesToWrite.push({
                                author: lastAuthor,
                                message: lastMessage,
                                timestamp: new Date(Number(firstTimestamp)).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'Europe/London'})
                            });
                        }
                            
                        lastAuthor = message.author.username;
                        lastMessage = message.content;
                    });
                    if (lastAuthor) {
                        messagesToWrite.push({
                            author: lastAuthor,
                            message: lastMessage,
                            timestamp: new Date(Number(firstTimestamp)).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'Europe/London'})
                        });
                    }
                    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
                    for (let messageToWrite of messagesToWrite) {
                        messageToWrite.message = `**${messageToWrite.author}** *(${messageToWrite.timestamp})*\n***\n\n${messageToWrite.message}`;
                        if (messageToWrite.message.length <= 10000) {
                            redditClient.getSubmission(id).fetch().then(submission => {
                                submission.reply(messageToWrite.message);
                            });
                        } else {
                            const chunks = messageToWrite.message.match(/.{1,10000}/g);
                            const replyToPromise = promise => {
                                promise.then(reply => {
                                    if (chunks.length > 0) {
                                        const nextMessage = chunks.shift();
                                        replyToPromise(reply.reply(nextMessage));
                                    }
                                });
                            }
                            redditClient.getSubmission(id).fetch().then(submission => {
                                const nextMessage = chunks.shift();
                                replyToPromise(submission.reply(nextMessage));
                            });
                        }
                        await delay(6000);
                    }
                    thread.lastMessageWritten = messages.last().id;
                    database.set(id, thread);
                    return interaction.followUp({ content: 'Wrote ' + messagesToWrite.length + ' messages.' });
                })
        }
        if (interaction.options.getSubcommand() === 'lock') {
            let id, thread;
            for (let [key, post] of Object.entries(database.read())) {
                if (post.thread === interaction.channel.id) {
                    thread = post;
                    id = key;
                }
            }
            if (!thread) {
                return interaction.reply({ content: 'this channel isn\'t associated with any active thread' });
            }
            interaction.channel.setLocked(true)
                .then(async (lockedChannel) => {
                    const data = database.read();
                    delete data[id];
                    database.write(data);
                    await interaction.reply(':lock: Locked the thread!');
                    lockedChannel.setArchived(true);
                });
        }
    }
}
