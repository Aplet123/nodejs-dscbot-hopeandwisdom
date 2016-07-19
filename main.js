//jshint esversion:6
var Discord = require("discord.js");
var fs = require("fs");

var admins = JSON.parse(fs.readFileSync("./info/admins.json", "utf8"));
var banned = JSON.parse(fs.readFileSync("./info/banned.json", "utf8"));
var muted = JSON.parse(fs.readFileSync("./info/muted.json", "utf8"));
var censored = JSON.parse(fs.readFileSync("./info/censored.json", "utf8"));
var censorimmune = JSON.parse(fs.readFileSync("./info/censorimmune.json", "utf8"));
var settings = JSON.parse(fs.readFileSync("./info/settings.json", "utf8"));
var grand = JSON.parse(fs.readFileSync("./info/grand.json", "utf8"));
var servers = JSON.parse(fs.readFileSync("./info/servers.json", "utf8"));

var token = JSON.parse(fs.readFileSync("./info/auth.json", "utf8")).token;

var mybot = new Discord.Client();

Object.freeze(Math);

function setup(id) {
    admins[id] = JSON.parse(fs.readFileSync("./default/admins.json"));
    banned[id] = JSON.parse(fs.readFileSync("./default/banned.json"));
    muted[id] = JSON.parse(fs.readFileSync("./default/muted.json"));
    censored[id] = JSON.parse(fs.readFileSync("./default/censored.json"));
    censorimmune[id] = JSON.parse(fs.readFileSync("./default/censorimmune.json"));
    settings[id] = JSON.parse(fs.readFileSync("./default/settings.json"));
    servers.push(id);
    fs.writeFileSync("info/admins.json", JSON.stringify(admins));
    fs.writeFileSync("info/banned.json", JSON.stringify(banned));
    fs.writeFileSync("info/muted.json", JSON.stringify(muted));
    fs.writeFileSync("info/censored.json", JSON.stringify(censored));
    fs.writeFileSync("info/censorimmune.json", JSON.stringify(censorimmune));
    fs.writeFileSync("info/settings.json", JSON.stringify(settings));
    fs.writeFileSync("info/servers.json", JSON.stringify(servers));
}

mybot.on("ready", function() {
    mybot.servers.map(v => servers.some(val => val == v.id) ? 0 : setup(v.id));
});

