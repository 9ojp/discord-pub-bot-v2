const { WebhookClient, EmbedBuilder, AuditLogEvent, Events, Collection, ChannelType, PermissionFlagsBits } = require('discord.js')
let { BEŞ } = require('./beş_client');
let conf = require('./beş_config');
const { scheduleJob } = require("node-schedule");
const { YamlDatabase } = require('five.db');
const { readdir } = require('fs');
let { log } = console;
const { codeBlock } = require('@discordjs/formatters');


let mainShield = global.mainShield = new BEŞ();
let roleShield = new BEŞ();
let channelShield = new BEŞ();
let otherShield = new BEŞ()
const db = global.db = new YamlDatabase();

const webHook = new WebhookClient({ url: conf.WebHookURL });
async function send(message, entry) {
    let beş_embed = new EmbedBuilder()
        .setColor("#2f3136")
        .setThumbnail(entry.avatarURL({ dynamic: true }))
        .setDescription(`${message}`)
    return webHook.send({ embeds: [beş_embed] }).catch(err => {
        console.err("Webhook Gönderiminde Bir Hata Gerçekleşti!")
    })
}

async function mainBots(id) {
    if (id == mainShield.user.id || id == roleShield.user.id || id == otherShield.user.id || id == channelShield.user.id) return true;
    return false;
}

async function checkWhitelist(id) {
    let member = mainShield.guilds.cache.get(conf.guildID).members.cache.get(id);
    let data = await db.get(`whitelist_${conf.guildID}`) || [];
    if (member && data.some(id => member.id == id) || data.some(id => member.roles.cache.has(id))) return true;
    return false;
}

let perms = conf.staffPerms;
async function punish(client, member, type) {
    if (!["kick", "ban", "ytçek", "jail"].some(bes => type == bes)) return console.error("Punish İşlemi Yanlış Belirtilmiş!\nytçek,ban,jail veya kick Olarak Giriniz!")
    let guild = client.guilds.cache.get(conf.guildID);
    let user = guild.members.cache.get(member);
    switch (type) {
        case 'jail':
            await user.roles.cache.has(guild.roles.premiumSubscriberRole ? message.guild.roles.premiumSubscriberRole.id : "5") ? user.roles.set([message.guild.roles.premiumSubscriberRole.id, ...conf.jailRoles]) : user.roles.set([...conf.jailRoles])
            log(`{PUNISH} ${user.user.tag} Kullanıcısına [JAIL] İşlemi Uygulandı!`)
            break;
        case 'ban':
            user.ban()
            log(`{PUNISH} ${user.user.tag} Kullanıcısına [BAN] İşlemi Uygulandı!`)
            break;
        case 'kick':
            user.kick()
            log(`{PUNISH} ${user.user.tag} Kullanıcısına [KICK] İşlemi Uygulandı!`)
            break;
        case 'ytçek':
            await user.roles.remove(user.roles.cache.filter((bes) => bes.editable && bes.name !== "@everyone" && perms.some(perm => bes.permissions.has(perm))).map((bes) => bes.id));
            log(`{PUNISH} ${user.user.tag} Kullanıcısına [YETKİ ÇEKME] İşlemi Uygulandı!`)
            break;
    }

}

const commands = mainShield.commands = new Collection();
const aliases = mainShield.aliases = new Collection();
readdir("./beş_commands/", (err, files) => {
    if (err) console.error(err)
    files.forEach(f => {
        readdir("./beş_commands/" + f, (err2, files2) => {
            if (err2) console.log(err2)
            files2.forEach(file => {
                let beş_prop = require(`./beş_commands/${f}/` + file);
                console.log(`🧮 [9OJP - COMMANDS] ${beş_prop.name} Yüklendi!`);
                commands.set(beş_prop.name, beş_prop);
                beş_prop.aliases.forEach(alias => { aliases.set(alias, beş_prop.name); });
            });
        });
    });
});

