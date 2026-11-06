/* ============================================================
   models/Contenu.js – Catalogue TuniStream
   Types : film | documentaire | serie | concert
   Accès : basic (films+docs) | premium (tout)
   ============================================================ */
const mongoose = require('mongoose');

const ContenuSchema = new mongoose.Schema({
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, default: 'film' },   /* film | documentaire | serie | concert */
    duree: { type: Number, default: 0 },         /* en minutes */
    annee: { type: Number },
    realisateur: { type: String },
    accesPlan: { type: String, default: 'basic' },   /* basic | premium */
    image: { type: String, default: '' },        /* URL affiche */
    disponible: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Contenu', ContenuSchema);