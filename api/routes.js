import express from 'express';
import CompressionTypes  from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
const routes = express.Router();
import events from 'events';
import eventHandler from './eventHandler.js';

routes.post('/login', async (req, res) => {
  console.log(req.body);
  const message = req.body;
  let requestUUID = uuidv4();
  console.log('REQUEST: ' + requestUUID.toString());

  let response
  let responseID

  if (process.pid) {
    console.log('This process is your pid ' + process.pid);
  }
 


  // Chamar micro serviço
  req.producer.send({
    topic: 'LOGIN-REQ',
    compression: CompressionTypes.GZIP,
    messages: [
      { 
        value: JSON.stringify(message),
        headers: {
          'correlation_id': requestUUID,
        }
      }
    ],
  })

  eventHandler.on(requestUUID, (value) => {
    console.log(value);
    console.log('an event occurred!');
    return res.send(value);
  });





});

export default routes;