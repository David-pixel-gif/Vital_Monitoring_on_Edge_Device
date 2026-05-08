# VitalPulse Console

VitalPulse Console is a rural patient vital-sign monitoring system for a physical monitoring device. The device sends:

- Heart rate
- SpO2
- Body temperature

The software provides:

- User registration and login
- Patient registration
- Device registration
- Monitoring session start and stop
- Live reading display
- Alert detection and acknowledgement
- Monitoring history and logs
- Settings and threshold management
- CSV export for readings, alerts, and devices

This project uses:

- `frontend/`: React web app
- `backend/`: Django API with SQLite database

## 1. First-Time Requirements

Install these tools on a new machine first:

- Node.js 18+ and npm
- Python 3.10+ or newer

Recommended checks:

```powershell
node -v
npm -v
python --version
```

If `python` does not work on Windows, also try:

```powershell
py -3 --version
```

## 2. Project Structure

```text
vital-monitor-edge-full/
  backend/
  frontend/
  README.md
```

## 3. Backend First-Time Setup

Open a terminal in the project root:

```powershell
cd C:\path\to\vital-monitor-edge-full
```

Create a virtual environment inside `backend/`:

```powershell
cd backend
python -m venv myenv
```

If `python` is not available:

```powershell
py -3 -m venv myenv
```

Activate the virtual environment:

```powershell
.\myenv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
pip install -r requirements.txt
```

Synchronize the database:

```powershell
python run_backend.py migrate --run-syncdb --noinput
```

Run a backend health check:

```powershell
python run_backend.py check
```

Start the backend by itself:

```powershell
python run_backend.py runserver
```

Backend default address:

```text
http://127.0.0.1:8000
```

## 4. Frontend First-Time Setup

Open a second terminal and go to the frontend:

```powershell
cd C:\path\to\vital-monitor-edge-full\frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the frontend only:

```powershell
npm run start:frontend
```

Frontend default address:

```text
http://localhost:3000
```

## 5. Start Both Frontend and Backend Together

Once the backend virtual environment has been created and dependencies are installed, you can start both apps from the `frontend/` folder:

```powershell
cd C:\path\to\vital-monitor-edge-full\frontend
npm start
```

How this works:

- frontend runs with `react-scripts`
- backend runs through `frontend/scripts/start-backend.js`
- the backend launcher tries these Python options in order:
  - `backend/myenv/Scripts/python.exe`
  - a few common Windows Python locations
  - `python`
  - `py -3`

If `npm start` says no working Python interpreter was found:

1. Make sure `backend/myenv` exists
2. Make sure `pip install -r backend/requirements.txt` succeeded
3. Make sure `python` or `py -3` works in your terminal

## 6. Create the First User

Open the app in your browser:

```text
http://localhost:3000
```

You will be redirected to the login page.

For a fresh setup:

1. Open `/register`
2. Create a user account
3. Sign in on `/login`

Supported roles:

- `NURSE`
- `DOCTOR`

## 7. Basic First-Time Workflow

After login, use the system in this order:

1. Go to `Devices`
2. Register a monitoring device
3. Go to `Patients`
4. Register a patient
5. Go to `Live Monitoring`
6. Select the patient and device
7. Start a monitoring session
8. Let the physical device send readings
9. Review alerts in `Alerts`
10. Review event history in `History / Logs`
11. Export CSV files from `Reports / Export`

## 8. Development URLs

Frontend routes:

- `/login`
- `/register`
- `/overview`
- `/dashboard`
- `/monitoring`
- `/patients`
- `/alerts`
- `/history`
- `/devices`
- `/reports`
- `/settings`

Backend API base:

```text
http://127.0.0.1:8000/api
```

## 9. Main Backend Endpoints

Auth:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

Monitoring:

- `GET /api/monitoring/latest/`
- `GET /api/monitoring/readings/`
- `GET/POST /api/monitoring/patients/`
- `GET/PATCH /api/monitoring/patients/<patient_id>/`
- `GET/POST /api/monitoring/devices/`
- `GET/PATCH /api/monitoring/devices/<device_id>/`
- `GET/POST /api/monitoring/sessions/`
- `POST /api/monitoring/sessions/<id>/stop/`
- `GET /api/monitoring/history/`
- `GET /api/monitoring/status/`
- `GET/PATCH /api/monitoring/settings/`
- `GET /api/monitoring/exports/`
- `GET /api/monitoring/exports/readings/`
- `GET /api/monitoring/exports/alerts/`
- `GET /api/monitoring/exports/devices/`

Alerts:

- `GET /api/alerts/`
- `POST /api/alerts/<id>/acknowledge/`
- `POST /api/alerts/<id>/review/`

Ingest:

- `POST /api/ingest/`

## 10. Manual Backend Test

The repo includes an end-to-end backend smoke test.

From `backend/`:

```powershell
python test_operations.py
```

This checks:

- auth
- patient creation
- device creation
- monitoring sessions
- reading ingest
- alerts
- history
- settings
- exports
- database persistence

## 11. Frontend Build Test

From `frontend/`:

```powershell
npm run build
```

Frontend test command:

```powershell
npm test
```

Current note:

- the frontend test command is configured
- there are currently no React test files yet

## 12. Database

The backend uses SQLite.

Database file:

```text
backend/db.sqlite3
```

You do not need to install PostgreSQL or MySQL to run this project locally.

## 13. Troubleshooting

### Python not found

Try:

```powershell
py -3 --version
```

Then recreate the backend virtual environment:

```powershell
cd backend
py -3 -m venv myenv
.\myenv\Scripts\Activate.ps1
pip install -r requirements.txt
python run_backend.py migrate --run-syncdb --noinput
```

### PowerShell blocks script execution

If virtualenv activation is blocked:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\myenv\Scripts\Activate.ps1
```

### Port 8000 already in use

Run the backend on another port:

```powershell
python run_backend.py runserver 8001
```

Then update the frontend API base in:

- `frontend/src/services/api.js`

### Port 3000 already in use

React will usually prompt for another port. Accept the prompt.

### `npm start` does not start both apps

Check:

- backend virtualenv exists
- backend dependencies are installed
- `node scripts/start-backend.js` works from `frontend/`

Test the backend launcher directly:

```powershell
cd frontend
node scripts/start-backend.js
```

## 14. Daily Development Commands

Backend:

```powershell
cd backend
.\myenv\Scripts\Activate.ps1
python run_backend.py runserver
```

Frontend:

```powershell
cd frontend
npm run start:frontend
```

Both together:

```powershell
cd frontend
npm start
```

## 15. Current Scope

This is not a hospital ERP system.

The app is intentionally focused on:

- patient registration
- device registration
- live device-linked monitoring
- alert workflow
- monitoring logs
- threshold settings
- simple CSV export

## 16. Recommended First Check After Setup

After starting both apps:

1. Open `http://localhost:3000`
2. Register a user
3. Log in
4. Register a patient
5. Register a device
6. Start a monitoring session
7. Submit a manual test reading or connect the physical device
8. Confirm alerts and logs update correctly

