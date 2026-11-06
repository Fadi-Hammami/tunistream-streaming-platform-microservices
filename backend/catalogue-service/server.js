/* catalogue-service/server.js – PORT 3001 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Catalogue-Service : MongoDB connecté'))
    .catch(err => console.error('❌ MongoDB :', err.message));

app.use('/api/catalogue', require('./routes/catalogue'));
app.get('/', (req, res) => res.json({ service: 'Catalogue Service', port: 3001 }));

app.listen(process.env.PORT, () =>
    console.log(`🚀 Catalogue-Service démarré sur le port ${process.env.PORT}`)
);