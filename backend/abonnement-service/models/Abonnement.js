/* ============================================================
   models/Abonnement.js – CORRIGÉ
   userId en String (pas ObjectId) → compatible avec le JWT
   ============================================================ */
const mongoose = require('mongoose');

const AbonnementSchema = new mongoose.Schema({
    userId: { type: String, required: true },  /* ✅ String au lieu de ObjectId */
    userNom: { type: String },
    userEmail: { type: String },
    plan: { type: String, default: 'basic' },
    prix: { type: Number },
    statut: { type: String, default: 'actif' },
    dateDebut: { type: Date, default: Date.now },
    dateFin: { type: Date }
}, { timestamps: true });

/* Calcule prix et date de fin automatiquement */
AbonnementSchema.pre('save', async function () {
    const prix = { basic: 9, premium: 19 };
    this.prix = prix[this.plan] || 9;

    if (!this.dateFin) {
        const fin = new Date(this.dateDebut);
        fin.setDate(fin.getDate() + 30);
        this.dateFin = fin;
    }

    console.log('💾 Sauvegarde abonnement :', {
        userId: this.userId,
        userNom: this.userNom,
        plan: this.plan,
        prix: this.prix,
        statut: this.statut,
        dateFin: this.dateFin
    });
});

module.exports = mongoose.model('Abonnement', AbonnementSchema);