mainShield.on(Events.MessageCreate, async (message) => {
    if (conf.prefix && !message.content.startsWith(conf.prefix)) return;
    const args = message.content.slice(1).trim().split(/ +/g);
    const commands = args.shift().toLowerCase();
    const cmd = mainShield.commands.get(commands) || [...mainShield.commands.values()].find((e) => e.aliases && e.aliases.includes(commands));
    const beş_embed = new EmbedBuilder()
        .setColor(`#2f3136`)
        .setAuthor({ name: message.member.displayName, iconURL: message.author.avatarURL({ dynamic: true, size: 2048 }) })
        .setFooter({ text: conf && conf.presence.length > 0 ? conf.presence : "9ojp Was Here", iconURL: message.author.avatarURL({ dynamic: true, size: 2048 }) })
    if (cmd) {
        cmd.execute(mainShield, message, args, beş_embed);
    }
})

mainShield.on(Events.ClientReady, async () => {
    log(`${mainShield.user.tag} Aktif!`)
})
mainShield.login(conf.mainShield)

roleShield.on(Events.ClientReady, async () => {
    log(`${roleShield.user.tag} Aktif!`)
})
roleShield.login(conf.roleShield)

channelShield.on(Events.ClientReady, async () => {
    log(`${channelShield.user.tag} Aktif!`)
})
channelShield.login(conf.channelShield)

otherShield.on(Events.ClientReady, async () => {
    log(`${otherShield.user.tag} Aktif!`)
})
otherShield.login(conf.otherShield)

