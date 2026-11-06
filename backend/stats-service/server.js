/* stats-service/server.js – PORT 3005
   Pas de MongoDB direct → agrège depuis les autres services */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/stats', require('./routes/stats'));
app.get('/', (req, res) => res.json({ service: 'Stats Service', port: 3005 }));

app.listen(process.env.PORT, () =>
    console.log(`🚀 Stats-Service démarré sur le port ${process.env.PORT}`)
);