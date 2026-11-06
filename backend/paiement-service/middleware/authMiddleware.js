/* ============================================================
   middleware/authMiddleware.js
   Vérifie le token JWT dans le header Authorization
   Utilisé par : catalogue, abonnement, paiement, stats
   ============================================================ */
const jwt = require('jsonwebtoken');

/* Tout utilisateur connecté */
function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'Token manquant' });

    const token = header.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token invalide ou expiré' });
    }
}

/* Admin seulement */
function adminOnly(req, res, next) {
    if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Accès réservé aux admins' });
    next();
}

/* Abonné ou admin */
function abonneOrAdmin(req, res, next) {
    if (!['abonne', 'admin'].includes(req.user.role))
        return res.status(403).json({ error: 'Accès réservé aux abonnés' });
    next();
}

module.exports = { authMiddleware, adminOnly, abonneOrAdmin };