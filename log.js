import fs from 'fs';
import { DateTime } from 'luxon';
const stream = fs.createWriteStream("./log.txt", {flags:'a'});

const toConsole = true;

export default function log(message){
    stream.write(DateTime.now().toISO()+"\t");
    stream.write(message);
    stream.write("\n");
    if(toConsole){
        console.log(message);
    }
}