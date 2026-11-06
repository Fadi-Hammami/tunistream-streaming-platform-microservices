/* ============================================================
   script.js – TuniStream Frontend
   Communique avec :
   :3001 Catalogue | :3002 Auth | :3003 Abonnements
   :3004 Paiements | :3005 Stats
   ============================================================ */

const API = {
    catalogue: 'http://localhost:3001/api/catalogue',
    auth: 'http://localhost:3002/api/auth',
    abonnements: 'http://localhost:3003/api/abonnements',
    paiements: 'http://localhost:3004/api/paiements',
    stats: 'http://localhost:3005/api/stats'
};

let token = null;
let userRole = null;
let userName = null;


/* ── UTILITAIRES ─────────────────────────────────────────── */

function headers() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.remove('hidden');
}

function showTab(tab) {
    document.getElementById('formLogin').classList.toggle('hidden', tab !== 'login');
    document.getElementById('formRegister').classList.toggle('hidden', tab !== 'register');
    document.getElementById('tab-login').className = `flex-1 py-3 text-sm font-semibold transition ${tab === 'login' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`;
    document.getElementById('tab-register').className = `flex-1 py-3 text-sm font-semibold transition ${tab === 'register' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`;
}

function showSection(nom) {
    /* Cache toutes les sections */
    ['Catalogue', 'Abonnement', 'Paiement', 'Stats'].forEach(s => {
        document.getElementById('section' + s).classList.add('hidden');
        const btn = document.getElementById('tab-' + s.toLowerCase());
        if (btn) btn.classList.remove('tab-active');
    });
    /* Affiche la section demandée */
    document.getElementById('section' + nom.charAt(0).toUpperCase() + nom.slice(1)).classList.remove('hidden');
    const btn = document.getElementById('tab-' + nom);
    if (btn) btn.classList.add('tab-active');

    /* Charge les données selon la section */
    if (nom === 'catalogue') chargerCatalogue('');
    if (nom === 'abonnement') chargerMonPlan();
    if (nom === 'paiement') chargerPaiements();
    if (nom === 'stats') chargerStats();
}

function toggleFormContenu() {
    document.getElementById('formContenu').classList.toggle('hidden');
}


/* ── AUTH ────────────────────────────────────────────────── */

async function register() {
    const nom = document.getElementById('reg-nom').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-mdp').value;
    const role = document.getElementById('reg-role').value;
    try {
        const res = await fetch(`${API.auth}/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, email, password, role })
        });
        const data = await res.json();
        if (!res.ok) return showError('reg-error', data.error);
        alert('✅ Compte créé ! Connectez-vous.');
        showTab('login');
    } catch { showError('reg-error', '❌ Serveur inaccessible'); }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-mdp').value;
    try {
        const res = await fetch(`${API.auth}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) return showError('login-error', data.error);

        token = data.token;
        userRole = data.user.role;
        userName = data.user.nom;

        afficherApp();
    } catch { showError('login-error', '❌ Serveur inaccessible'); }
}

function logout() {
    token = null; userRole = null; userName = null;
    document.getElementById('sectionAuth').classList.remove('hidden');
    ['Catalogue', 'Abonnement', 'Paiement', 'Stats'].forEach(s =>
        document.getElementById('section' + s).classList.add('hidden'));
    document.getElementById('navTabs').classList.add('hidden');
    document.getElementById('userBar').classList.add('hidden');
}

function afficherApp() {
    document.getElementById('sectionAuth').classList.add('hidden');
    document.getElementById('navTabs').classList.remove('hidden');
    document.getElementById('userBar').classList.remove('hidden');
    document.getElementById('navNom').textContent = userName;
    document.getElementById('navRole').textContent = `(${userRole})`;

    /* ── GESTION DES DROITS PAR RÔLE ─────────────────────────
       admin  → voit tout : Stats Admin + bouton ajouter contenu
       abonne → voit seulement Catalogue, Abonnement, Paiement
    ────────────────────────────────────────────────────────── */
    if (userRole === 'admin') {
        /* Affiche les éléments réservés admin */
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    } else {
        /* Abonné : cache TOUS les éléments admin */
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
        /* Cache la zone ajout contenu au cas où elle serait visible */
        const zoneAdmin = document.getElementById('zoneAdmin');
        if (zoneAdmin) zoneAdmin.classList.add('hidden');
    }

    showSection('catalogue');
}


/* ── CATALOGUE ───────────────────────────────────────────── */

