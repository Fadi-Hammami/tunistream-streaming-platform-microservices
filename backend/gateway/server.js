/* ============================================================
   gateway/server.js – API Gateway TuniStream – PORT 3000

   Rôle :
   → Point d'entrée UNIQUE pour le frontend
   → Redirige chaque requête vers le bon microservice
   → Vérifie le token JWT avant de transmettre
   → Le frontend n'a plus besoin de connaître les ports internes

   Table de routage :
   POST /api/auth/register      → auth-service        :3002
   POST /api/auth/login         → auth-service        :3002
   GET  /api/catalogue          → catalogue-service   :3001
   POST /api/catalogue          → catalogue-service   :3001
   PUT  /api/catalogue/:id      → catalogue-service   :3001
   DELETE /api/catalogue/:id    → catalogue-service   :3001
   GET  /api/abonnements/...    → abonnement-service  :3003
   POST /api/abonnements        → abonnement-service  :3003
   GET  /api/paiements/...      → paiement-service    :3004
   POST /api/paiements          → paiement-service    :3004
   GET  /api/stats/...          → stats-service       :3005
   ============================================================ */

const express = require('express');
const http = require('http');   /* module natif Node.js */
const url = require('url');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


/* ── ROUTES PUBLIQUES (sans token) ───────────────────────────
   Ces routes sont accessibles sans être connecté
──────────────────────────────────────────────────────────── */
const ROUTES_PUBLIQUES = [
    { method: 'POST', path: '/api/auth/register' },
    { method: 'POST', path: '/api/auth/login' },
    { method: 'GET', path: '/api/catalogue' },  /* catalogue public */
];

function estPublique(method, path) {
    return ROUTES_PUBLIQUES.some(r =>
        r.method === method && path.startsWith(r.path)
    );
}


/* ── MIDDLEWARE JWT ──────────────────────────────────────────
   Vérifie le token sur toutes les routes protégées
   Injecte les infos user dans les headers transmis au service
──────────────────────────────────────────────────────────── */
function verifierToken(req, res, next) {
    /* Routes publiques → passer directement */
    if (estPublique(req.method, req.path)) return next();

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Token manquant – Connectez-vous' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;     /* disponible pour les logs */
        next();
    } catch {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
}

app.use(verifierToken);


/* ── FONCTION PROXY ──────────────────────────────────────────
   Transmet la requête au microservice cible
   et retourne la réponse au frontend

   Paramètres :
   - req        → requête Express entrante
   - res        → réponse Express à renvoyer
   - serviceUrl → URL du microservice cible (ex: http://localhost:3001)
──────────────────────────────────────────────────────────── */
function proxy(req, res, serviceUrl) {
    const parsed = url.parse(serviceUrl);
    const body = JSON.stringify(req.body);

    /* Construction des headers à transmettre */
    const headersProxy = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    };

    /* Transmettre le token JWT si présent */
    if (req.headers['authorization']) {
        headersProxy['Authorization'] = req.headers['authorization'];
    }

    const options = {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.path,
        method: req.method,
        headers: headersProxy
    };

    console.log(`🔀 ${req.method} ${req.path} → ${serviceUrl}`);

    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => { data += chunk; });
        proxyRes.on('end', () => {
            res.status(proxyRes.statusCode);

            /* Transmettre le Content-Type de la réponse */
            if (proxyRes.headers['content-type']) {
                res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }

            /* Parser et renvoyer le JSON */
            try {
                res.json(JSON.parse(data));
            } catch {
                res.send(data);
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.error(`❌ Service inaccessible : ${serviceUrl}`, err.message);
        res.status(503).json({
            error: 'Service temporairement indisponible',
            service: serviceUrl,
            detail: err.message
        });
    });

    proxyReq.write(body);
    proxyReq.end();
}


/* ── TABLE DE ROUTAGE ────────────────────────────────────────
   Chaque pattern → microservice correspondant
──────────────────────────────────────────────────────────── */
const SERVICES = {
    AUTH: process.env.AUTH_URL,
    CATALOGUE: process.env.CATALOGUE_URL,
    ABONNEMENT: process.env.ABONNEMENT_URL,
    PAIEMENT: process.env.PAIEMENT_URL,
    STATS: process.env.STATS_URL
};


/* ── AUTH ────────────────────────────────────────────────── */
app.all('/api/auth/*path', (req, res) => {
    proxy(req, res, `${SERVICES.AUTH}${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`);
});


/* ── CATALOGUE ───────────────────────────────────────────── */
app.all('/api/catalogue{/*path}', (req, res) => {
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    proxy(req, res, `${SERVICES.CATALOGUE}${req.path}${query}`);
});


/* ── ABONNEMENTS ─────────────────────────────────────────── */
app.all('/api/abonnements{/*path}', (req, res) => {
    proxy(req, res, `${SERVICES.ABONNEMENT}${req.path}`);
});


/* ── PAIEMENTS ───────────────────────────────────────────── */
app.all('/api/paiements{/*path}', (req, res) => {
    proxy(req, res, `${SERVICES.PAIEMENT}${req.path}`);
});


/* ── STATS ───────────────────────────────────────────────── */
app.all('/api/stats{/*path}', (req, res) => {
    proxy(req, res, `${SERVICES.STATS}${req.path}`);
});


/* ── Route racine ────────────────────────────────────────── */
app.get('/', (req, res) => {
    res.json({
        service: 'API Gateway – TuniStream',
        port: 3000,
        routes: {
            auth: '/api/auth/*        → :3002',
            catalogue: '/api/catalogue*    → :3001',
            abonnements: '/api/abonnements*  → :3003',
            paiements: '/api/paiements*    → :3004',
            stats: '/api/stats*        → :3005'
        }
    });
});

/* ── Route inconnue ─────────────────────────────────────── */
app.use((req, res) => {
    res.status(404).json({ error: `Route inconnue : ${req.method} ${req.path}` });
});


/* ── DÉMARRAGE ───────────────────────────────────────────── */
app.listen(process.env.PORT, () => {
    console.log('');
    console.log('🚀 API Gateway démarrée sur le port', process.env.PORT);
    console.log('');
    console.log('  Table de routage :');
    console.log('  /api/auth/*        →  Auth-Service        :3002');
    console.log('  /api/catalogue*    →  Catalogue-Service   :3001');
    console.log('  /api/abonnements*  →  Abonnement-Service  :3003');
    console.log('  /api/paiements*    →  Paiement-Service    :3004');
    console.log('  /api/stats*        →  Stats-Service       :3005');
    console.log('');
});