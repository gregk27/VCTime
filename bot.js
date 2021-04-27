import { token, DB_HOST, DB_USER, DB_PASS } from "./secrets.js";
import Discord, { DataResolver } from "discord.js";
import { DateTime } from 'luxon';
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
        return;
    }

    connection.query("SELECT * FROM servers WHERE id=?", [guild.id], (err, res, fields)=>{
        // If the server is new, add and cache it
        if(res.length == 0){
            connection.query("INSERT INTO servers (id) VALUES (?)", [guild.id]);
            servers[guild.id] = {timezone:'America/New_York', format:'t'};
        } else {
            // Otherwise cache the data  
            servers[guild.id] = {timezone:res[0].timezone, format:res[0].format};
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
    if(message.content.match(/^!time\w*/g)){
        join(message);
    }
});

client.login(token);

// Code to test clock
// for(let x = 0; x<24; x++){
//     let d = new Date(2000, 1, 1, x*0.5+1, (x%2)*30);
//     console.log(dateFormat(d, "hh:MM:ss") + getClock(d));
// }