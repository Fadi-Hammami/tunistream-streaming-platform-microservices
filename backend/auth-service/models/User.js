/* ============================================================
   models/User.js – Utilisateurs TuniStream
   Rôles : abonne | admin
   ============================================================ */
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['abonne', 'admin'], default: 'abonne' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);