# Nova Pay (Event-Driven Microservices)

Welcome to the **Nova Pay** project! This is a modern, distributed financial transaction system built using an **Event-Driven Microservices Architecture**. 

Instead of a single monolithic backend, this project separates responsibilities into multiple independent services that communicate asynchronously through **Apache Kafka**.

---

## 🏗️ Architecture Overview

The system consists of 4 main components:

1. **Frontend (`swift-glass-pay`)**: A React web application where users initiate transfers, deposits, and withdrawals.
2. **API Gateway (`api-service`)**: A FastAPI service that receives HTTP requests from the frontend, validates them, and instantly publishes a `TransactionCreatedEvent` to the Kafka broker.
3. **Logger Service (`logger-service`)**: A Kafka consumer that listens for new transactions and securely persists them into a **PostgreSQL** database.
4. **Fraud Service (`fraud-service`)**: A Kafka consumer running a Rule Engine. It analyzes every transaction in real-time. If a transaction is suspicious, it saves an audit log to **MongoDB** and publishes a `FraudDetectedEvent` back to Kafka.

## 📋 Prerequisites

Before you run this project, make sure you have the following installed on your computer:
1. **[Python 3.12](https://www.python.org/downloads/)**: Required to run the backend microservices.
2. **[Node.js (v18+)](https://nodejs.org/)**: Required to run the React frontend.
3. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Required to run the databases and Kafka message broker.

---

## 📦 Installation & Setup

Before running the services, you must install their dependencies. Open your terminal and run these commands **once**:

**1. Install API Service Dependencies**
```powershell
cd api-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

**2. Install Logger Service Dependencies**
```powershell
cd logger-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

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
cd swift-glass-pay
npm install
cd ..
```

---

## 🚀 How to Run the Project Locally

To run this entire distributed system on your local machine, follow these steps exactly:

### Step 1: Start the Infrastructure (Docker)
1. Open a terminal in the root `DP_PJ` folder.
2. Run the following command:
   ```bash
   docker-compose up -d
   ```
*(This starts Zookeeper on port 22181, Kafka on port 9092, and PostgreSQL on port 5432).*

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

### Step 3: Start the Frontend
Open a **fifth terminal window** for the React application:
```powershell
cd swift-glass-pay
npm run dev
```

### Step 4: Test the Flow
1. Open your browser and go to `http://localhost:5173`.
2. Log in and initiate a money transfer.
3. Watch your terminals! You will see the API Service accept the request, and a split-second later, the Logger Service and Fraud Service will both instantly react to the Kafka event!

---

## 🛠️ Tech Stack
* **Frontend**: React, Vite, TypeScript, TailwindCSS
* **Backend**: Python 3.12, FastAPI, Pydantic v2
* **Event Broker**: Apache Kafka (confluent-kafka), Zookeeper
* **Databases**: PostgreSQL (SQLAlchemy), MongoDB Atlas (Motor)
* **DevOps**: Docker, Docker Compose
