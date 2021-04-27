import { token, DB_HOST, DB_USER, DB_PASS } from "./secrets.js";
import Discord, { DataResolver } from "discord.js";
import { DateTime, IANAZone } from 'luxon';
import mysql from "mysql";

const client = new Discord.Client();

var connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: 'vctime'
})

connection.connect(err => {
    if(err){
        console.error("Error connecting: "+err.stack);
        process.exit(1);
    } else {
        console.log("Database connected")
    }
})

client.once('ready', ()=>{
    console.log("Ready!");
})

var servers = {};

/**
 * Get the unicode clock for a time
 * @param {Date} d 
 */
function getClock(d){
    let id = 0x1F550;
    if(d.getHours() == 0){
        id += 11;
    } else {
        id += d.getHours() % 13 - 1;
    }
    if(d.getMinutes() >= 30){
        id += 0xC;
    }
    return String.fromCodePoint(id);
}

function getTimeString(id){
    let d = new Date();
    return `${getClock(d)} ${DateTime.now().setZone(servers[id].timezone).toFormat(servers[id].format)}`;
}

/**
 * Function handling joining of server
 * @param {Discord.Message} message 
 */
async function join(message){
    let channel = message.member.voice.channel;
    let guild = message.guild;

    // Do not join multiple times, may cause bugs with updates
    if(servers[guild.id] != undefined){
        message.reply("VCTime is already in a voice channel.");
        return;
    }
    // If the sender isn't in a voice channel, then alert and stop
    if(channel == null || channel == undefined){
        message.reply("Please enter a voice channel to use VCTime");
        return;
    }

    connection.query("SELECT * FROM servers WHERE id=?", [guild.id], (err, res, fields)=>{
        // If the server is new, add and cache it
        if(res.length == 0){
            connection.query("INSERT INTO servers (id) VALUES (?)", [guild.id]);
            servers[guild.id] = {timezone:'America/New_York', format:'t', channel, update:()=>{guild.me.setNickname(getTimeString(guild.id));}};
        } else {
            // Otherwise cache the data  
            servers[guild.id] = {timezone:res[0].timezone, format:res[0].format, channel, update:()=>{guild.me.setNickname(getTimeString(guild.id));}};
        }
        
        // Set time on join
        guild.me.setNickname(getTimeString(guild.id));
        let interval;
        setTimeout(() => {
            // Set time before timeout begins
            guild.me.setNickname(getTimeString(guild.id));
            interval = setInterval(() => {
                // Update every minute
                guild.me.setNickname(getTimeString(guild.id));
                // Leave if channel is empty
                if(channel.members.size == 1){
                    channel.leave();
                }
            }, 60000);
        }, (60-new Date().getSeconds())*1000);
        
        channel.join().then(connection=>{
            connection.on('disconnect', ()=>{
                guild.me.setNickname("VCTime | !time to join");
                clearInterval(interval);
                servers[guild.id] = undefined;
            })
        });
    })
}

client.on('message', message =>{
    if(message.content.match(/^!time\s+help\s*/g)){
        message.channel.send("VCTime shows the current time int a voice chat\nThis allows users with the overlay to see the current time\n**Commands:**\n**!time**: Join the sender's voice channel\n**!time leave**: Disconnect from VC, sender must be in the same voice channel to work\n**!time zone [zone]**: Set the bot's timezone to [zone], using tz/IANA timezones\n**!time format [format]**: Set the bot's clock format, using Luxon tokens (<https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens>)");
    } else if(message.content.match(/^!time\s+zone\s+\S*/g)){
        let result = /^!time\s+zone\s+(\S*)\s*/g.exec(message.content);
        if(!IANAZone.isValidZone(result[1])){
            message.reply("Invalid timezone: `"+result[1]+'`');
            return;
        }
        connection.query("UPDATE servers SET timezone=? WHERE id=?", [result[1], message.guild.id]);
        if(servers[message.guild.id] != undefined){
            servers[message.guild.id].timezone = result[1];
            servers[message.guild.id].update();
        }
    } else if(message.content.match(/^!time\s+format\s+.*/g)){
        let result = /^!time\s+format\s+(.*)\s*/g.exec(message.content);
        connection.query("UPDATE servers SET format=? WHERE id=?", [result[1], message.guild.id]);
        if(servers[message.guild.id] != undefined){
            servers[message.guild.id].format = result[1];
            servers[message.guild.id].update();
        }
    } else if(message.content.match(/^!time leave/g)){
        if(servers[message.guild.id] != undefined && message.member.voice.channel == servers[message.guild.id].channel){
            servers[message.guild.id].channel.leave();
        } else {
            message.reply("VCTime is not connected to your channel.");
        }
    } else if(message.content.match(/^!time\s*/g)){
        join(message);
    }
});

client.login(token);

// Code to test clock
// for(let x = 0; x<24; x++){
//     let d = new Date(2000, 1, 1, x*0.5+1, (x%2)*30);
//     console.log(dateFormat(d, "hh:MM:ss") + getClock(d));
// }