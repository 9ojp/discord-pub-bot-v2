const { PermissionFlagsBits, ButtonStyle, ButtonBuilder, ActionRowBuilder, Events, EmbedBuilder, StringSelectMenuBuilder, ComponentType, codeBlock } = require("discord.js");
const beş_config = require("../../../beş_config")
const client = global.client;
const db = client.db;
const moment = require("moment");
require("moment-duration-format")
moment.locale("tr");
const messageUserChannel = require("../../beş_schemas/messageChannelsSchema");
const voiceUserChannel = require("../../beş_schemas/voiceChannelsSchema");
const messageUser = require("../../beş_schemas/messagesSchema");
const voiceUser = require("../../beş_schemas/voicesSchema");
const voiceUserParent = require("../../beş_schemas/voiceParentsSchema");
const invite = require("../../beş_schemas/invitesSchema");
module.exports = {
    name: "invite",
    usage: "invite [@9ojp / ID]",
    category: "stat",
    aliases: ["davet", "davetim", "invites", "davetlerim"],
    execute: async (client, message, args, beş_embed) => {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        let davet = await invite.findOne({ guildId: message.guild.id, userId: member.user.id });
      beş_embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 2048 }))
      beş_embed.setDescription(`> **${member.user.toString()} Kullanıcısının Davet Verileri;**\n \n`)
      .addFields(
      { name: `${client.emoji("emote_invite") !== null ? client.emoji("emote_invite"):"📩"} • **Toplam Davet**`,  value: codeBlock("js",`Gerçek: ${davet ? davet.Regular : 0}, Sahte: ${davet ? davet.Fake :0}, Ayrılan: ${davet ? davet.Left : 0}, Bonus: ${davet ? davet.Bonus : 0}`)}
      )
      return message.reply({embeds: [beş_embed]})

    }
}
