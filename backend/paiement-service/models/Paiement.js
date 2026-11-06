/* ============================================================
   models/Paiement.js – VERSION FINALE
   BASE ISOLÉE : tunistream_pay
   ============================================================ */
const mongoose = require('mongoose');

const PaiementSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userEmail: { type: String },
    montant: { type: Number, required: true },
    plan: { type: String, default: 'basic' },
    methodePaie: { type: String, default: 'carte' },
    statut: { type: String, default: 'paye' },
    reference: { type: String }
}, { timestamps: true });

/* ✅ Compatibilité Mongoose 9 : async sans next */
PaiementSchema.pre('save', async function () {
    if (!this.reference) {
        this.reference = 'PAY-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
    }
    console.log('💾 Sauvegarde paiement :', {
        userId: this.userId,
        montant: this.montant,
        plan: this.plan,
        reference: this.reference
    });
});

module.exports = mongoose.model('Paiement', PaiementSchema);