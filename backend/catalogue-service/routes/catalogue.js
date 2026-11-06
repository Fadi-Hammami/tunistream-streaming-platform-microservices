/* ============================================================
   routes/catalogue.js
   GET    /api/catalogue        → liste publique (titres + type)
   GET    /api/catalogue/:id    → détail (abonné ou admin)
   POST   /api/catalogue        → ajouter un contenu (admin)
   PUT    /api/catalogue/:id    → modifier (admin)
   DELETE /api/catalogue/:id    → supprimer (admin)
   ============================================================ */
const express = require('express');
const router = express.Router();
const Contenu = require('../models/contenu');
const { authMiddleware, adminOnly, abonneOrAdmin } = require('../middleware/authMiddleware');


/* GET / – Catalogue public (pas besoin d'être connecté) */
router.get('/', async (req, res) => {
    try {
        /* Filtre optionnel par type : ?type=film */
        const filtre = req.query.type ? { type: req.query.type, disponible: true } : { disponible: true };
        const contenus = await Contenu.find(filtre, 'titre type annee accesPlan image duree').sort({ createdAt: -1 });
        res.json({ total: contenus.length, contenus });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* GET /:id – Détail complet (abonné ou admin seulement) */
router.get('/:id', authMiddleware, abonneOrAdmin, async (req, res) => {
    try {
        const contenu = await Contenu.findById(req.params.id);
        if (!contenu) return res.status(404).json({ error: 'Contenu non trouvé' });
        res.json(contenu);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* POST / – Ajouter un contenu (admin) */
router.post('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const contenu = new Contenu(req.body);
        await contenu.save();
        console.log(`✅ Contenu ajouté : ${contenu.titre}`);
        res.status(201).json({ message: 'Contenu ajouté', contenu });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* PUT /:id – Modifier (admin) */
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const contenu = await Contenu.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!contenu) return res.status(404).json({ error: 'Contenu non trouvé' });
        res.json({ message: 'Contenu modifié', contenu });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});


/* DELETE /:id – Supprimer (admin) */
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const contenu = await Contenu.findByIdAndDelete(req.params.id);
        if (!contenu) return res.status(404).json({ error: 'Contenu non trouvé' });
        res.json({ message: 'Contenu supprimé' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});

module.exports = router;