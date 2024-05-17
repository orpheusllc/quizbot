const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Canvas = require("canvas")
const { getUser, getGuild } = require('../utils/quizUtils.js');
const translate = require('@iamtraction/google-translate');
const wait = require('node:timers/promises').setTimeout;
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Просмотр статистики пользователя').addUserOption(opt => opt.setName('пользователь').setDescription("Выберите пользователя")),

    async execute(interaction) {

        let ua = interaction.options.getUser("пользователь")
        if (ua && ua?.bot === true) return interaction.reply({ content: "❌ Мы не можем просматривать статистику ботов." })
        if (!ua) ua = interaction.user
        let user = interaction.guild.members.cache.get(ua.id)

        const userStats = await getUser(ua.id);
		
		let bgs = [
			"https://cdn.shawnnn.store/quiz/bg1.png",
			"https://cdn.shawnnn.store/quiz/bg2.png",
			"https://cdn.shawnnn.store/quiz/bg3.png",
			"https://cdn.shawnnn.store/quiz/bg4.png",
			"https://cdn.shawnnn.store/quiz/bg5.png",
			"https://cdn.shawnnn.store/quiz/bg6.png",
			"https://cdn.shawnnn.store/quiz/bg7.png",
			"https://cdn.shawnnn.store/quiz/bg8.png",
			"https://cdn.shawnnn.store/quiz/bg9.png",
			"https://cdn.shawnnn.store/quiz/bg10.png",
			"https://cdn.shawnnn.store/quiz/bg11.png",
			"https://cdn.shawnnn.store/quiz/bg12.png",
			"https://cdn.shawnnn.store/quiz/bg13.png",
			"https://cdn.shawnnn.store/quiz/bg14.png",
			"https://cdn.shawnnn.store/quiz/bg15.png"
		]

        await interaction.deferReply()
        const createBanner = async () => {
            const canvas = Canvas.createCanvas(1280, 340);
            const ctx = canvas.getContext('2d');

            let img = await Canvas.loadImage(user.displayAvatarURL({ dynamic: false, size: 2048, extension: "png" }))
            let avatarBack;

            if (userStats.bgSet < 1) {
                console.log(1)
              avatarBack = await Canvas.loadImage('https://cdn.shawnnn.store/quiz/default_bg.png')
            } else {
                console.log(2)
                avatarBack = await Canvas.loadImage(bgs[userStats.bgSet - 1])
            }

            ctx.drawImage(avatarBack, 0, 0, canvas.width, canvas.height);



            const winLossRatio = userStats.correct_answers.length / userStats.incorrect_answers.length

            // Loop through userStats.correct_answers, userStats.incorrect_answers and find the category with the most/least amount of correct answers
            let categoryCorrectAnswers = {}; let categoryIncorrectAnswers = {};

            userStats.correct_answers.forEach(answer => {
                const category = answer.category;
                if (categoryCorrectAnswers[category]) categoryCorrectAnswers[category] += 1;
                else categoryCorrectAnswers[category] = 1;
            });

            userStats.incorrect_answers.forEach(answer => {
                const category = answer.category;
                if (categoryIncorrectAnswers[category]) categoryIncorrectAnswers[category] += 1;
                else categoryIncorrectAnswers[category] = 1;
            });

            let worstCategory, bestCategory;

            try {
                worstCategory = Object.keys(categoryIncorrectAnswers).reduce((a, b) => categoryIncorrectAnswers[a] > categoryIncorrectAnswers[b] ? a : b);
                bestCategory = Object.keys(categoryCorrectAnswers).reduce((a, b) => categoryCorrectAnswers[a] > categoryCorrectAnswers[b] ? a : b);
                let worst = await translate(worstCategory, { to: "ru" })
                let best = await translate(bestCategory, { to: "ru" })
                worstCategory = worst.text
                bestCategory = best.text
            } catch (e) {
                worstCategory = '❌'
                bestCategory = '❌'
            }

            ctx.textAlign = "center";
            ctx.fillStyle = "#FFFFFF";
            Canvas.registerFont('manrope.extrabold.otf', { family: 'ss1' })
            ctx.font = "40px ss1";
            //ctx.fillText(String(`21.21.12`), 110, height);
            ctx.fillText(String(`${user.user.username}`), 645, 230);
            Canvas.registerFont('manrope.semibold.otf', { family: 'ss2' })
            ctx.font = "25px ss2";
            ctx.fillStyle = "#FFB41F";
            ctx.fillText(String(`Очков:  ${userStats.points}`), 645, 270);
            Canvas.registerFont('manroope.light.otf', { family: 'ss3' })
            ctx.font = "bold 15px ss3";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(String(`Правильных ответов: ${userStats.correct_answers.length} • Неправильных: ${userStats.incorrect_answers.length} • Соотношение: ${isNaN(winLossRatio) ? "0" : winLossRatio.toFixed(2)}`.replace(NaN, "0").replace(null, "0").replace(Infinity, "0")), 645, 300);
            let ava = {
                x: 575, y: 42, width: 130, height: 130,
            }
            ctx.save();
            roundedImage(ava.x, ava.y, ava.width, ava.height, 75, ctx);
            ctx.clip();
            ctx.drawImage(img, ava.x, ava.y, ava.width, ava.height);
            ctx.restore();

            return { status: 200, image: canvas.toBuffer() }
        }

        function roundedImage(x, y, width, height, radius, ctx) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }
        let btn1 = new ButtonBuilder().setCustomId("backs").setLabel("Выбрать фон").setStyle("Secondary")

        let rr = new ActionRowBuilder().addComponents(btn1)
        let create = await createBanner()

        interaction.followUp({ files: [new AttachmentBuilder(create.image, 'rank.png')], components: [rr] }).then(async msg => {
            let collector = msg.createMessageComponentCollector((b) => b, { componentType: 'BUTTON' })

            let page = 0

            collector.on('collect', async b => {
                if(interaction.user.id !== b.user.id) return b.reply({content: "❌ Вам не доступно это использование.", ephemeral: true})
                if (b.customId === 'backs') {
                    b.deferUpdate()
                    let bb1 = new ButtonBuilder().setCustomId("backSet").setLabel("Установить фон").setStyle("Secondary")
                    let bb2 = new ButtonBuilder().setCustomId("back").setLabel("Назад").setStyle("Secondary")
                    let bb3 = new ButtonBuilder().setCustomId("next").setLabel("Вперед").setStyle("Secondary")
                    let rr2 = new ActionRowBuilder().addComponents(bb1, bb2, bb3)
                    let bb = new EmbedBuilder().setDescription('Установить пользовательский фон в профиль').setImage(bgs[0]).setColor("#f3ae6d").setFooter({ text: "Страница №1" })
                    interaction.followUp({ embeds: [bb], components: [rr2] }).then(async msg => {
                        let collector = msg.createMessageComponentCollector((b) => b, { componentType: 'BUTTON' })


                        collector.on('collect', async b => {

                            if (b.customId === 'back') {
                                b.deferUpdate()
                                page = page > 0 ? --page : bgs.length-1;
                                b.message.edit({ embeds: [bb.setImage(bgs[page]).setFooter({ text: `Страница №${page + 1}` })] })
                            } else if (b.customId === 'next') {
                                b.deferUpdate()
                                page = page + 1 < bgs.length ? ++page : 0;
                                b.message.edit({ embeds: [bb.setImage(bgs[page]).setFooter({ text: `Страница №${page + 1}` })] })
                            } else if (b.customId === 'backSet') {
                                if(interaction.user.id !== b.user.id) return b.reply({content: "❌ Вы не можете использовать эту функцию.", ephemeral: true})
                                let sa = await getGuild(interaction.guild.id)
                                userStats.bgSet = page + 1
                                userStats.save()
                                b.reply({ content: `✅ Фон **№${page + 1}** успешно установлен`, ephemeral: true })
                            }
                        })
                    })


                }
            })

        })

    }
}