roleShield.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.roles.cache.size != newMember.roles.cache.size) {
        let logs = await oldMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate });
        let entry = logs.entries.first();
        if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldMember.guild.ownerId) return;
        if (await checkWhitelist(entry.executor.id)) {
            return await send(`
            > **${entry.executor} Bir Üyenin Rolünü Güncelledi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
        
            > **Rol Veren/Alan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
            > **İşlem Uygulanan Kişi: ${newMember.user} \`(${newMember.id})\`**
            > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
            > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
        }
        let member = await oldMember.guild.members.fetch(entry.executor.id);
        let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
        if (member && member.bannable) { await punish(roleShield, member.id, conf.Process.roleAddRemove) }
        newMember.roles.set(oldMember.roles.cache.map(r => r.id));
        await send(`
    > **${entry.executor} Bir Üyenin Rolünü Güncelledi! İşlem Eski Haline Getirildi Ve ${response}**

    > **Rol Veren/Alan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
    > **İşlem Uygulanan Kişi: ${newMember.user} \`(${newMember.id})\`**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
});

roleShield.on(Events.GuildRoleDelete, async (oldRole) => {
    let logs = await oldRole.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldRole.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
           > **${entry.executor} Bir Rol Sildi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**

           > **Database Üzerinden Geri Açmak İçin;**
           ${codeBlock("fix", `${conf.prefix}rol-kur ${oldRole.id}`)}
       
           > **Rolü Silen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
           > **Silinen Rol: ${oldRole.name} \`(${oldRole.id})\`**
           > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
           > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldRole.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(roleShield, member.id, conf.Process.roleDelete) }

    await oldRole.guild.roles.create({
        name: oldRole.name,
        color: oldRole.color,
        hoist: oldRole.hoist,
        permissions: oldRole.permissions,
        position: oldRole.position,
        mentionable: oldRole.mentionable,
        reason: "Shield ~ Silinen Rol Geri Açıldı!"
    });

    await send(`
    > **${entry.executor} Bir Rol Sildi! ${response}**

    > **Database Üzerinden Geri Açmak İçin;**
    ${codeBlock("fix", `${conf.prefix}rol-kur ${oldRole.id}`)}

    > **Rolü Silen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
    > **Silinen Rol: ${oldRole.name} \`(${oldRole.id})\`**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
});


roleShield.on(Events.GuildRoleCreate, async (oldRole) => {
    let logs = await oldRole.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldRole.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
           > **${entry.executor} Bir Rol Açtı! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
           
           > **Rolü Açan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
           > **Açılan Rol: ${oldRole.name} \`(${oldRole.id})\`**
           > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
           > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldRole.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(roleShield, member.id, conf.Process.roleCreate) }
    oldRole.delete({ reason: `Shield ~ İzinsiz Rol Açma İşlemi!` })
    await send(`
> **${entry.executor} Bir Rol Açtı! ${response}**

> **Rolü Açan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Açılan Rol: ${oldRole.name} \`(${oldRole.id})\`**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
});

roleShield.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    let logs = await oldRole.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldRole.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
        > **${entry.executor} Bir Rol Güncellendi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
           
        > **Rolü Düzenliyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
        > **Düzenlenen Rol: ${oldRole.name} \`(${oldRole.id})\`**
        > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
        > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldRole.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(roleShield, member.id, conf.Process.roleUpdate) }
    newRole.edit({
        name: oldRole.name,
        color: oldRole.color,
        hoist: oldRole.hoist,
        permissions: oldRole.permissions,
        position: oldRole.position,
        mentionable: oldRole.mentionable,
        reason: `Shield ~ İzinsiz Rol Güncelleme İşlemi!`
    })

    await send(`
> **${entry.executor} Bir Rol Güncellendi! ${response}**

> **Rolü Düzenliyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Düzenlenen Rol: ${oldRole.name} \`(${oldRole.id})\`**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
});



channelShield.on(Events.ChannelDelete, async (oldChannel, newChannel) => {
    let logs = await oldChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
    let entry = logs.entries.first();
    if (!entry) return;
    let tür = { 2: "Ses Kanalı", 0: "Metin Kanalı", 5: "Duyuru Kanalı", 4: "Kategori", 13: "Sahne", 15: "Forum" }
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldChannel.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
        > **${entry.executor} Bir Kanal Silindi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
           
        > **Database Üzerinden Geri Açmak İçin;**
        ${codeBlock("fix", `${conf.prefix}kanal-kur ${oldChannel.id}`)}

        > **Kanalı Silen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
        > **Silinen Kanal: ${oldChannel.name} \`(${oldChannel.id})\` [\`${tür[oldChannel.type]}\`]**
        > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
        > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldChannel.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(channelShield, member.id, conf.Process.channelDelete) }
    if (oldChannel.type == 4) {
        oldChannel.guild.channels.create({
            name: oldChannel.name,
            rawPosition: oldChannel.rawPosition,
            type: ChannelType.GuildCategory
        })
    } else {
        oldChannel.clone({ parent: oldChannel.parentId })
    }

    await send(`
> **${entry.executor} Bir Kanal Silindi! ${response}**

> **Database Üzerinden Geri Açmak İçin;**
${codeBlock("fix", `${conf.prefix}kanal-kur ${oldChannel.id}`)}

> **Kanalı Silen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Silinen Kanal: ${oldChannel.name} \`(${oldChannel.id})\` [\`${tür[oldChannel.type]}\`]**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
});

channelShield.on(Events.ChannelCreate, async (oldChannel) => {
    let logs = await oldChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
    let entry = logs.entries.first();
    let tür = { 2: "Ses Kanalı", 0: "Metin Kanalı", 5: "Duyuru Kanalı", 4: "Kategori", 13: "Sahne", 15: "Forum" }
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldChannel.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
        > **${entry.executor} Bir Kanal Açıldı! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
           
        > **Kanalı Açan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
        > **Açılan Kanal: ${oldChannel.name} \`(${oldChannel.id})\` [\`${tür[oldChannel.type]}\`]**
        > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
        > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldChannel.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(channelShield, member.id, conf.Process.channelCreate) }

    oldChannel.delete({ reason: `Shield ~ İzinsiz Kanal Açma İşlemi!` })

    await send(`
> **${entry.executor} Bir Kanal Açıldı! ${response}**

> **Kanalı Açan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Açılan Kanal: ${oldChannel.name} \`(${oldChannel.id})\` [\`${tür[oldChannel.type]}\`]**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
});

channelShield.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    let logs = await oldChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate });
    let entry = logs.entries.first();
    let tür = { 2: "Ses Kanalı", 0: "Metin Kanalı", 5: "Duyuru Kanalı", 4: "Kategori", 13: "Sahne", 15: "Forum" }
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldChannel.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
        > **${entry.executor} Bir Kanal Güncellendi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
           
        > **Kanalı Güncelliyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
        > **Güncellenen Kanal: ${oldChannel.name} \`(${oldChannel.id})\` [\`${tür[oldChannel.type]}\`]**
        > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
        > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldChannel.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(channelShield, member.id, conf.Process.channelUpdate) }
    
    oldChannel.guild.channels.edit(newChannel.id,{
        name:oldChannel.name,
        position:oldChannel.position,
        topic:oldChannel.topic,
        nsfw:oldChannel.nsfw,
        parent:oldChannel.parent,
        userLimit:oldChannel.userLimit,
        bitrate:oldChannel.bitrate,
    })


    await send(`
> **${entry.executor} Bir Kanal Güncellendi! ${response}**

> **Kanalı Güncelliyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Güncellenen Kanal: ${oldChannel.name} \`(${oldChannel.id})\` [\`${tür[oldChannel.type]}\`]**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)

});


channelShield.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    let logs = await oldChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelOverwriteUpdate });
    let entry = logs.entries.first();
    let tür = { 2: "Ses Kanalı", 0: "Metin Kanalı", 5: "Duyuru Kanalı", 4: "Kategori", 13: "Sahne", 15: "Forum" }
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldChannel.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
        > **${entry.executor} Bir Kanal İzinleri Güncellendi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
           
        > **Kanalı Güncelliyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
        > **Güncellenen Kanal: ${oldChannel.name} \`(${oldChannel.id})\` [\`${tür[oldChannel.type]}\`]**
        > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
        > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldChannel.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(channelShield, member.id, conf.Process.channelUpdate) }

    await newChannel.permissionOverwrites.set([...oldChannel.permissionOverwrites.cache.values()]);

    await send(`
> **${entry.executor} Bir Kanal İzinleri Güncellendi! ${response}**

> **Kanalı Güncelliyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Güncellenen Kanal: ${oldChannel.name} \`(${oldChannel.id})\` [\`${tür[oldChannel.type]}\`]**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)

});



mainShield.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
        let logs = await oldGuild.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate });
        let entry = logs.entries.first();
        if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldGuild.ownerId) return;
        let member = await oldGuild.guild.members.fetch(entry.executor.id);
        let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
        if (member && member.bannable) { await punish(mainShield, member.id, conf.Process.urlUpdate) }
        await send(`
> **${entry.executor} Kullanıcısı URL Üzerinde İşlem Gerçekleştirdi! ${response}**

> **URL'ye İşlem Yapan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Eski URL: \`${oldGuild.vanityURLCode}\`**
> **Değiştirilen URL: \`${newGuild.vanityURLCode}\`**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
});


mainShield.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    if ((oldGuild.splash !== newGuild.splash) || (oldGuild.iconURL() !== newGuild.iconURL()) || (oldGuild.name !== newGuild.name) || (oldGuild.bannerURL() !== newGuild.bannerURL())) {
        let logs = await oldGuild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate });
        let entry = logs.entries.first();
        if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldGuild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
        > **${entry.executor} Kullanıcısı Sunucu Üzerinde İşlem Gerçekleştirdi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
           
        > **İşlem Yapan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
        > **Eski Sunucu Bilgileri: \`${oldGuild.name}\` ${oldGuild.bannerURL() !== null ? `[Banner](${oldGuild.bannerURL()})` : ""} ${oldGuild.iconURL() !== null ? `[Icon](${oldGuild.iconURL()})` : ""} ${oldGuild.splash !== null ? `[Invite Banner](${oldGuild.splash})` : ""}**
        > **Değişen Sunucu Bilgileri: \`${newGuild.name}\` ${newGuild.bannerURL() !== null ? `[Banner](${newGuild.bannerURL()})` : ""} ${newGuild.iconURL() !== null ? `[Icon](${newGuild.iconURL()})` : ""} ${newGuild.splash !== null ? `[Invite Banner](${newGuild.splash})` : ""}**
        > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
        > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
        let member = await oldGuild.members.fetch(entry.executor.id);
        let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
        if (member && member.bannable) { await punish(mainShield, member.id, conf.Process.serverUpdate) }
        if (oldGuild.iconURL() !== newGuild.iconURL()) newGuild.setIcon(oldGuild.iconURL({ dynamic: true }))
        if (oldGuild.bannerURL() !== newGuild.bannerURL()) newGuild.setBanner(oldGuild.bannerURL({ size: 2048, dynamic: true }))
        if (oldGuild.name !== newGuild.name) newGuild.setName(oldGuild.name)
        if (oldGuild.splash !== newGuild.splash) newGuild.setSplash(oldGuild.splash)
        await send(`
> **${entry.executor} Kullanıcısı Sunucu Üzerinde İşlem Gerçekleştirdi! ${response}**

> **İşlem Yapan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Eski Sunucu Bilgileri: \`${oldGuild.name}\` ${oldGuild.bannerURL() !== null ? `[Banner](${oldGuild.bannerURL()})` : ""} ${oldGuild.iconURL() !== null ? `[Icon](${oldGuild.iconURL()})` : ""} ${oldGuild.splash !== null ? `[Invite Banner](${oldGuild.splash})` : ""}**
> **Değişen Sunucu Bilgileri: \`${newGuild.name}\` ${newGuild.bannerURL() !== null ? `[Banner](${newGuild.bannerURL()})` : ""} ${newGuild.iconURL() !== null ? `[Icon](${newGuild.iconURL()})` : ""} ${newGuild.splash !== null ? `[Invite Banner](${newGuild.splash})` : ""}**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
});
const AntiSpam = require("discord-anti-spam");
const { channel } = require('diagnostics_channel');
const antiSpam = new AntiSpam(conf.antiSpam);
otherShield.on(Events.MessageCreate, async (message) => { antiSpam.message(message); })
otherShield.on(Events.GuildMemberRemove, async (member) => { antiSpam.userleave(member); });

otherShield.on(Events.GuildEmojiCreate, async (emoji) => {
    let logs = await emoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiCreate });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == emoji.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
        > **${entry.executor} Bir Emoji Oluşturdu! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
        
        > **Oluşturan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
        > **Emoji Bilgileri: \`${emoji.name}\` [Emoji URL](${emoji.url})**
        > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
        > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await emoji.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(otherShield, member.id, conf.Process.emojiCreate) }
    emoji.delete();
    await send(`
> **${entry.executor} Bir Emoji Oluşturdu! ${response}**

> **Oluşturan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Emoji Bilgileri: \`${emoji.name}\` [Emoji URL](${emoji.url})**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
})

otherShield.on(Events.GuildEmojiDelete, async (emoji) => {
    let logs = await emoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiDelete });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == emoji.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Emoji Sildi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Silen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Emoji Bilgileri: \`${emoji.name}\` [Emoji URL](${emoji.url})**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await emoji.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(otherShield, member.id, conf.Process.emojiDelete) }
    emoji.guild.emojis.create({ attachment: emoji.url, name: emoji.name })
    await send(`
> **${entry.executor} Bir Emoji Sildi! ${response}**

> **Silen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
> **Emoji Bilgileri: \`${emoji.name}\` [Emoji URL](${emoji.url})**
> **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
> **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
})


otherShield.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
    let logs = await oldEmoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiUpdate });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldEmoji.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Emoji Güncelledi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Güncelleyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Eski Emoji Bilgileri: \`${oldEmoji.name}\` [Emoji URL](${oldEmoji.url})**
   > **Yeni Emoji Bilgileri: \`${newEmoji.name}\` [Emoji URL](${newEmoji.url})**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldEmoji.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(otherShield, member.id, conf.Process.emojiUpdate) }
    newEmoji.edit({ name: oldEmoji.name })
    await send(`
    > **${entry.executor} Bir Emoji Güncelledi! ${response}**

   > **Güncelleyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Eski Emoji Bilgileri: \`${oldEmoji.name}\` [Emoji URL](${oldEmoji.url})**
   > **Yeni Emoji Bilgileri: \`${newEmoji.name}\` [Emoji URL](${newEmoji.url})**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
})

otherShield.on(Events.GuildStickerCreate, async (sticker) => {
    let logs = await sticker.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.StickerCreate });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == sticker.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Sticker Oluşturdu! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Oluşturan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Sticker Bilgileri: \`${sticker.name}\` [Sticker URL](${sticker.url})**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await sticker.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(otherShield, member.id, conf.Process.stickerCreate) }
    sticker.delete()
    await send(`
    > **${entry.executor} Bir Sticker Oluşturdu! ${response}**

    > **Oluşturan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
    > **Sticker Bilgileri: \`${sticker.name}\` [Sticker URL](${sticker.url})**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
})

otherShield.on(Events.GuildStickerDelete, async (sticker) => {
    let logs = await sticker.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.StickerDelete });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == sticker.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Sticker Sildi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Silen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Sticker Bilgileri: \`${sticker.name}\` [Sticker URL](${sticker.url})**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await sticker.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(otherShield, member.id, conf.Process.stickerDelete) }
    sticker.guild.stickers.create({ file: sticker.url, name: sticker.name, tags: sticker.tags, description: sticker.description })
    await send(`
    > **${entry.executor} Bir Sticker Sildi! ${response}**

    > **Silen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
    > **Sticker Bilgileri: \`${sticker.name}\` [Sticker URL](${sticker.url})**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
})

otherShield.on(Events.GuildStickerUpdate, async (oldSticker, newSticker) => {
    let logs = await oldSticker.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.StickerUpdate });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == oldSticker.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Sticker Güncelledi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Güncelleyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Eski Sticker Bilgileri: \`${oldSticker.name}\` [Sticker URL](${oldSticker.url})**
   > **Yeni Sticker Bilgileri: \`${newSticker.name}\` [Sticker URL](${newSticker.url})**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await oldSticker.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(otherShield, member.id, conf.Process.stickerUpdate) }
    newSticker.edit({ name: oldSticker.name, tags: oldSticker.tags, description: oldSticker.description })
    await send(`
    > **${entry.executor} Bir Sticker Güncelledi! ${response}**

    > **Güncelleyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
    > **Eski Sticker Bilgileri: \`${oldSticker.name}\` [Sticker URL](${oldSticker.url})**
    > **Yeni Sticker Bilgileri: \`${newSticker.name}\` [Sticker URL](${newSticker.url})**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
})

otherShield.on(Events.WebhooksUpdate, async (webhook) => {
    let logs = await webhook.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookCreate });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == webhook.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Webhook Oluşturdu! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Oluşturan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let member = await webhook.guild.members.fetch(entry.executor.id);
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(otherShield, member.id, conf.Process.webhookUpdate) }
    const webhooks = await webhook.fetchWebhooks();
    webhooks.forEach(bes => bes.delete().catch(err => { }))
    await send(`
   > **${entry.executor} Bir Webhook Oluşturdu! ${response}**

   > **Oluşturan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
})

