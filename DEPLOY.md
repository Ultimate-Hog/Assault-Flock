# Deployment Guide

## SSH Setup

SSH authentication is handled via a deploy key (`dgreen-c`) added to the GitHub repository.

- **Private key**: `~/.ssh/bighog_github`
- **GitHub org/repo**: `Ultimate-Hog/Assault-Flock`
- **SSH config host**: `github.com` (in `~/.ssh/config`)

To verify the key is working:

```bash
ssh -T git@github.com
# Expected: Hi Ultimate-Hog/Assault-Flock! You've successfully authenticated...
```

---

## Assault Flock

**Local path**: `shoot/Assault Flock/`  
**Remote**: `git@github.com:Ultimate-Hog/Assault-Flock.git`

### First-time setup (initialise and push)

```bash
cd "d:\gitz\big hog games\shoot\Assault Flock"
git init
git remote add origin git@github.com:Ultimate-Hog/Assault-Flock.git
git add .
git commit -m "initial commit"
git push -u origin main
```

### Deploying changes

Run the deploy script from the repo root (`d:\gitz\big hog games`):

```powershell
.\deploy.ps1                    # commits with default message "update demo"
.\deploy.ps1 "your message"     # commits with a custom message
```

The script automatically copies `shoot\Assault Flock\demo\` → `docs\`, stages all changes, commits, and pushes. The GitHub Pages production version at the live URL below is always kept in sync.

### If the remote already has commits (first push conflict)

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## GitHub Pages

**Live URL**: `https://ultimate-hog.github.io/Assault-Flock/`

GitHub Pages is configured to serve from the `/docs` folder on the `main` branch (set in repo Settings → Pages).

The `docs/` folder at the repo root is the published copy of the demo. The source files remain at `shoot/Assault Flock/demo/`. The `deploy.ps1` script keeps them in sync automatically.
