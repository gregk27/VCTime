import { token } from "./secrets.js";
import Discord, { DataResolver } from "discord.js";
import dateFormat from "dateformat";

const client = new Discord.Client();

client.once('ready', ()=>{
    console.log("Ready!");
})

/**
 * Get the unicode clock for a time
 * @param {Date} d 
 */
function getClock(d){
    let id = 0x1F550;
    id += d.getHours() % 13 - 1;
    if(d.getMinutes() >= 30){
        id += 0xC;
    }
    return String.fromCodePoint(id);
}

function getTimeString(){
    let d = new Date();
    return `${getClock(d)} ${dateFormat(d, "hh:MM tt")}`;
}

client.on('message', message =>{
    if(message.content.match(/^!time\w*/g)){
        message.member.voice.channel.join();
        // Set time on join
        message.guild.me.setNickname(getTimeString());
        setTimeout(() => {
            // Set time before timeout begins
            message.guild.me.setNickname(getTimeString());
            setInterval(() => {
                // Update every minute
                message.guild.me.setNickname(getTimeString());
            }, 60000);
        }, (60-new Date().getSeconds())*1000);
    }
});

client.login(token);

// Code to test clock
// for(let x = 0; x<24; x++){
//     let d = new Date(2000, 1, 1, x*0.5+1, (x%2)*30);
//     console.log(dateFormat(d, "hh:MM:ss") + getClock(d));
// }