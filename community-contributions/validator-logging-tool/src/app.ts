import express from 'express';
import { getStatus } from './get-status';
import { log } from './debug';

const app = express();
const port = 3000;
app.get('/', async (req, res) => {
    let status = await getStatus();
    res.setHeader("Content-Type", "application/json");
    res.send(status);
});
app.listen(port, () => {
    log(`server started at http://localhost:${port}`);
});