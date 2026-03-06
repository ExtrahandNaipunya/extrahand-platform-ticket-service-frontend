# CapRover Deployment - Ticket Service Frontend

1. **Runtime env (recommended):**  
   In CapRover **App Configs → Environment Variables** for the frontend app, set:
   - `BACKEND_URL` – backend API base URL (e.g. `https://ticket-backend.yourdomain.com`)  
   This is injected into the page on each request, so **no rebuild is needed** when you change it.

2. **Optional:**  
   - `MONGODB_URI` – if the Next.js app uses MongoDB (e.g. invites/local DB).  
   - `NEXT_PUBLIC_BACKEND_URL` – only needed if you prefer build-time config; otherwise `BACKEND_URL` at runtime is enough.

3. **Create an app** in CapRover (e.g. `ticket-frontend`).

4. **Deploy** via CapRover CLI or GitHub. CapRover uses `captain-definition` and `Dockerfile` (multi-stage Next.js build with standalone output).

5. **Enable HTTPS** and set the backend’s `FRONTEND_URL` / `CORS_ORIGIN` to this app’s URL so the backend allows requests from the frontend.
