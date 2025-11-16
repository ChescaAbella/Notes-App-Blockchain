---

📘 Notes App Blockchain

A simple Notes Web Application with authentication and full CRUD (Create, Read, Update, Delete) features.
Now integrated with a Cardano blockchain component for additional project requirements.

🛠️ Tech Stack

Frontend: React (Vite), JavaScript, CSS

Backend: Node.js (Express)

Database: SQLite

Authentication: JWT + bcrypt

Blockchain Tools: Lace Wallet, @blaze-cardano/sdk, Blockfrost API



---

🚀 Project Setup & Installation

1️⃣ Clone the Repository

git clone https://github.com/ChescaAbella/Notes-App-Blockchain.git
cd Notes-App-Blockchain


---

🔧 2️⃣ Backend Setup

cd backend
npm install
npm run dev

Backend will run at: http://localhost:4000


---

Frontend Setup (with Blockchain Integration)

Step 1: Install Lace Wallet

Before running the frontend, install the Lace Wallet browser extension.
This is required for blockchain interactions.


---

Step 2: Install dependencies

cd frontend
npm install


---

Step 3: Install Node polyfills for Vite

npm install --save-dev vite-plugin-node-polyfills

After installation:

1. Open frontend/vite.config.js


2. Add nodePolyfills() inside the plugins array



Example:

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
  ]
})


---

Step 4: Install Cardano SDK

npm i @blaze-cardano/sdk


---

Step 5: Create .env file

Inside /frontend, create a file named .env:

VITE_API_URL=http://localhost:4000/api
VITE_BLOCKFROST_PROJECT_ID=<Project-id>


---

Step 6: Run the frontend

npm run dev

Frontend will start at: http://localhost:5173


---