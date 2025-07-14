const { consumer } = require('./kafka');

const consumeMessage = async (topicsControllers,io) => {
    try {
        for (const topic of Object.keys(topicsControllers)) {
            console.log({"consumer topic":topic})
            await consumer.subscribe({ topic, fromBeginning: true });
        }

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const controller = topicsControllers[topic];
                if (controller) {
                    const tryListenerCount = Number(process.env.TYR_LISTENER_COUNT);

                    for (let index = 0; index < tryListenerCount; index++) {
                        const response = await controller(topic, partition, message.value.toString(), io);
                        if(response !== true) break; 
                    }         
                }
            },
        });
    } catch (error) {
        console.log({error});
    }
};

module.exports = consumeMessage;