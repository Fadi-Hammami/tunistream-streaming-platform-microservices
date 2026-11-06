/* ============================================================
   routes/auth.js
   POST /api/auth/register  → créer un compte
   POST /api/auth/login     → connexion + token JWT
   ============================================================ */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/* REGISTER */
router.post('/register', async (req, res) => {
    try {
        const { nom, email, password, role } = req.body;

        const existant = await User.findOne({ email });
        if (existant) return res.status(400).json({ error: 'Email déjà utilisé' });

        const hash = await bcrypt.hash(password, 10);
        const user = new User({ nom, email, password: hash, role });
        await user.save();

        res.status(201).json({
            message: 'Compte créé',
            user: { id: user._id, nom: user.nom, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});

/* LOGIN */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        const valide = await bcrypt.compare(password, user.password);
        if (!valide) return res.status(401).json({ error: 'Mot de passe incorrect' });

        const token = jwt.sign(
            { id: user._id, role: user.role, nom: user.nom, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: { id: user._id, nom: user.nom, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur', detail: err.message });
    }
});

module.exports = router;