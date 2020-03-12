const mineflayer = require('mineflayer');
const tpsPlugin = require('mineflayer-tps')(mineflayer)
const EventEmitter = require('events').EventEmitter;


// var this._client, this.chat_queue;

class Client extends EventEmitter {

    constructor(option) {
        super();

        var self = this;

        var options = {
            host: option.ip,
            port: option.port || "25565",
            version: option.version || "1.12.2",
            username: option.mail || option.username,
            password: option.password || undefined,
            moderators: option.moderators || [""]
        };

        self._client = mineflayer.createBot(options);

        self._client.loadPlugin(tpsPlugin)

        self.chat_queue = [];
        self.init_message = ``
        self.loop_message = [];
        self.chat_queue.push(self.init_message)
        self.loop_message.push(self.init_message)
        
        self.tps = 20

        self._client.once('login', function () {

            // maxPlayers = self._client.game.maxPlayers    
            self.emit('login');

            setInterval(function () {
                if (self.chat_queue.length !== 0) {
                    self._client.chat(self.chat_queue.shift())
                }
            }, 1350)
        });

        self._client.on('end', function (reason) {
            self.emit('end', reason)
        })

        self._client.once('health', function () {
            self._client.on('health', function () {
                self.emit('health', self._client.health);
            });

            self._client._client.on('playerlist_header', data => {
                var footer = JSON.parse(data.footer).text.split(' ')
                var TPS = parseFloat(footer[1].substr(4, footer[1].length))
                self.tps = TPS
                self.emit('tps', TPS)
            })

            self._client.on('respawn', () => {
                self.emit('respawn')
            })
            self._client.on('death', () => {
                self.emit('death')
            })

            self._client.on('entitySpawn', (entity) => {
                if (entity.type != 'player') return
                var username = entity.username
                if (username == self._client.username) return
                if (option.moderators.includes(username)) return
                self.emit('playerEnterSight', username, entity)
            })

            self._client.on('entityGone', (entity) => {
                if (entity.type != 'player') return
                var username = entity.username
                if (username == self._client.username) return
                if (option.moderators.includes(username)) return
                self.emit('playerLeaveSight', username, entity)
            })

            self._client.inventory.on('windowUpdate', function (slot, oldItem, newItem) {
                if (newItem != undefined) self.emit('inventory_update', slot, oldItem, newItem)
            });

            self._client.on("playerJoined", function (player) {
                self.emit('join', player)
            })

            self._client.on("playerLeft", function (player) {
                self.emit('leave', player)
            })
        })

        self._client.on('message', function (jsonMsg) {
            var chat_object = jsonMsg.extra;
            if (!chat_object || !chat_object[0]) return;
            if (option.moderators.includes(jsonMsg.extra[0].text)) if (jsonMsg.extra[1].text == ' would like to teleport to you') self.chat_queue.push(`/tpaccept`)
            if (option.moderators.includes(jsonMsg.extra[0].text)) if (jsonMsg.extra[1].text == ' has requested that you teleport to them.') self.chat_queue.push(`/tpaccept`)
            if (chat_object[0].color == 'dark_purple' && chat_object[0].text == '[' && chat_object[1] && chat_object[1].color == 'aqua' && chat_object[1].text == 'Discord' && chat_object[2] && chat_object[2].color == 'dark_purple' && chat_object[2].text == ']') {
                var nickname = chat_object[3].text.trim();
                if (!chat_object[5].text) chat_object[5].text = "";
                var msg = chat_object[5].text.trim();
                return self.emit('discord_message', nickname, msg, color);
            };
            if (chat_object[0].color == 'light_purple') {
                var Cc = chat_object[0].text.split(" ")
                if (Cc[0] == 'To') {
                    return self.emit('whispers_send', Cc[1].slice(0, -1), Cc.slice(2, Cc.length+1).join(" "));
                } else if (Cc[1] == 'whispers:') {
                    if (option.ignoreSelf) if (Cc[0].text !== self._client.username) return
                    console.log(Cc.slice(1, Cc.length+1).join(" "))
                    return self.emit('whispers_receive', Cc[0].slice(" ")[0], Cc.slice(2, Cc.length+1).join(" "));
                }
            }

            var line = chat_object.map(o => o.text).join("");

            var msg = line.split(" ");
            if (!msg[0].match(/^<|>$/)) return self.emit('message', line);
            var name = msg[0].replace(/^<|>$/g, '');
            msg.shift();
            msg = msg.join(" ");

            if (option.ignoreSelf) if (name == self._client.username) return

            self.emit('chat', name, msg);
        });

        

        self._client.on("kicked", function (reason, loggedIn) {
            self.emit('kicked', reason, loggedIn)
        });

        self._client.on("error", function (err) {
            self.emit('error', err)
        });
    };

    whisper(name, str){
        this.chat(`/msg ${name} ${str}`)
    }

    getPos() {
        return {
            x: this._client.entity.position.x,
            y: this._client.entity.position.y,
            z: this._client.entity.position.z
        };
    };

    getPing(name) {
        var players = this.getPlayers()
        if (players[name]) return players[name].ping
    }

    chat(str) {
        this.chat_queue.push(str)
    };

    getList() {
        return {
            list: Object.keys(this._client.players).join(', '),
            length: Object.keys(this._client.players).length
        };
    }

    getPlayers() {
        return this._client.players;
    }

    getTps() {
        return this._client.getTps();
    }



    end() {
        this._client.end()
        this.emit('end', "process ended")
    };
};

module.exports = Client;