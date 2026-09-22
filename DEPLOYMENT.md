# Timora — Deployment Guide

This guide walks you through deploying Timora as a **unified web service** (React frontend + FastAPI backend in a single container).

---

## 🚀 Option 1: Deploy to Render (Recommended & Free)

Render automatically builds the React frontend and runs the FastAPI backend using the included [`Dockerfile`](./Dockerfile).

### Step 1: Push your project to GitHub
Open your terminal in the `Timora` root directory and run:

```bash
git init
git add .
git commit -m "Initial commit of Timora exam scheduler"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/timora.git
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in (using GitHub).
2. Click **New +** in the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and select your `timora` repository.
4. Render will automatically detect the **Dockerfile**.
5. Configure the settings:
   * **Name:** `timora` (or your preferred name)
   * **Region:** Any region close to you (e.g., Singapore or Oregon)
   * **Instance Type:** **Free**
6. Click **Create Web Service**.

Render will automatically:
- Build the React production assets
- Install all Python dependencies
- Start Uvicorn on the assigned port
- Provide you with a live HTTPS URL (e.g., `https://timora.onrender.com`)!

---

## 🚂 Option 2: Deploy to Railway

1. Go to [railway.app](https://railway.app/) and click **New Project**.
2. Select **Deploy from GitHub repo** and pick your `timora` repository.
3. Railway automatically detects [`railway.json`](./railway.json) and [`Dockerfile`](./Dockerfile).
4. Click **Deploy**. Once finished, go to **Settings** $\rightarrow$ **Generate Domain** to get your public URL.

---

## 🪰 Option 3: Deploy to Fly.io

If you have the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed:

```bash
fly launch
```

Follow the prompts; Fly will automatically detect the `Dockerfile` and configure port 8000. Then deploy with:

```bash
fly deploy
```

---

## 🐳 Option 4: Self-Host with Docker Compose (VPS / Server)

To run on any Linux/Windows VPS or local campus server:

```bash
# Build and start in background
docker compose up -d --build

# View logs
docker compose logs -f
```

The application will be accessible at `http://<YOUR_SERVER_IP>:8000`.

---

## ⚙️ Environment Variables (Optional)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for the web server (automatically set by Render/Railway/Fly.io) |
| `DATABASE_URL` | `sqlite:///./timora.db` | Path or connection URL to the SQLite database |
