const { PermissionFlagsBits, ButtonStyle, ButtonBuilder, ActionRowBuilder, Events, EmbedBuilder } = require("discord.js");
const beş_config = require("../../../beş_config")
const client = global.client;
const db = client.db;
module.exports = {
    name: "cihaz",
    usage: "cihaz [@9ojp / ID]",
    category:"genel",
    aliases: ["chz", "durum", "client"],
    execute: async (client, message, args, beş_embed) => {
        let user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if(!user) return message.reply({ embeds: [beş_embed.setDescription(`> **Geçerli Bir User Belirt!**`)] }).sil(5);
        if (user.presence == null) return message.reply({ embeds: [beş_embed.setDescription(`> **Belirtilen User Ofline Durumda Olduğu İçin Kontrol Edilemiyor!**`)] }).sil(5);
        let dev = Object.keys(user.presence.clientStatus)
        let tür = {desktop: "(💻) Bilgisayar / Uygulama",mobile: "(📱) Mobil / Uygulama",web: "(🌐) Web Tarayıcı / İnternet"}
        let tür2 = {online: "(🟢) Çevrimiçi",dnd: "(🔴) Rahatsız Etme",idle: "(🟡) Boşta",offline:"(⚪) Çevrimdışı"}
        message.reply({ embeds: [beş_embed.setDescription(`> **${user} Kullanıcısının Aktif Cihazları!**\n**Durum; \`${tür2[user.presence.status]}\`**\n**Cihazlar; ${dev.map(x => `\`${tür[x]}\``).join("\n")}**`).setThumbnail(user.user.avatarURL({dynamic:true}))] });
    }
}
