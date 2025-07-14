const { client } = require("../../redis");

const removeRedis = async (key) => {  
    const pattern = key+":*";
    let cursor = "0";

    try {
        do {
            let scanType = "normal";
            let reply = await client.scan(cursor, {"MATCH": pattern, "COUNT": 100});
            let keys = reply.keys;
            if(keys.length === 0){
                reply = await client.hScan(key,cursor, {"MATCH": "*", "COUNT": 100});
                scanType = "hash";
            }
    
            keys = reply.keys ? reply.keys : reply.tuples;
            if(keys.length === 0) break;
            
            cursor = reply.cursor;
            
            if (keys.length > 0) {
                if(scanType=="normal") await client.del(...keys);
                if(scanType=="hash"){
                    for (let i = 0; i < keys.length; i++) {
                        const field = keys[i].field;
                        await client.hDel(key,field);
                    }
                }
            }
        } while (cursor != "0");
        
        console.log("Tüm userSockets anahtarları silindi!");
           
    } catch (error) {
        console.log(error)
    }

}

module.exports = removeRedis;