otherShield.on(Events.ClientReady, async () => {
    let guild = otherShield.guilds.cache.get(conf.guildID);
    let channel = guild.channels.cache.find(bes => bes.name == "others-log");
    if(!guild || !channel)return
    let besData = db.has(`bes_automoderation`);
    if (!besData) {
        log(`[AUTOMOD] Küfür Filtresi Başarıyla Kuruldu!`)
        guild.autoModerationRules.create({
            name: `9ojp Tarafından!`, creatorId: otherShield.user.id, enabled: true, eventType: 1, triggerType: 1,
            triggerMetadata: { keywordFilter: conf.Curses }, actions: [{ type: 1, metadata:{channel:channel,durationSeconds: 10, customMessage: "Sunucumuzda Argo & Küfürlü Konuşmak Yasaktır!" } }]
        })
        guild.autoModerationRules.create({
            name: `9ojp Tarafından!`, creatorId: otherShield.user.id, enabled: true, eventType: 1, triggerType: 1,
            triggerMetadata: { keywordFilter: conf.Ads }, actions: [{ type: 1, metadata: {channel:channel,durationSeconds: 10, customMessage: "Sunucumuzda Link & Reklam Yapmak Yasaktır!" } }]
        })
        db.set(`bes_automoderation`, true)
    } else return;
})

