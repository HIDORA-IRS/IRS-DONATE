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

// ======================
// DATA
// ======================

let totalMoney = 0;

// lưu từng lần donate
let donations = [];

// id donate tự tăng
let donationId = 1;

// ======================
// COMMANDS
// ======================

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

  // LỊCH SỬ DONATE
  new SlashCommandBuilder()
    .setName('lichsudonate')
    .setDescription('Xem lịch sử donate'),

  // SỬA DONATE
  new SlashCommandBuilder()
    .setName('suadonate')
    .setDescription('Sửa 1 lần donate theo ID')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('ID donate')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('money')
        .setDescription('Số tiền mới')
        .setRequired(true)
    ),

  // XÓA DONATE
  new SlashCommandBuilder()
    .setName('xoadonate')
    .setDescription('Xóa 1 lần donate')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('ID donate')
        .setRequired(true)
    ),

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

  // RESET QUỸ
  new SlashCommandBuilder()
    .setName('resetquy')
    .setDescription('Reset toàn bộ quỹ'),

].map(command => command.toJSON());

// ======================
// LOAD COMMANDS
// ======================

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

// ======================
// READY
// ======================

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ======================
// INTERACTION
// ======================

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  // ======================
  // DONATE
  // ======================

  if (interaction.commandName === 'donate') {

    const senderName = interaction.options.getString('nguoigui');
    const money = interaction.options.getInteger('money');

    const donateData = {
      id: donationId,
      name: senderName,
      money: money
    };

    donations.push(donateData);

    totalMoney += money;

    donationId++;

    const embed = new EmbedBuilder()
      .setTitle('💰 Donate Thành Công')
      .setDescription(
        `🆔 ID Donate: ${donateData.id}\n` +
        `👤 Người gửi: ${senderName}\n` +
        `💵 Số tiền: ${money.toLocaleString()}đ\n\n` +
        `🏦 Tổng quỹ hiện tại: ${totalMoney.toLocaleString()}đ`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // ======================
  // QUỸ
  // ======================

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

  // ======================
  // TOP DONATE
  // ======================

  if (interaction.commandName === 'topdonate') {

    const totals = {};

    donations.forEach(d => {

      if (!totals[d.name]) {
        totals[d.name] = 0;
      }

      totals[d.name] += d.money;

    });

    const sorted = Object.entries(totals)
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

  // ======================
  // LỊCH SỬ DONATE
  // ======================

  if (interaction.commandName === 'lichsudonate') {

    let text = '';

    donations.slice(-10).reverse().forEach(d => {

      text +=
        `🆔 ${d.id} | ${d.name} | ${d.money.toLocaleString()}đ\n`;

    });

    const embed = new EmbedBuilder()
      .setTitle('📜 Lịch Sử Donate')
      .setDescription(
        text || 'Chưa có donate'
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // ======================
  // SỬA DONATE
  // ======================

  if (interaction.commandName === 'suadonate') {

    const id = interaction.options.getInteger('id');
    const newMoney = interaction.options.getInteger('money');

    const donate = donations.find(d => d.id === id);

    if (!donate) {

      return interaction.reply({
        content: '❌ Không tìm thấy ID donate',
        ephemeral: true
      });

    }

    const oldMoney = donate.money;

    donate.money = newMoney;

    totalMoney = totalMoney - oldMoney + newMoney;

    const embed = new EmbedBuilder()
      .setTitle('✏️ Đã Sửa Donate')
      .setDescription(
        `🆔 ID: ${id}\n` +
        `👤 Người donate: ${donate.name}\n` +
        `💵 Tiền cũ: ${oldMoney.toLocaleString()}đ\n` +
        `💰 Tiền mới: ${newMoney.toLocaleString()}đ\n\n` +
        `🏦 Tổng quỹ hiện tại: ${totalMoney.toLocaleString()}đ`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // ======================
  // XÓA DONATE
  // ======================

  if (interaction.commandName === 'xoadonate') {

    const id = interaction.options.getInteger('id');

    const donate = donations.find(d => d.id === id);

    if (!donate) {

      return interaction.reply({
        content: '❌ Không tìm thấy ID donate',
        ephemeral: true
      });

    }

    totalMoney -= donate.money;

    donations = donations.filter(d => d.id !== id);

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Đã Xóa Donate')
      .setDescription(
        `🆔 ID: ${id}\n` +
        `👤 Người donate: ${donate.name}\n` +
        `💵 Số tiền đã xóa: ${donate.money.toLocaleString()}đ\n\n` +
        `🏦 Tổng quỹ hiện tại: ${totalMoney.toLocaleString()}đ`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

  // ======================
  // TRỪ QUỸ
  // ======================

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

  // ======================
  // RESET QUỸ
  // ======================

  if (interaction.commandName === 'resetquy') {

    totalMoney = 0;
    donations = [];
    donationId = 1;

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Reset Quỹ Thành Công')
      .setDescription(
        `💸 Tổng quỹ đã về 0đ\n` +
        `📉 Toàn bộ lịch sử donate đã bị xóa`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }

});

// ======================
// LOGIN
// ======================

client.login(TOKEN);
