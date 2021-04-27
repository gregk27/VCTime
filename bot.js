import { token } from "./secrets.js";
import Discord, { DataResolver } from "discord.js";

const client = new Discord.Client();

client.once('ready', ()=>{
    console.log("Ready!");
})

function getTimeString(){
    let d = new Date();
    return `Time: ${d.getHours()}:${d.getMinutes()}`;
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
