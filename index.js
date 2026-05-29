const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let totalMoney = 0;
let donors = {};

const commands = [

  new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Donate vào quỹ')
    .addIntegerOption(option =>
      option.setName('money')
        .setDescription('Số tiền donate')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('quy')
    .setDescription('Xem tổng quỹ'),

  new SlashCommandBuilder()
    .setName('topdonate')
    .setDescription('Xem top donate'),

  new SlashCommandBuilder()
    .setName('truquy')
    .setDescription('Trừ tiền khỏi quỹ')
    .addIntegerOption(option =>
      option.setName('money')
        .setDescription('Số tiền cần trừ')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do sử dụng')
        .setRequired(true)
    )

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {

    console.log('Loading slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        GUILD_ID
      ),
      { body: commands }
    );

    console.log('Slash commands loaded.');

  } catch (error) {
    console.log(error);
  }
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  // DONATE
  if (interaction.commandName === 'donate') {

    const money = interaction.options.getInteger('money');

    totalMoney += money;

    const userId = interaction.user.id;

    if (!donors[userId]) {
      donors[userId] = 0;
    }

    donors[userId] += money;

    const embed = new EmbedBuilder()
      .setTitle('💰 Donate Thành Công')
      .setDescription(
        `👤 Người donate: ${interaction.user}\n` +
        `💵 Số tiền: ${money.toLocaleString()}đ\n\n` +
        `🏦 Tổng quỹ hiện tại:\n${totalMoney.toLocaleString()}đ`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // QUỸ
  if (interaction.commandName === 'quy') {

    const embed = new EmbedBuilder()
      .setTitle('🏦 Quỹ Clan')
      .setDescription(
        `💰 Tổng quỹ hiện tại:\n${totalMoney.toLocaleString()}đ`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // TOP DONATE
  if (interaction.commandName === 'topdonate') {

    const sorted = Object.entries(donors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let text = '';

    sorted.forEach((d, i) => {
      text += `${i + 1}. <@${d[0]}> — ${d[1].toLocaleString()}đ\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Top Donate')
      .setDescription(
        text || 'Chưa có donate'
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // TRỪ QUỸ
  if (interaction.commandName === 'truquy') {

    const money = interaction.options.getInteger('money');
    const reason = interaction.options.getString('reason');

    totalMoney -= money;

    if (totalMoney < 0) {
      totalMoney = 0;
    }

    const embed = new EmbedBuilder()
      .setTitle('💸 Đã Trừ Tiền Khỏi Quỹ')
      .setDescription(
        `👤 Người sử dụng: ${interaction.user}\n` +
        `💵 Số tiền: ${money.toLocaleString()}đ\n` +
        `📝 Lý do: ${reason}\n\n` +
        `🏦 Quỹ còn lại:\n${totalMoney.toLocaleString()}đ`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

});

client.login(TOKEN);
