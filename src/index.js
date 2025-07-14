if (process.env.NODE_ENV === "test") {
    require("dotenv").config({ path: ".test.env" });
} else if (process.env.NODE_ENV === "development") {
    require("dotenv").config({ path: ".dev.env" });
} else if (process.env.NODE_ENV === "stage") {
    require("dotenv").config({ path: ".stage.env" });
} else if (process.env.NODE_ENV === "production") {
    require("dotenv").config({ path: ".prod.env" });
} else if (process.env.NODE_ENV === "beta") {
    require("dotenv").config({ path: ".beta.env" });
}

const app = require("./app");
const port = process.env.SERVICE_PORT;
const { connecToRedis } = require("../redis");
const { kafKaStarter } = require("./utils/kafka");
const removeRedis = require("./utils/removeRedis");
const dbConnection = require("./utils/dbConnection");
const fixer = require("./fixer");

const startService = async () => {
    try {

        await kafKaStarter();
        await dbConnection();
        await connecToRedis();
        await removeRedis("userSockets");
        await removeRedis("socketUser");

        // await fixer();


        app.listen(port, () => {
            console.log(`Service started on ${port}`);
        });
    } catch (e) {
        console.log(e);
    }
}

startService();