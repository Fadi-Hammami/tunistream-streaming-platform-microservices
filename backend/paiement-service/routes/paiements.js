/* ============================================================
   routes/paiements.js – CORRIGÉ
   POST /api/paiements              → enregistrer un paiement
   GET  /api/paiements/mes-paiements → historique personnel
   GET  /api/paiements              → tous (admin)
   ============================================================ */
const express = require('express');
const router = express.Router();
const Paiement = require('../models/Paiement');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');


/* POST / – Enregistrer un paiement */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { montant, plan, methodePaie } = req.body;

        console.log('📥 Paiement reçu :', { montant, plan, methodePaie, user: req.user.email });

        /* ✅ Forcer montant en Number (évite erreur si envoyé en String) */
        const montantNum = Number(montant);
        if (isNaN(montantNum) || montantNum <= 0) {
            return res.status(400).json({ error: 'Montant invalide' });
        }

        const paiement = new Paiement({
            userId: String(req.user.id),   /* ✅ forcer String */
            userEmail: req.user.email,
            montant: montantNum,
            plan: plan || 'basic',
            methodePaie: methodePaie || 'carte',
            statut: 'payé'
        });

        await paiement.save();
        console.log(`💳 Paiement enregistré : ${paiement.reference} – ${paiement.montant} DT`);

        res.status(201).json({
            message: 'Paiement enregistré',
            reference: paiement.reference,
            montant: paiement.montant,
            statut: paiement.statut
        });

    } catch (err) {
        console.error('❌ Erreur POST paiement :', err.message);
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* GET /mes-paiements – Historique personnel */
router.get('/mes-paiements', authMiddleware, async (req, res) => {
    try {
        const paiements = await Paiement.find({
            userId: String(req.user.id)
        }).sort({ createdAt: -1 });

        res.json({ total: paiements.length, paiements });
    } catch (err) {
        console.error('❌ Erreur GET mes-paiements :', err.message);
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* GET / – Tous les paiements (admin) */
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const paiements = await Paiement.find().sort({ createdAt: -1 });
        const total = paiements.reduce((sum, p) => sum + p.montant, 0);
        res.json({ total: paiements.length, totalRevenu: total, paiements });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});

module.exports = router;