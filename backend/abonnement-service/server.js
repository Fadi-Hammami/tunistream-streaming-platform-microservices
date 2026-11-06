/* abonnement-service/server.js – PORT 3003 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Abonnement-Service : MongoDB connecté'))
    .catch(err => console.error('❌ MongoDB :', err.message));

app.use('/api/abonnements', require('./routes/abonnements'));
app.get('/', (req, res) => res.json({ service: 'Abonnement Service', port: 3003 }));

app.listen(process.env.PORT, () =>
    console.log(`🚀 Abonnement-Service démarré sur le port ${process.env.PORT}`)
);