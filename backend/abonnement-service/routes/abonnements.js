/* ============================================================
   routes/abonnements.js
   POST   /api/abonnements          → souscrire à un plan
   GET    /api/abonnements/mon-plan → voir son abonnement actif
   DELETE /api/abonnements/annuler  → résilier son abonnement actif
   GET    /api/abonnements          → liste tous (admin)
   PUT    /api/abonnements/:id      → modifier statut (admin)
   ============================================================ */
const express = require('express');
const router = express.Router();
const Abonnement = require('../models/Abonnement');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');


/* POST / – Souscrire à un plan */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { plan } = req.body;

        console.log('📥 Souscription reçue :', { plan, user: req.user });

        /* Annuler tout abonnement actif existant */
        await Abonnement.updateMany(
            { userId: String(req.user.id), statut: 'actif' },
            { statut: 'annulé' }
        );

        const abo = new Abonnement({
            userId: String(req.user.id),    /* ✅ forcer String */
            userNom: req.user.nom,
            userEmail: req.user.email,
            plan: plan || 'basic'
        });

        await abo.save();

        console.log(`✅ Abonnement ${abo.plan} créé – ${abo.prix} DT/mois`);
        res.status(201).json({ message: `Abonnement ${abo.plan} activé`, abonnement: abo });

    } catch (err) {
        console.error('❌ Erreur POST abonnement :', err.message);
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* GET /mon-plan – Voir son abonnement actif */
router.get('/mon-plan', authMiddleware, async (req, res) => {
    try {
        const abo = await Abonnement.findOne({
            userId: String(req.user.id),
            statut: 'actif'
        });
        if (!abo) return res.json({ plan: null, message: 'Aucun abonnement actif' });
        res.json(abo);
    } catch (err) {
        console.error('❌ Erreur GET mon-plan :', err.message);
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* DELETE /annuler – Résilier son abonnement actif */
router.delete('/annuler', authMiddleware, async (req, res) => {
    try {
        const abo = await Abonnement.findOneAndUpdate(
            { userId: String(req.user.id), statut: 'actif' },
            { statut: 'annulé' },
            { new: true }
        );

        if (!abo) {
            return res.status(404).json({ error: 'Aucun abonnement actif à résilier' });
        }

        console.log(`🚫 Abonnement ${abo.plan} annulé – userId: ${req.user.id}`);
        res.json({ message: `Abonnement ${abo.plan.toUpperCase()} résilié avec succès` });

    } catch (err) {
        console.error('❌ Erreur DELETE /annuler :', err.message);
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* GET / – Tous les abonnements (admin) */
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const abos = await Abonnement.find().sort({ createdAt: -1 });
        res.json({ total: abos.length, abonnements: abos });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* PUT /:id – Modifier statut (admin) */
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const abo = await Abonnement.findByIdAndUpdate(
            req.params.id,
            { statut: req.body.statut },
            { new: true }
        );
        if (!abo) return res.status(404).json({ error: 'Abonnement non trouvé' });
        res.json({ message: 'Statut mis à jour', abonnement: abo });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});

module.exports = router;