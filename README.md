<div align="center">
  <img src="https://img.icons8.com/color/120/000000/artificial-intelligence.png" alt="SpendWise AI Logo" width="80" />
  
  # SpendWise AI 💸✨
  
  **Premium Financial Intelligence & AI Coach Platform**
  
  *Built for BTK Hackathon*
  
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#installation">Installation</a> •
    <a href="#roadmap">Roadmap</a>
  </p>
</div>

---

## 🌟 Overview

**SpendWise AI** is a next-generation, desktop-first SaaS platform designed to act as your hyper-personalized financial neural model. Unlike traditional budgeting apps, SpendWise utilizes Google Gemini AI to analyze your spending habits, predict upcoming risks (like seasonal utility spikes), and proactively suggest saving opportunities before you overspend.

Built with a premium **Obsidian + Emerald glassmorphism design system**, the platform offers a "Bloomberg Terminal meets Apple" aesthetic, making financial tracking not just insightful, but visually stunning.

---

## ✨ Features

- **🧠 AI Financial Coach:** Deep integration with Google Gemini to analyze purchase behaviors and provide real-time, actionable insights.
- **💼 Premium Dashboard:** Live monitoring of your Monthly Free Budget, dynamic burn rates, and an algorithmic "Spending Health Score".
- **🎯 Dynamic Goal Tracking:** Set highly customized savings goals with visual progress bars.
- **🌍 Global Currency & Localization:** Seamless multi-currency support, including dynamic localized formatting (USD `$`, EUR `€`, GBP `£`, TRY `₺`, etc.).
- **🔐 Secure Architecture:** Full authentication and data persistence powered by Firebase Auth and Firestore.
- **📊 Real-time Analytics:** Visual Cash Flow charts and personalized spending insights.

---

## 💻 Tech Stack

- **Frontend:** React (v19) + Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS (Custom Obsidian/Emerald Design System)
- **Backend / Database:** Firebase (Auth, Firestore)
- **AI Engine:** Google Gemini API (Upcoming Phase)
- **State Management:** React Context API

---

## 🚀 Installation & Setup

Want to run SpendWise AI locally? Follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/btk_hackathon26.git
cd btk_hackathon26
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

### 4. Run the development server
```bash
npm run dev
```

The application will launch on `http://localhost:5173`.

---

## 🗺️ Project Roadmap

- [x] **Phase 1:** Core Architecture & Authentication (Login/Signup/Firebase Integration)
- [x] **Phase 2:** Premium Onboarding Wizard (Income, Expenses, Goals, Risk Profiling)
- [x] **Phase 3:** Core Dashboard & Dynamic Localization Engine (Real-time data rendering)
- [ ] **Phase 4:** AI Analysis Layer (Gemini API Integration for predictive insights)
- [ ] **Phase 5:** Explorer & Product Intelligence (AI-driven product purchasing advice)

---

<div align="center">
  <p>Crafted with 💚 for the BTK Hackathon</p>
</div>