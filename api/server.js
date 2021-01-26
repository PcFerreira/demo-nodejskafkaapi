import express from 'express';
import { Kafka, logLevel } from 'kafkajs';
import routes from './routes.js';
import events from 'events';
import eventHandler from './eventHandler.js';


const app = express();
app.use(express.json());
app.use(express.urlencoded());


/**
 * Faz conexão com o Kafka
 */
const kafka = new Kafka({
  clientId: 'api',
  brokers: ['host:port'],
  retry: {
    initialRetryTime: 300,
    retries: 10
  },
});
 
const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: 'GATEWAY-CONSUMER-00' })

/**
 * Disponibiliza o producer para todas rotas
 */
app.use((req, res, next) => {
  req.producer = producer;
  return next();
})

/**
 * Disponibiliza o consumer para todas as rotas
 */
app.use((req, res, next) => {
    req.consumer = consumer;
    return next();
})


/**
 * Cadastra as rotas da aplicação
 */
app.use(routes);

function sendEvent(process, value){
  eventHandler.emit(process, value);
}

async function run() {
  await producer.connect()
  await consumer.connect()

  await consumer.subscribe({ topic: 'GATEWAY-RES-00', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      let messageContent = message.value.toString();
      sendEvent(message.headers.correlation_id, messageContent)
      console.log('Resposta', messageContent);
    },
  });


  app.listen(3333);
  console.log(`APP INICIADO NA PORTA ${3333}`)
}

run().catch(console.error)
