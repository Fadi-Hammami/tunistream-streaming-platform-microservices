/* ============================================================
   paiement-service/server.js – PORT 3004
   
   ⚠️  BASE DE DONNÉES ISOLÉE : tunistream_pay
   Condition du TP : les données de paiement ne doivent
   JAMAIS transiter ou être stockées avec les données métier
   ============================================================ */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

/* Connexion à la base SÉPARÉE tunistream_pay */
mongoose.connect(process.env.MONGO_URI_PAY)
    .then(() => console.log('✅ Paiement-Service : MongoDB isolé connecté (tunistream_pay)'))
    .catch(err => console.error('❌ MongoDB paiement :', err.message));

app.use('/api/paiements', require('./routes/paiements'));
app.get('/', (req, res) => res.json({
    service: 'Paiement Service',
    port: 3004,
    db: 'tunistream_pay (isolée)'
}));

app.listen(process.env.PORT, () =>
    console.log(`🚀 Paiement-Service démarré sur le port ${process.env.PORT}`)
);