async function chargerCatalogue(type) {
    try {
        const url = type ? `${API.catalogue}?type=${type}` : API.catalogue;
        const res = await fetch(url);
        const data = await res.json();

        const grid = document.getElementById('gridCatalogue');

        /* Bouton ajout uniquement pour l admin */
        const zoneAdmin = document.getElementById('zoneAdmin');
        if (userRole === 'admin') {
            zoneAdmin.classList.remove('hidden');  /* admin → visible */
        } else {
            zoneAdmin.classList.add('hidden');     /* abonne → toujours caché */
        }

        if (!data.contenus || data.contenus.length === 0) {
            grid.innerHTML = '<p class="text-gray-500 col-span-4 text-center py-12">Aucun contenu disponible</p>';
            return;
        }

        grid.innerHTML = data.contenus.map(c => `
      <div class="card-contenu bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-pointer"
           onclick="voirDetail('${c._id}')">
        <div class="h-36 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-4xl">
          ${c.type === 'film' ? '🎬' : c.type === 'serie' ? '📺' : c.type === 'concert' ? '🎵' : '🎥'}
        </div>
        <div class="p-3">
          <p class="font-semibold text-sm truncate">${c.titre}</p>
          <div class="flex items-center justify-between mt-1">
            <span class="text-gray-400 text-xs capitalize">${c.type}</span>
            <span class="badge-${c.accesPlan}">${c.accesPlan}</span>
          </div>
          ${c.duree ? `<p class="text-gray-500 text-xs mt-1">${c.duree} min</p>` : ''}
        </div>
      </div>
    `).join('');

    } catch {
        document.getElementById('gridCatalogue').innerHTML =
            '<p class="text-red-400 col-span-4 text-center py-8">❌ Catalogue inaccessible</p>';
    }
}

async function voirDetail(id) {
    if (!token) return alert('Connectez-vous pour voir les détails');
    try {
        const res = await fetch(`${API.catalogue}/${id}`, { headers: headers() });
        const c = await res.json();
        if (!res.ok) return alert(c.error || 'Accès refusé');
        alert(`🎬 ${c.titre}\n\n${c.description}\n\nType : ${c.type}\nDurée : ${c.duree} min\nAnnée : ${c.annee}\nRéalisateur : ${c.realisateur}\nPlan requis : ${c.accesPlan}`);
    } catch { alert('❌ Erreur de chargement'); }
}

async function ajouterContenu() {
    try {
        const body = {
            titre: document.getElementById('c-titre').value,
            description: document.getElementById('c-desc').value,
            type: document.getElementById('c-type').value,
            duree: parseInt(document.getElementById('c-duree').value) || 0,
            annee: parseInt(document.getElementById('c-annee').value) || 0,
            realisateur: document.getElementById('c-real').value,
            accesPlan: document.getElementById('c-plan').value
        };
        const res = await fetch(API.catalogue, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) return alert('❌ ' + data.error);
        alert('✅ Contenu ajouté !');
        document.getElementById('formContenu').classList.add('hidden');
        chargerCatalogue('');
    } catch { alert('❌ Erreur serveur'); }
}


/* ── ABONNEMENT ──────────────────────────────────────────── */

async function chargerMonPlan() {
    try {
        const res = await fetch(`${API.abonnements}/mon-plan`, { headers: headers() });
        const data = await res.json();
        const zone = document.getElementById('monPlan');
        const btnResil = document.getElementById('zoneResiliation');

        if (!data.plan) {
            zone.innerHTML = '<p class="text-gray-400">Vous n\'avez pas d\'abonnement actif.</p>';
            btnResil.classList.add('hidden');   /* pas d'abonnement → cacher le bouton */
        } else {
            zone.innerHTML = `
        <p class="text-gray-300">Abonnement actuel :
          <span class="badge-${data.plan} ml-2">${data.plan.toUpperCase()}</span>
          <span class="text-gray-400 ml-2 text-xs">– ${data.prix} DT/mois</span>
        </p>
        <p class="text-gray-500 text-xs mt-1">Expire le : ${new Date(data.dateFin).toLocaleDateString('fr-FR')}</p>
      `;
            btnResil.classList.remove('hidden'); /* abonnement actif → afficher le bouton */
        }
    } catch {
        document.getElementById('monPlan').innerHTML = '<p class="text-red-400">❌ Service inaccessible</p>';
        document.getElementById('zoneResiliation').classList.add('hidden');
    }
}

async function souscrire(plan) {
    try {
        const res = await fetch(API.abonnements, {
            method: 'POST', headers: headers(), body: JSON.stringify({ plan })
        });
        const data = await res.json();
        if (!res.ok) return alert('❌ ' + data.error);
        alert(`✅ Abonnement ${plan.toUpperCase()} activé !\nValidité : 30 jours`);
        chargerMonPlan();
    } catch { alert('❌ Service inaccessible'); }
}


