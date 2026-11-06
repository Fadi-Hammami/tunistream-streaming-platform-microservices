/* ============================================================
   auth-service/server.js – PORT 3002
   ============================================================ */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Auth-Service : MongoDB connecté'))
    .catch(err => console.error('❌ MongoDB :', err.message));

app.use('/api/auth', require('./routes/auth'));
app.get('/', (req, res) => res.json({ service: 'Auth Service', port: 3002 }));

app.listen(process.env.PORT, () =>
    console.log(`🚀 Auth-Service démarré sur le port ${process.env.PORT}`)
);