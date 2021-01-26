import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

const kafka = new Kafka({
    brokers: ['host:port'],
    clientId: 'svc-login-00',
})

const topic = 'LOGIN-REQ'
const consumer = kafka.consumer({ groupId: 'LOGIN-SERVICE-GROUP' })

const producer = kafka.producer();

async function run() {
    await consumer.connect()
    await producer.connect()
    await consumer.subscribe({ topic })
    
    await consumer.run({
        eachMessage: async ({ topic, partition, message}) => {
            if(message.value != null){
            const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
            console.log(`- ${prefix} ${message.key}#${message.value}*${message.headers.correlation_id}`)
            
            const payload = JSON.parse(message.value);
            payload.token = uuidv4();
            console.log(payload);

            
            // setTimeout(() => {
            producer.send({
                topic: 'GATEWAY-RES-00',
                messages: [
                    { 
                        value: JSON.stringify(payload),
                        headers: {
                            'correlation_id': message.headers.correlation_id.toString(),
                          }
                    }
                ]
            })
        }
            // }, 3000);
        },
    })
}

run().catch(console.error)