async function resilier() {
    const confirme = confirm('⚠️ Voulez-vous vraiment résilier votre abonnement ?\nVotre accès sera désactivé immédiatement.');
    if (!confirme) return;

    try {
        const res = await fetch(`${API.abonnements}/annuler`, {
            method: 'DELETE',
            headers: headers()
        });
        const data = await res.json();
        if (!res.ok) return alert('❌ ' + (data.error || 'Erreur serveur'));
        alert('✅ ' + data.message);
        chargerMonPlan(); /* Recharge la zone pour refléter l'annulation */
    } catch {
        alert('❌ Service abonnement inaccessible');
    }
}


/* ── PAIEMENT ────────────────────────────────────────────── */

async function payer() {
    const plan = document.getElementById('p-plan').value;
    const methode = document.getElementById('p-methode').value;
    const montants = { basic: 9, premium: 19 };
    const montant = montants[plan]; /* ✅ Number garanti */
    try {
        const res = await fetch(API.paiements, {
            method: 'POST', headers: headers(),
            body: JSON.stringify({ plan, methodePaie: methode, montant })
        });
        const data = await res.json();
        if (!res.ok) return alert('❌ ' + data.error);
        alert(`✅ Paiement confirmé !\nRéférence : ${data.reference}\nMontant : ${data.montant} DT`);
        chargerPaiements();
    } catch { alert('❌ Service paiement inaccessible'); }
}

async function chargerPaiements() {
    try {
        const res = await fetch(`${API.paiements}/mes-paiements`, { headers: headers() });
        const data = await res.json();
        const zone = document.getElementById('listePaiements');
        if (!data.paiements || data.paiements.length === 0) {
            zone.innerHTML = '<p class="text-gray-500 text-center py-4">Aucun paiement</p>'; return;
        }
        zone.innerHTML = data.paiements.map(p => `
      <div class="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex justify-between items-center">
        <div>
          <span class="badge-${p.plan}">${p.plan}</span>
          <span class="text-gray-400 ml-2 text-xs">${p.reference}</span>
        </div>
        <div class="text-right">
          <span class="text-white font-semibold">${p.montant} DT</span>
          <p class="text-gray-500 text-xs">${new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    `).join('');
    } catch { document.getElementById('listePaiements').innerHTML = '<p class="text-red-400">❌ Inaccessible</p>'; }
}


/* ── STATS ADMIN ─────────────────────────────────────────── */

async function chargerStats() {
    try {
        const res = await fetch(`${API.stats}/summary`, { headers: headers() });
        const s = await res.json();
        if (!res.ok) return;

        document.getElementById('gridStats').innerHTML = `
      <!-- Catalogue -->
      <div class="stat-card bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
        <div class="text-3xl font-black text-red-400">${s.totalContenus}</div>
        <div class="text-gray-400 text-xs mt-1">Contenus total</div>
        <div class="text-gray-600 text-xs mt-2">${s.films} films · ${s.series} séries · ${s.documentaires} docs · ${s.concerts} concerts</div>
      </div>

      <!-- Abonnés actifs -->
      <div class="stat-card bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
        <div class="text-3xl font-black text-red-400">${s.abonnesActifs}</div>
        <div class="text-gray-400 text-xs mt-1">Abonnés actifs</div>
        <div class="text-gray-600 text-xs mt-2">Basic: ${s.planBasic} · Premium: ${s.planPremium}</div>
      </div>

      <!-- Paiements -->
      <div class="stat-card bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
        <div class="text-3xl font-black text-red-400">${s.totalPaiements}</div>
        <div class="text-gray-400 text-xs mt-1">Paiements</div>
        <div class="text-gray-600 text-xs mt-2">Total abonnements</div>
      </div>

      <!-- Revenu -->
      <div class="stat-card bg-gray-900 border border-red-900 rounded-xl p-5 text-center">
        <div class="text-3xl font-black text-red-400">${s.revenuTotal} DT</div>
        <div class="text-gray-400 text-xs mt-1">Revenu total</div>
        <div class="text-gray-600 text-xs mt-2">Généré le ${new Date(s.generatedAt).toLocaleTimeString('fr-FR')}</div>
      </div>
    `;
    } catch {
        document.getElementById('gridStats').innerHTML =
            '<p class="text-red-400 col-span-4 text-center py-8">❌ Stats inaccessibles</p>';
    }
}