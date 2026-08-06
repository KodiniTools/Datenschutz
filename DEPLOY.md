# Deployment

Die Datenschutzseite (`index.html`) wird per GitHub Actions automatisch auf den
Server deployt. Ziel ist `<Webroot>/datenschutz/index.html`, sodass die Seite
unter `https://kodinitools.com/datenschutz/` erreichbar ist.

## Ablauf

Bei jedem Push auf `main`, der `index.html` (oder den Workflow) ändert, läuft
`.github/workflows/deploy.yml` und überträgt die Datei per rsync über SSH.
Manuell auslösbar über **Actions → Deploy Datenschutz page → Run workflow**.

## Einmalige Einrichtung

### 1. Deploy-SSH-Key auf dem Server anlegen

```bash
# Auf dem Server (als der User, dem der Webroot gehört)
ssh-keygen -t ed25519 -f ~/.ssh/gh_deploy -N "" -C "github-actions-deploy"
cat ~/.ssh/gh_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/gh_deploy   # <-- privaten Key kopieren (für SSH_KEY-Secret)
```

### 2. GitHub-Secrets setzen

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret        | Wert                                                                 |
|---------------|---------------------------------------------------------------------|
| `SSH_HOST`    | Server-IP oder Hostname, z. B. `kodinitools.com`                    |
| `SSH_USER`    | SSH-Benutzer, dem der Webroot gehört                                 |
| `SSH_KEY`     | Kompletter **privater** Key aus `~/.ssh/gh_deploy` (inkl. Header)   |
| `SSH_PORT`    | SSH-Port (optional, Standard `22`)                                  |
| `DEPLOY_PATH` | Webroot **ohne** `/datenschutz`, z. B. `/var/www/html`             |

> `DEPLOY_PATH` ist das Webroot-Verzeichnis. Der Workflow hängt `/datenschutz/`
> selbst an. Beispiel: Webroot `/var/www/html` → Seite landet unter
> `/var/www/html/datenschutz/index.html`.

### 3. Deployen

```bash
git push origin main
```

Der Workflow legt `datenschutz/` bei Bedarf an, überträgt `index.html` und
listet am Ende den Zielordner zur Kontrolle.
