# Nova Pay (Event-Driven Microservices Platform)

Welcome to the **Nova Pay** project! This is a modern, distributed financial transaction and fraud-detection system built using an **Event-Driven Microservices Architecture**. 

Instead of a single monolithic backend, this project separates responsibilities into multiple independent services that communicate instantaneously and asynchronously through **Apache Kafka**.

---

## 🏗️ Architecture Overview

The distributed system consists of 5 main components:

1. **Frontend 1 (`swift-glass-pay`)**: A React web wrapper application where consumers securely initiate transfers, view history, and manage contacts.
2. **Frontend 2 (`sentinel-dashboard`)**: An administrator operations portal rendering live Kafka pipeline metrics and streaming Supabase charts.
3. **API Gateway (`api-service`)**: A FastAPI ingest layer that receives HTTP requests from the consumer UI, validates them, and instantly publishes a `TransactionCreatedEvent` to the Kafka broker.
4. **Logger Service (`logger-service`)**: A Kafka consumer that logs events and permanently seals transactions into a **Supabase PostgreSQL Data Warehouse**. 
5. **Fraud Service (`fraud-service`)**: A Kafka consumer running an AI/Heuristics Rule Engine. It analyzes geographical states and frequencies. If fraud is caught, it permanently caches it into **MongoDB Atlas** and alerts admins.

---

## 📋 Prerequisites

Before running this project locally, ensure you have the following mapped:
1. **[Python 3.12](https://www.python.org/downloads/)**: Required for all 3 backend microservices.
2. **[Node.js (v18+)](https://nodejs.org/)**: Required for both Vite React frontends.
3. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Required specifically to host the native Apache Kafka stream.

*Note: All Postgres and MongoDB databases are securely hosted in the cloud. No local database setup is required outside of injecting your `.env` keys!*

---

## 📦 Installation & Setup

Open your terminal and configure the ecosystems **once**:

**1. Install API Service Dependencies**
```powershell
cd api-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

**2. Install Logger Service & Fraud Service**
(Repeat the exact exact virtual-env pattern `python -m venv venv` and `pip install -r requirements.txt` inside both `/logger-service` and `/fraud-service`).

**3. Install Fraud Service Dependencies**
```powershell
cd fraud-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

**4. Install Wallet Service Dependencies**
```powershell
cd wallet-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

**5. Install Frontend Dependencies**
```powershell
# Consumer App
cd swift-glass-pay
npm install
cd ..

# Admin Dashboard
cd sentinel-dashboard
npm install
cd ..
```

---

## 🚀 How to Run the Distributed Network locally

To run this entire distributed system on your local machine, follow these steps exactly:

### Step 1: Start the Event Stream (Docker)
1. Open a terminal in the root `ShieldPoint` folder.
2. Boot Kafka and Zookeeper detached:
   ```bash
   docker-compose up -d
   ```

### Step 2: Start the Microservices
Open **three new terminal windows**, one for each backend service.

**Terminal 1: API Service**
```powershell
cd api-service
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2: Logger Service**
```powershell
cd logger-service
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

**Terminal 3: Fraud Service**
```powershell
cd fraud-service
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

**Terminal 4: Wallet Service**
```powershell
cd wallet-service
.\venv\Scripts\Activate.ps1
python main.py
```

### Step 3: Start the Frontends
Open **two more terminal windows** for the React applications:

**Terminal 5: Consumer Swift Glass Pay**
```powershell
cd swift-glass-pay
npm run dev
```

**Terminal 6: Administrator Sentinel Dashboard**
```powershell
cd sentinel-dashboard
npm run dev
```

### Step 4: Access Platforms
1. Load your wallet from the Vite terminal link (`http://localhost:8080/` or `5173`).
2. Load your Operations Dashboard via its respective Local URL link (`http://localhost:8081/`).
3. Make a generic transfer via the Wallet UI and watch your terminal logs stream sequentially across microservices before rendering cleanly into the analytical charts!
