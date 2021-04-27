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

function getTimeString(){
    let d = new Date();
    return `${getClock(d)} ${DateTime.now().setZone('America/New_York').toFormat('t')}`;
}

/**
 * Function handling joining of server
 * @param {Discord.Message} message 
 */
async function join(message){
    let channel = message.member.voice.channel;
    let guild = message.guild;

    // Set time on join
    guild.me.setNickname(getTimeString());
    let interval;
    setTimeout(() => {
        // Set time before timeout begins
        guild.me.setNickname(getTimeString());
        interval = setInterval(() => {
            // Update every minute
            guild.me.setNickname(getTimeString());
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
        })
    });
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