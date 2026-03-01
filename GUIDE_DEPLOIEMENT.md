# 🚀 Guide : Déployer Mon Budget sur GitHub Pages

## Ce que vous obtenez à la fin
- Une URL publique du type `https://VOTRE_PSEUDO.github.io/mon-budget/`
- Installable comme une vraie app sur Android (PWA)
- Données sauvegardées localement sur chaque appareil
- Mise à jour : modifiez le code → `npm run deploy` → c'est en ligne

---

## ✅ ÉTAPE 1 — Installer les outils (une seule fois)

### 1.1 — Installer Node.js
👉 Allez sur https://nodejs.org et téléchargez la version **LTS** (ex: 20.x)
- Lancez l'installateur, gardez les options par défaut
- Vérification : ouvrez un terminal et tapez :
  ```
  node --version
  ```
  Vous devez voir quelque chose comme `v20.x.x` ✅

### 1.2 — Installer Git
👉 Allez sur https://git-scm.com/downloads et installez Git
- Vérification :
  ```
  git --version
  ```

### 1.3 — Créer un compte GitHub
👉 Allez sur https://github.com et créez un compte gratuit si vous n'en avez pas.

---

## ✅ ÉTAPE 2 — Créer le dépôt GitHub

1. Connectez-vous à GitHub
2. Cliquez sur le **bouton vert "New"** (ou l'icône ➕ en haut à droite → "New repository")
3. Remplissez :
   - **Repository name** : `mon-budget` *(important : ce nom doit correspondre à celui dans vite.config.js)*
   - **Description** : Suivi de budget personnel
   - Laissez **Public** coché
   - **NE PAS** cocher "Add a README file"
4. Cliquez **"Create repository"**
5. Copiez l'URL de votre dépôt (ex: `https://github.com/votre-pseudo/mon-budget.git`)

---

## ✅ ÉTAPE 3 — Configurer votre projet localement

### 3.1 — Téléchargez les fichiers du projet
Téléchargez les fichiers fournis par Claude et placez-les dans un dossier `mon-budget` sur votre ordinateur.

Structure attendue :
```
mon-budget/
├── src/
│   ├── main.jsx
│   └── App.jsx
├── public/
│   └── manifest.json
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

### 3.2 — Ouvrez un terminal dans ce dossier
- **Windows** : Shift + clic droit dans le dossier → "Ouvrir PowerShell ici"
- **Mac** : Clic droit sur le dossier → "Nouveau terminal au dossier"

### 3.3 — Installez les dépendances
```bash
npm install
```
*(cela crée le dossier `node_modules`, peut prendre 1-2 minutes)*

### 3.4 — Testez en local (optionnel mais recommandé)
```bash
npm run dev
```
Ouvrez http://localhost:5173/mon-budget/ dans votre navigateur.
Si l'app s'affiche → tout est bon ! ✅
Arrêtez avec `Ctrl+C`.

---

## ✅ ÉTAPE 4 — Connecter au dépôt GitHub

Dans votre terminal, dans le dossier `mon-budget` :

```bash
git init
git add .
git commit -m "Premier commit - app budget"
git branch -M main
git remote add origin https://github.com/VOTRE_PSEUDO/mon-budget.git
git push -u origin main
```

> ⚠️ Remplacez `VOTRE_PSEUDO` par votre nom d'utilisateur GitHub.
> GitHub peut vous demander de vous authentifier → entrez vos identifiants.

---

## ✅ ÉTAPE 5 — Déployer sur GitHub Pages

### 5.1 — Lancer le déploiement
```bash
npm run deploy
```
Cette commande va :
1. Construire l'app (crée le dossier `dist/`)
2. Pousser le contenu sur une branche `gh-pages` de votre dépôt

### 5.2 — Activer GitHub Pages
1. Sur GitHub, allez dans votre dépôt `mon-budget`
2. Cliquez sur **"Settings"** (onglet en haut)
3. Dans le menu gauche, cliquez **"Pages"**
4. Sous "Branch", sélectionnez **`gh-pages`** et dossier **`/ (root)`**
5. Cliquez **"Save"**

⏳ Attendez 2-3 minutes, puis votre app est accessible à :
```
https://VOTRE_PSEUDO.github.io/mon-budget/
```

---

## ✅ ÉTAPE 6 — Installer sur Android (PWA)

1. Ouvrez l'URL de votre app dans **Chrome** sur Android
2. Chrome affichera une bannière "Ajouter à l'écran d'accueil"
   - OU : menu Chrome (⋮) → "Ajouter à l'écran d'accueil"
3. Confirmez → l'icône apparaît sur votre écran d'accueil 🎉
4. L'app s'ouvre en plein écran, sans barre de navigation Chrome

---

## 🔄 ÉTAPE 7 — Mettre à jour l'app (maintenant et dans le futur)

Chaque fois que vous modifiez le code :

```bash
# 1. Sauvegarder sur GitHub (optionnel mais conseillé)
git add .
git commit -m "Description de la modification"
git push

# 2. Déployer la mise à jour
npm run deploy
```

C'est tout ! En 30 secondes, la nouvelle version est en ligne.

---

## ❓ Problèmes fréquents

| Problème | Solution |
|----------|----------|
| Page blanche après déploiement | Vérifiez que `base` dans `vite.config.js` correspond exactement au nom du dépôt |
| Erreur `npm: command not found` | Node.js n'est pas installé ou pas dans le PATH — relancez le terminal après installation |
| Erreur `git push` refusé | Authentifiez-vous avec vos identifiants GitHub |
| L'app ne s'installe pas sur Android | Vérifiez que vous utilisez Chrome et que l'URL est en HTTPS |
| Les données disparaissent | Normal : chaque appareil a son propre localStorage. Pour partager, il faudrait une base de données (étape future) |

---

## 📌 Récapitulatif des commandes

```bash
npm install        # Installer les dépendances (une seule fois)
npm run dev        # Tester en local
npm run build      # Construire pour production
npm run deploy     # Déployer sur GitHub Pages
```

---

## 🗺️ Et après ?

Une fois cette app en ligne, on pourra :
1. **Construire l'app Alimentation/Entraînement** avec la même structure
2. **Ajouter une synchronisation** entre appareils (avec Supabase gratuit)
3. **Ajouter des notifications** de budget dépassé

Bon déploiement ! 🚀
