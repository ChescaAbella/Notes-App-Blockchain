# 📘 Notes App Blockchain

A simple Notes Web Application with authentication and full CRUD (Create, Read, Update, Delete) features.  
Now integrated with a Cardano blockchain component for additional project requirements.

---

## 🛠️ Tech Stack

**Frontend** – React (Vite), JavaScript, CSS  
**Backend** – Node.js (Express)  
**Database** – SQLite  
**Authentication** – JWT + bcrypt  
**Blockchain Tools** – Lace Wallet, @blaze-cardano/sdk, Blockfrost API

---

## 🚀 Project Setup & Installation

### 1️⃣ Clone the Repository**
```bash
git clone https://github.com/ChescaAbella/Notes-App-Blockchain.git
cd Notes-App-Blockchain
```
### 2️⃣ Backend Setup
```bash
cd backend
npm install
npm run dev
```
➡️ Backend will run at:
http://localhost:4000

## 🌐 Frontend Setup (with Blockchain Integration)
### Step 1: Install Lace Wallet

Install the Lace Wallet browser extension.
This is required for blockchain interactions.

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```
### Step 3: Install Node Polyfills for Vite
```bash
npm install --save-dev vite-plugin-node-polyfills
```
## After installation:
Open frontend/vite.config.js
Add nodePolyfills() inside the plugins array:
```bash
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
  ]
})
```

### Step 4: Install Cardano SDK
```bash
npm i @blaze-cardano/sdk
```
### Step 5: Create .env File

Inside /frontend, create a file named .env:
```bash
VITE_API_URL=http://localhost:4000/api
VITE_BLOCKFROST_PROJECT_ID=<Project-id>
```
### Step 6: Run the Frontend
```bash
npm run dev
```
➡️ Frontend will start at:
http://localhost:5173









