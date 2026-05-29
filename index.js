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

  // DONATE
  new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Donate vào quỹ')
    .addStringOption(option =>
      option.setName('nguoigui')
        .setDescription('Tên người donate')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('money')
        .setDescription('Số tiền donate')
        .setRequired(true)
    ),

  // QUỸ
  new SlashCommandBuilder()
    .setName('quy')
    .setDescription('Xem tổng quỹ'),

  // TOP DONATE
  new SlashCommandBuilder()
    .setName('topdonate')
    .setDescription('Xem top donate'),

  // TRỪ QUỸ
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
    ),

  // SỬA DONATE
  new SlashCommandBuilder()
    .setName('suadonate')
    .setDescription('Sửa số tiền donate của người chơi')
    .addStringOption(option =>
      option.setName('nguoigui')
        .setDescription('Tên người donate')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('money')
        .setDescription('Số tiền mới')
        .setRequired(true)
    ),

  // RESET QUỸ
  new SlashCommandBuilder()
    .setName('resetquy')
    .setDescription('Reset toàn bộ quỹ và donate'),

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

    const senderName = interaction.options.getString('nguoigui');
    const money = interaction.options.getInteger('money');

    totalMoney += money;

    if (!donors[senderName]) {
      donors[senderName] = 0;
    }

    donors[senderName] += money;

    const embed = new EmbedBuilder()
      .setTitle('💰 Donate Thành Công')
      .setDescription(
        `👤 Người gửi: **${senderName}**\n` +
        `💵 Số tiền: ${money.toLocaleString()}đ\n\n` +
        `🏦 Tổng quỹ hiện tại: ${totalMoney.toLocaleString()}đ\n\n` +
        `❤️ Cảm ơn bạn đã đóng góp!`
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
        `💰 Tổng quỹ hiện tại: ${totalMoney.toLocaleString()}đ`
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
      text += `${i + 1}. ${d[0]} — ${d[1].toLocaleString()}đ\n`;
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

    if (money > totalMoney) {

      return interaction.reply({
        content: '❌ Quỹ không đủ tiền!',
        ephemeral: true
      });

    }

    totalMoney -= money;

    const embed = new EmbedBuilder()
      .setTitle('💸 Đã Trừ Tiền Khỏi Quỹ')
      .setDescription(
        `👤 Người sử dụng: ${interaction.user}\n` +
        `💵 Số tiền: ${money.toLocaleString()}đ\n` +
        `📝 Lý do: ${reason}\n\n` +
        `🏦 Quỹ còn lại: ${totalMoney.toLocaleString()}đ`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // SỬA DONATE
  if (interaction.commandName === 'suadonate') {

    const senderName = interaction.options.getString('nguoigui');
    const newMoney = interaction.options.getInteger('money');

    const oldMoney = donors[senderName] || 0;

    totalMoney = totalMoney - oldMoney + newMoney;

    donors[senderName] = newMoney;

    const embed = new EmbedBuilder()
      .setTitle('✏️ Đã Sửa Donate')
      .setDescription(
        `👤 Người donate: **${senderName}**\n` +
        `💵 Tiền cũ: ${oldMoney.toLocaleString()}đ\n` +
        `💰 Tiền mới: ${newMoney.toLocaleString()}đ\n\n` +
        `🏦 Tổng quỹ hiện tại: ${totalMoney.toLocaleString()}đ`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // RESET QUỸ
  if (interaction.commandName === 'resetquy') {

    totalMoney = 0;
    donors = {};

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Reset Quỹ Thành Công')
      .setDescription(
        `💸 Tổng quỹ đã về 0đ\n` +
        `📉 Bảng xếp hạng donate đã được xóa`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

});

client.login(TOKEN);
