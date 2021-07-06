import express from 'express';
import http from 'http';
import WebSocket from 'ws'
import { getStatus, getStatusWs } from './get-status';
import { log } from './debug';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;
let shouldStop = false;

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (message: string) => {
        if (message === 'stop') {
            shouldStop = true;
            return
        }
        let rawMsg = message.split('|')
        const address = rawMsg[0]
        const startBlock = parseInt(rawMsg[1])
        const endBlock = parseInt(rawMsg[2])
        console.log(`Load Era Stats for address [${address}]. Load stats starting from block [${startBlock}] to block [${endBlock}]`);
        if (startBlock < endBlock) {
            for (let blockHeight = startBlock; blockHeight <= endBlock; blockHeight += 1) {
                if (shouldStop) {
                    shouldStop = false;
                    break;
                }
                
                let status = await getStatusWs(address, blockHeight);
                if (status) {
                    ws.send(JSON.stringify(status));
                }
            }
        } else {
            for (let blockHeight = endBlock; blockHeight >= startBlock; blockHeight -= 1) {
                if (shouldStop) {
                    shouldStop = false;
                    break;
                }
                let status = await getStatusWs(address, blockHeight);
                if (status) {
                    ws.send(JSON.stringify(status));
                }
            }
        }
    });
});

app.get('/', async (req, res) => {
    res.send("Hello, Joystream!");
});
app.get('/validators/:address', async (req, res) => {
    let status = await getStatus(req.params.address);
    res.setHeader("Content-Type", "application/json");
    res.send(status);
});
server.listen(port, () => {
    log(`WS server started at http://localhost:${port}`);
});