function interpret(message) {
    var isSelf = message.author.id === "202902913087963137";
    var del = false;
    if (muted[message.server.id].some(v => v === message.author.id) && !isSelf && settings[message.server.id].muting) {
        mybot.deleteMessage(message, { wait: 0 });
    } else if (!isSelf && censorimmune[message.server.id].every(v => v !== message.author.id) && settings[message.server.id].censor) {
        censored[message.server.id].map(v => del = message.content.match(new RegExp("\\b[^\\s\\n]*" + v + "[^\\s\\n]*\\b", "gi")) !== null ? true : del);
    }
    if (banned[message.server.id].every(v => v !== message.author.id) && muted[message.server.id].every(v => v !== message.author.id) && !isSelf) {
        if (/^\/\/calc\s/i.test(message.content)) {
            var txt = message.content.replace(/\/\/calc\s/i, "");
            var mat = txt.match(/(?:Math\.\w+)|[()+\-*/&|^%<>=,]|(?:\d+\.?\d*(?:e\d+)?)/g);
            var evl = (mat === null ? [] : mat).join ``;
            var res;
            try {
                res = eval(evl);
            } catch (err) {
                mybot.reply(message, "\nSorry, but there was an error in your query of: \n```\n" + txt + "\n```\nProducing the following error: \n```\n" + err + "\n```");
            }
            if (!/^\s*$/.test(String(res)) && !isNaN(Number(res)) && res !== undefined && res !== null) {
                mybot.reply(message, "\nYour query of: \n```\n" + txt + "\n```\nWas interpreted as: \n```\n" + res + "\n```");
            }
        } else if (/^\/\/info$/i.test(message.content)) {
            mybot.sendMessage(message, "The Bot of Hope and Wisdom - by " + mybot.users.get("id", "201765854990434304").mention());
        } else if (/^\/\/code$/i.test(message.content) && grand.code) {
            mybot.sendMessage(message, "Here is my code: ", {file:"./main.js"});
        } else if (/^\/\/github$/i.test(message.content) && grand.github) {
            mybot.sendMessage(message, "Here is my github: \nhttps://github.com/Aplet123/The-Bot-of-Hope-and-Wisdom");
        } else if (/^(n+o{2,}t+\s?)+$/i.test(message.content) && settings[message.server.id].noot) {
            mybot.sendMessage(message, message.content + " " + message.content);
        } else if (/^\/\/help$/i.test(message.content)) {
            mybot.reply(message, "\n//calc [calculation] - Calculates the statement\n//info - Gives info for the bot\nnoot or any variation - Repeats your message twice\n//settings - Displays the current bot settings\n//anonymous [message] - Sends an anonyous message\n//code - Sends the code of the bot\n//github - Sends a link to the bot github\n//adm [adm command] - Performs an admin command. **Bot admins only**");
        } else if (/^\/\/settings$/i.test(message.content)) {
            mybot.reply(message, "\n```" + JSON.stringify(settings[message.server.id]) + "```");
        } else if (/^\/\/anonymous .+/i.test(message.content) && settings[message.server.id].anonymous && !del) {
            mybot.sendMessage(message, "Someone sent the anonymous message: \n" + message.content.replace(/^\/\/anonymous/i, ""), { tts: false }, function(err, msg) {
                mybot.deleteMessage(message, { wait: 0 });
            });
        } else if (admins[message.server.id].some(v => v === message.author.id) && /^\/\/adm\s/i.test(message.content)) {
            var text = message.content.replace(/\/\/adm\s/i, "");
            if (text === "logout") {
                if (grand.logout) {
                    mybot.sendMessage(message, "Now logging out...", { tts: false }, function(err, msg) {
                        console.log("Logging out on command of ID: \n" + message.author.id);
                        mybot.logout();
                    });
                }
            } else if (text === "help") {
                mybot.reply(message, "\nlogout - Logs out the bot\nban [user ID] - Bans the specified ID from using the bot.\nunban [user ID] - Unbans the specified ID from using the bot.\nadm [user ID] - Makes the specified ID a bot administrator\nunadm [user ID] - Removes bot administrator permissions from the specified ID\nmute [user ID] - Mutes the specified ID\nunmute [user ID] - Unmutes the specified ID\ncnsimm [user ID] - Makes the specified ID censor immune\nuncnsimm [user ID] - Makes the specified ID not censor immune\nbanned - Lists all banned IDs\nadmins - Lists all admin IDs\nmuted - Lists all muted IDs\ncensorimmune - Lists all censor immune IDs\ncensor [phrase] - Censors the specified phrase\nuncensor [phrase] - Uncensors the specified phrase\ncnson - Turns on censors\ncnsoff - Turns off censors\nmuteon - Turns on muting\nmuteoff - Turns off muting\nnooton - Turns noot on\nnootoff - Turns noot off\neditoff - Turns editing off\nediton - Turns editing on\nwelcomeon - Turns welcome on\nwelcomeoff - Turns welcome off\nbanon - Turns ban on\nbanoff - Turns ban off\nclr [number] - Clears the past amount of messages specified\nclrall - Clears all messages before loading more messages is needed\nanymson - Turns anonymous on\nanymsoff - Turns anonymous off");
            } else if (/^ban\s\d+/i.test(text)) {
                banned[message.server.id].push(text.replace(/^ban\s/i, ""));
                fs.writeFileSync("info/banned.json", JSON.stringify(banned));
                console.log("Banned ID: \n" + text.replace(/^ban\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow banned ID: \n```" + text.replace(/^ban\s/i, "") + "```");
            } else if (/^adm\s\d+/i.test(text)) {
                admins[message.server.id].push(text.replace(/^adm\s/i, ""));
                fs.writeFileSync("info/admins.json", JSON.stringify(admins));
                console.log("Admin-ized ID: \n" + text.replace(/^adm\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow admin-ized ID: \n```" + text.replace(/^adm\s/i, "") + "```");
            } else if (/^unban\s\d+/i.test(text)) {
                banned[message.server.id] = banned[message.server.id].filter(v => v !== text.replace(/^unban\s/i, ""));
                fs.writeFileSync("info/banned.json", JSON.stringify(banned));
                console.log("Unbanned ID: \n" + text.replace(/^unban\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow unbanned ID: \n```" + text.replace(/^unban\s/i, "") + "```");
            } else if (/^unadm\s\d+/i.test(text)) {
                admins[message.server.id] = admins[message.server.id].filter(v => v !== text.replace(/^unadm\s/i, ""));
                fs.writeFileSync("info/admins.json", JSON.stringify(admins));
                console.log("Unadmin-ized ID: \n" + text.replace(/^unadm\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow unadmin-ized ID: \n```" + text.replace(/^unadm\s/i, "") + "```");
            } else if (/^mute\s\d+/i.test(text)) {
                muted[message.server.id].push(text.replace(/^mute\s/i, ""));
                fs.writeFileSync("info/muted.json", JSON.stringify(muted));
                console.log("Muted ID: \n" + text.replace(/^mute\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow muted ID: \n```" + text.replace(/^mute\s/i, "") + "```");
            } else if (/^unmute\s\d+/i.test(text)) {
                muted[message.server.id] = muted[message.server.id].filter(v => v !== text.replace(/^unmute\s/i, ""));
                fs.writeFileSync("info/muted.json", JSON.stringify(muted));
                console.log("Unmuted ID: \n" + text.replace(/^unmute\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow unmuted ID: \n```" + text.replace(/^unmute\s/i, "") + "```");
            } else if (/^banned$/i.test(text)) {
                mybot.reply(message, "\nThe following IDs are banned: \n```" + JSON.stringify(banned[message.server.id]) + "```");
            } else if (/^admins$/i.test(text)) {
                mybot.reply(message, "\nThe following IDs are admins: \n```" + JSON.stringify(admins[message.server.id]) + "```");
            } else if (/^muted$/i.test(text)) {
                mybot.reply(message, "\nThe following IDs are muted \n```" + JSON.stringify(muted[message.server.id]) + "```");
            } else if (/^censored$/i.test(text)) {
                mybot.reply(message, "\nThe following words are censored \n```" + JSON.stringify(censored[message.server.id]) + "```", { tts: false }, function(err, msg) {
                    mybot.deleteMessage(msg, { wait: 3000 });
                });
                mybot.deleteMessage(message, { wait: 3000 });
            } else if (/^censor\s.+/i.test(text)) {
                del = false;
                censored[message.server.id].push(text.replace(/^censor\s/i, ""));
                fs.writeFileSync("info/censored.json", JSON.stringify(censored[message.server.id]));
                console.log("Censored word: \n" + text.replace(/^censor\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow censored word: \n```" + text.replace(/^censor\s/i, "") + "```", { tts: false }, function(err, msg) {
                    mybot.deleteMessage(msg, { wait: 3000 });
                });
                mybot.deleteMessage(message, { wait: 3000 });
            } else if (/^uncensor\s.+/i.test(text)) {
                del = false;
                censored[message.server.id] = censored[message.server.id].filter(v => v !== text.replace(/^uncensor\s/i, ""));
                fs.writeFileSync("info/censored.json", JSON.stringify(censored[message.server.id]));
                console.log("Uncensored word: \n" + text.replace(/^uncensor\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow uncensored word: \n```" + text.replace(/^uncensor\s/i, "") + "```", { tts: false }, function(err, msg) {
                    mybot.deleteMessage(msg, { wait: 3000 });
                });
                mybot.deleteMessage(message, { wait: 3000 });
            } else if (/^cnsimm\s\d+/i.test(text)) {
                censorimmune[message.server.id].push(text.replace(/^cnsimm\s/i, ""));
                fs.writeFileSync("info/censorimmune.json", JSON.stringify(censorimmune[message.server.id]));
                console.log("Censor-immune-ized ID: \n" + text.replace(/^cnsimm\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow censor-immune-ized ID: \n```" + text.replace(/^cnsimm\s/i, "") + "```");
            } else if (/^uncnsimm\s\d+/i.test(text)) {
                censorimmune[message.server.id] = censorimmune[message.server.id].filter(v => v !== text.replace(/^uncnsimm\s/i, ""));
                fs.writeFileSync("info/censorimmune.json", JSON.stringify(censorimmune[message.server.id]));
                console.log("Uncensor-immune-ized ID: \n" + text.replace(/^uncnsimm\s/i, "") + "\nOn command of ID: \n" + message.author.id);
                mybot.reply(message, "\nNow uncensor-immune-ized ID: \n```" + text.replace(/^uncnsimm\s/i, "") + "```");
            } else if (/^censorimmune$/i.test(text)) {
                mybot.reply(message, "\nThe following IDs are censor immune \n```" + censorimmune + "```");
            } else if (/^cnson$/i.test(text)) {
                settings[message.server.id].censor = true;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned censors on on command of: \n" + message.author.id);
                mybot.reply(message, "\nCensors are now on.");
            } else if (/^cnsoff$/i.test(text)) {
                settings[message.server.id].censor = false;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned censors off on command of: \n" + message.author.id);
                mybot.reply(message, "\nCensors are now off.");
            } else if (/^muteon$/i.test(text)) {
                settings[message.server.id].muting = true;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned muting on on command of: \n" + message.author.id);
                mybot.reply(message, "\nMuting is now on.");
            } else if (/^muteoff$/i.test(text)) {
                settings[message.server.id].muting = false;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned muting off on command of: \n" + message.author.id);
                mybot.reply(message, "\nMuting is now off.");
            } else if (/^nooton$/i.test(text)) {
                settings[message.server.id].noot = true;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned noot on on command of: \n" + message.author.id);
                mybot.reply(message, "\nNoot is now on.");
            } else if (/^nootoff$/i.test(text)) {
                settings[message.server.id].noot = false;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned noot off on command of: \n" + message.author.id);
                mybot.reply(message, "\nNoot is now off.");
            } else if (/^editon$/i.test(text)) {
                settings[message.server.id].edit = true;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned editing on on command of: \n" + message.author.id);
                mybot.reply(message, "\nEditing is now on.");
            } else if (/^editoff$/i.test(text)) {
                settings[message.server.id].edit = false;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned editing off on command of: \n" + message.author.id);
                mybot.reply(message, "\nEditing is now off.");
            } else if (/^welcomeon$/i.test(text)) {
                settings[message.server.id].welcome = true;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned welcome on on command of: \n" + message.author.id);
                mybot.reply(message, "\nWelcome is now on.");
            } else if (/^welcomeoff$/i.test(text)) {
                settings[message.server.id].welcome = false;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned welcome off on command of: \n" + message.author.id);
                mybot.reply(message, "\nWelcome is now off.");
            } else if (/^banon$/i.test(text)) {
                settings[message.server.id].ban = true;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned ban on on command of: \n" + message.author.id);
                mybot.reply(message, "\nBan is now on.");
            } else if (/^banoff$/i.test(text)) {
                settings[message.server.id].ban = false;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned ban off on command of: \n" + message.author.id);
                mybot.reply(message, "\nBan is now off.");
            } else if (/^clr\s\d+/i.test(text)) {
                mybot.getChannelLogs(message, text.match(/\d+/i)[0], { before: message }, function(err, log) {
                    mybot.deleteMessages(log);
                    mybot.deleteMessage(message);
                });
            } else if (/^clrall$/.test(text)) {
                mybot.getChannelLogs(message, Infinity, { before: message }, function(err, log) {
                    mybot.deleteMessages(log);
                    mybot.deleteMessage(message);
                });
            } else if (/^anymson$/i.test(text)) {
                settings[message.server.id].anonymous = true;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned anonymous on on command of: \n" + message.author.id);
                mybot.reply(message, "\nAnonymous is now on.");
            } else if (/^anymsoff$/i.test(text)) {
                settings[message.server.id].anonymous = false;
                fs.writeFileSync("info/settings.json", JSON.stringify(settings));
                console.log("Turned anonymous off on command of: \n" + message.author.id);
                mybot.reply(message, "\nAnonymous is now off.");
            }
        }
    }
    if (del) {
        mybot.reply(message, "\n:japanese_goblin: :japanese_goblin: :japanese_goblin: **LANGUAGE!!!** :japanese_goblin: :japanese_goblin: :japanese_goblin:", { tts: false }, function(err, msg) {
            mybot.deleteMessage(msg, { wait: 3000 });
        });
        mybot.deleteMessage(message, { wait: 0 });
    }
}
mybot.on("message", interpret);
mybot.on("messageUpdated", function(b, a) {
    if (settings[b.server.id].edit) {
        interpret(a);
    }
});
mybot.on("serverNewMember", function(s, u) {
    if (settings[s.id].welcome) {
        mybot.sendMessage(s, "Say hello to " + u.mention());
    }
});
mybot.on("userBanned", function(u, s) {
    if (settings[s.id].ban) {
        mybot.sendMessage(s, "Say bye-bye to " + u.username);
    }
});

mybot.loginWithToken(token);