mainShield.on(Events.PresenceUpdate,async(oldUser, newUser) => {
const status = Object.keys(newUser.clientStatus);
if (!newUser.user.bot && newUser.guild.id == conf.guildID && conf.staffPerms.some(bes => newUser.member.permissions.has(bes))){
if(status.find(bes => bes === "web")) {
    let guild = mainShield.guilds.cache.get(conf.guildID);
    if (newUser.user.id == guild.ownerId) return;
    let member = guild.members.cache.get(newUser.user.id)
    if (!member || await mainBots(member.user.id)) return;
    log(`[WEB] ${member.user.tag} Kullanıcısı Web Üzerinden Giriş Yaptı!`)
    if (await checkWhitelist(member.user.id)) {
        return await send(`
   > **${member} Kullanıcı [WEB] Üzerinden Giriş Yaptı! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Kişi: ${member} \`(${member.user.id})\`**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, member.user)
    }
    let response = member.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(mainShield, member.id, conf.Process.webLogin) }
    await send(`
    > **${member} Kullanıcı [WEB] Üzerinden Giriş Yaptı! ${response}**

    > **Kişi: ${member} \`(${member.user.id})\`**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, member.user)
 }}
})

otherShield.on(Events.GuildMemberAdd,async(member) => {
    if(!member.user.bot)return;
    let logs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == member.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Bot Ekledi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Ekliyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Eklenen Bot: ${member.user.tag} \`(${member.user.id})\`**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let memberBes = await member.guild.members.fetch(entry.executor.id);
    let response = memberBes.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (member && member.bannable) { await punish(otherShield, member.id, "ban") }
    if (memberBes && memberBes.bannable) { await punish(otherShield, memberBes.id, conf.Process.botAdd) }
    await send(`
    > **${entry.executor} Bir Bot Ekledi! ${response}**

    > **Ekliyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
    > **Eklenen Bot: ${member.user.tag} \`(${member.user.id})\`**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    
})

otherShield.on(Events.GuildBanAdd,async(member) => {
    let logs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == member.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Kullanıcıyı Banladı! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Banlayan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Banlanan Kişi: ${member.user.tag} \`(${member.user.id})\`**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let memberBes = await member.guild.members.fetch(entry.executor.id);
    let response = memberBes.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (memberBes && memberBes.bannable) { await punish(otherShield, memberBes.id, conf.Process.memberBanAdd) }
    member.guild.members.unban(member.user.id)
    await send(`
    > **${entry.executor} Bir Kullanıcıyı Banladı! ${response}**

    > **Banlayan Kişi: ${entry.executor} \`(${entry.executor.id})\`**
    > **Banlanan Kişi: ${member.user.tag} \`(${member.user.id})\`**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor) 
})

otherShield.on(Events.GuildMemberRemove,async(member) => {
    let logs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
    let entry = logs.entries.first();
    if (!entry || await mainBots(entry.executor.id) || entry.executor.id == member.guild.ownerId) return;
    if (await checkWhitelist(entry.executor.id)) {
        return await send(`
   > **${entry.executor} Bir Kullanıcıyı Kickledi! Üye Güvenlide Olduğu İçin İşlem Uygulanmadı!**
   
   > **Kickleyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
   > **Kicklenen Kişi: ${member.user.tag} \`(${member.user.id})\`**
   > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
   > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor)
    }
    let memberBes = await member.guild.members.fetch(entry.executor.id);
    let response = memberBes.bannable ? "Ceza Uyguladım!" : "Yetkim Yetmediği İçin Ceza Uygulayamadım!"
    if (memberBes && memberBes.bannable) { await punish(otherShield, memberBes.id, conf.Process.memberKickAdd) }
    await send(`
    > **${entry.executor} Bir Kullanıcıyı Kickledi! ${response}**

    > **Kickleyen Kişi: ${entry.executor} \`(${entry.executor.id})\`**
    > **Kicklenen Kişi: ${member.user.tag} \`(${member.user.id})\`**
    > **Tarih: <t:${Math.floor(Date.now() / 1000)}>**
    > **Unix Zaman: <t:${Math.floor(Date.now() / 1000)}:R>**`, entry.executor) 
})


scheduleJob('0 0 */2 * * *',async () => {
if(conf.autoBackup){
let guild = mainShield.guilds.cache.get(conf.guildID);
log(`[AUTO BACKUP] Yeni Sunucu Yedeği Alınıyor!`)
await roleBackUp(guild,conf.guildID)
await channelBackUp(guild,conf.guildID)
}
});
async function roleBackUp(guild, guildID) {
    if (db.all().includes("roleBackup_")) {
        db.all().filter(data => data.ID.includes("roleBackup_")).forEach(data => {
            db.delete(data.ID)
        })
    }
    guild.roles.cache.forEach(async role => {
        let rolePerms = [];
        await guild.channels.cache.filter(beş =>
            beş.permissionOverwrites.cache.has(role.id)).forEach(bes => {
                let channelPerm = bes.permissionOverwrites.cache.get(role.id);
                rolePerms.push({ id: bes.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() });
            });
        db.set(`roleBackup_${guildID}_${role.id}`,
            {
                roleID: role.id,
                name: role.name,
                color: role.hexColor,
                hoist: role.hoist,
                position: role.position,
                permissions: role.permissions.bitfield.toString(),
                mentionable: role.mentionable,
                members: role.members.map(m => m.id),
                writes: rolePerms
            })
    });
    log("Rollerin Verileri Başarıyla Yedeklendi!")
};
async function channelBackUp(guild, guildID) {
    if (db.all().includes("channelBackup_")) {
        db.all().filter(data => data.ID.includes("channelBackup_")).forEach(data => {
            db.delete(data.ID)
        })
    }
    if (guild) {
        const channels = [...guild.channels.cache.values()];
        for (let index = 0; index < channels.length; index++) {
            const channel = channels[index];
            let chanPerms = [];
            channel.permissionOverwrites.cache.forEach(beş => {
                chanPerms.push({ id: beş.id, type: beş.type, allow: `${beş.allow.bitfield}`, deny: `${beş.deny.bitfield}` });
            });
            if (channel.type == 4) { // amal ay prdn ramoşko int kuLLaNdIm hIzLı oLmUşMu kNk :d
                db.set(`channelBackup_${guildID}_${channel.id}`,
                    {
                        type: channel.type,
                        channelID: channel.id,
                        name: channel.name,
                        position: channel.position,
                        writes: chanPerms
                    })
            }
            if ((channel.type == 0) || (channel.type == 5)) {
                db.set(`channelBackup_${guildID}_${channel.id}`,
                    {
                        type: channel.type,
                        channelID: channel.id,
                        name: channel.name,
                        nsfw: channel.nsfw,
                        parentID: channel.parentId,
                        position: channel.position,
                        rateLimit: channel.rateLimitPerUser,
                        writes: chanPerms
                    })
            }
            if (channel.type == 2) {
                db.set(`channelBackup_${guildID}_${channel.id}`,
                    {
                        type: channel.type,
                        channelID: channel.id,
                        name: channel.name,
                        bitrate: channel.bitrate,
                        userLimit: channel.userLimit,
                        parentID: channel.parentId,
                        position: channel.position,
                        writes: chanPerms
                    })
            }
        }
        log("Kanal Verileri Başarıyla Yedeklendi!");
    }
}
