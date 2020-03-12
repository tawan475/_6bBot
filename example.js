const _6bBot = require('./_6bbot.js')
const fs = require('fs')
const settings = require('./config.json')
const InvalidBot = new _6bBot(settings);



InvalidBot.once('login', () => {
    log(`logged in as   : ${InvalidBot._client.username}`);
    log(`Max Player     : ${InvalidBot._client.game.maxPlayers}`)
    
    log('logged in')

    InvalidBot.on('discord_message', (name, msg) => {
        log(`DISCORD: ${name}: ${msg}`)
    });
    
    InvalidBot.on('message', (line) => {
        log(line)
    });
    
    InvalidBot.on('chat', (name, msg) => {
        log(`<${name}> ${msg}`)
    });
    
    InvalidBot.on('join', (player) => {
        InvalidBot.chat(player.username + ' welcome to 6b6t!')
        log(`${player.username} joined the server`)
    });

    InvalidBot.on('leave', (player) => {
        InvalidBot.chat(player.username + ' hope you enjoy 6b6t!')
        log(`${player.username} left the server`)
    });

    InvalidBot.on('end', end)
    InvalidBot.on('kicked', end)
    InvalidBot.on('error', end)
    
});

var end = function(reason){
    log(reason);
    process.exit();
};

function log(str) {
    console.log(`[${new Date().toISOString()}] `+str)
}
