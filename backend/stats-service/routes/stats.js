/* ============================================================
   routes/stats.js – Statistiques Admin
   Agrège les données depuis les autres services via http natif
   
   GET /api/stats/summary → stats globales pour le dashboard admin
   ============================================================ */
const express = require('express');
const router = express.Router();
const http = require('http');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware.js');


/* Appel HTTP vers un microservice interne */
function callService(port, path, token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port,
            path,
            method: 'GET',
            headers: { Authorization: token }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(null); }
            });
        });

        req.on('error', () => resolve(null)); /* service éteint → null */
        req.end();
    });
}


/* GET /api/stats/summary */
router.get('/summary', authMiddleware, adminOnly, async (req, res) => {
    try {
        const token = req.headers['authorization'];

        /* Appels parallèles vers les 3 services */
        const [catalogueData, abonnementData, paiementData] = await Promise.all([
            callService(3001, '/api/catalogue', token),
            callService(3003, '/api/abonnements', token),
            callService(3004, '/api/paiements', token)
        ]);

        /* Calcul des statistiques */
        const abonnements = abonnementData?.abonnements || [];
        const paiements = paiementData?.paiements || [];
        const contenus = catalogueData?.contenus || [];

        const stats = {
            /* Catalogue */
            totalContenus: contenus.length,
            films: contenus.filter(c => c.type === 'film').length,
            series: contenus.filter(c => c.type === 'serie').length,
            documentaires: contenus.filter(c => c.type === 'documentaire').length,
            concerts: contenus.filter(c => c.type === 'concert').length,

            /* Abonnements */
            totalAbonnements: abonnements.length,
            abonnesActifs: abonnements.filter(a => a.statut === 'actif').length,
            planBasic: abonnements.filter(a => a.plan === 'basic' && a.statut === 'actif').length,
            planPremium: abonnements.filter(a => a.plan === 'premium' && a.statut === 'actif').length,

            /* Paiements */
            totalPaiements: paiements.length,
            revenuTotal: paiementData?.totalRevenu || 0,

            generatedAt: new Date().toISOString()
        };

        console.log('📊 Stats générées pour admin');
        res.json(stats);

    } catch (err) {
        res.status(500).json({ error: 'Erreur stats', detail: err.message });
    }
});

module.exports = router;