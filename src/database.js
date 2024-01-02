/*
  _                                                  
 | |                                                 
 | |_ ___ _ __ ___  _ __   ___  _ __ __ _ _ __ _   _ 
 | __/ _ \ '_ ` _ \| '_ \ / _ \| '__/ _` | '__| | | |
 | ||  __/ | | | | | |_) | (_) | | | (_| | |  | |_| |
  \__\___|_| |_| |_| .__/ \___/|_|  \__,_|_|   \__, |
     | |     | |   | || |                       __/ |
   __| | __ _| |_ _|_|| |__   __ _ ___  ___    |___/ 
  / _` |/ _` | __/ _` | '_ \ / _` / __|/ _ \         
 | (_| | (_| | || (_| | |_) | (_| \__ \  __/         
  \__,_|\__,_|\__\__,_|_.__/ \__,_|___/\___|         
     | |    (_)                                      
   __| |_ __ ___   _____ _ __                        
  / _` | '__| \ \ / / _ \ '__|                       
 | (_| | |  | |\ V /  __/ |                          
  \__,_|_|  |_| \_/ \___|_|                          

  I PROMISE I WILL USE MYSQL AT SOME POINT
*/

const fs = require('fs');
const path = require('path');

const database_file = path.join(__dirname, '../database.json');

module.exports = {
    read() {
        const str = fs.readFileSync(database_file);
        return JSON.parse(str);
    },
    write(data) {
        fs.writeFileSync(database_file, JSON.stringify(data));
    },
    get(key) {
        return this.read()[key];
    },
    set(key, value) {
        const data = this.read();
        data[key] = value;
        this.write(data);
    },
    has(key) {
        const data = this.read();
        return key in data;
    }
}