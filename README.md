<div align="center">
 
  <h2 align="center">✨ AdiYogi Wellness</h2>

  <p align="center">
    <strong>An intelligent, AI-powered full-stack wellness platform.</strong>
    <br />
    <br />
    <a href="https://github.com/KevalParmar75/adiyogi-wellness">View Demo</a>
    ·
    <a href="https://github.com/KevalParmar75/adiyogi-wellness/issues">Report Bug</a>
    ·
    <a href="https://github.com/KevalParmar75/adiyogi-wellness/issues">Request Feature</a>
  </p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=84cc16" alt="Django">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
</div>

---

## 🧠 Project Overview

**AdiYogi Wellness** is an intelligent, scalable wellness assistant platform that bridges the gap between holistic health and advanced AI. Built with a robust React (TypeScript) frontend and a Django backend, this project demonstrates real-world AI integration inside a production-style full-stack system.

By combining a hybrid database architecture with an interactive avatar-based conversational interface, AdiYogi Wellness delivers personalized, voice-enabled, and context-aware insights to users.

---

## 🧩 Core Features

### 🔐 Authentication & User Management
* **Secure Access:** Session/JWT-based authentication for seamless user login and signup.
* **Profile Management:** Comprehensive user profile handling.
* **Hybrid Data Storage:** Utilizes SQLite for structured authentication/admin models alongside MongoDB for flexible data.
* **Admin Control:** Full integration with the Django Admin panel.

### 🤖 AI-Powered Chat System
* **Multilingual Support:** Context-aware conversational flow supporting English, Hindi, Gujarati, and more.
* **Intelligent Backend:** Deep LLM integration for dynamic, accurate, and empathetic wellness responses.
* **Persistent Memory:** Robust handling of conversation history for continuous user context.

### 🗣️ Avatar & Audio Chat
* **Voice Interaction:** Full voice-based interaction support utilizing the Web Speech API.
* **TTS Integration:** Real-time Text-to-Speech processing for lifelike conversations.
* **Visual Interface:** Avatar-based UI for an engaging frontend experience.

### 📊 Weekly Wellness Insights
* **AI Generation:** Automatically compiles and generates weekly wellness insights tailored to the user.
* **Behavioral Tracking:** Analyzes user interactions and progress over time.
* **Actionable Recommendations:** Delivers personalized goals and retrievable progress summaries.

---

## 🛠️ Tech Stack

| Frontend | Backend | Database & Tools |
| :--- | :--- | :--- |
| React | Python | MongoDB (Chat, Insights) |
| TypeScript | Django | SQLite (Auth, Admin) |
| Tailwind CSS | Django REST Framework | Git & GitHub |
| Axios | MongoEngine | Postman |
| Web Speech API | LLM API Integration | Docker (Optional) |

---

## 🏗️ System Architecture

AdiYogi Wellness employs a modular, decoupled architecture ensuring real-time communication and scalable data handling.



1. **Client Layer (React/TS):** Captures text and voice inputs, rendering the avatar and UI.
2. **Communication (Axios):** RESTful API calls and CORS-handled requests pass data to the backend.
3. **Server Layer (Django):** Processes requests, handles authentication (SQLite), and communicates with the AI Engine.
4. **AI & Voice Processing:** Executes LLM logic and prepares text/audio responses.
5. **Data Layer (MongoDB):** Stores unstructured chat logs, behavioral tracking data, and weekly insights.

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
* Node.js & npm
* Python 3.9+
* MongoDB (Local or Atlas)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the Django server
python manage.py runserver

#frontend
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
---
## **💡 Why This Project Stands Out**
  *AI + Full-Stack Integration: Moving beyond basic CRUD apps by embedding dynamic AI reasoning into the core loop.

  *Voice-Enabled Architecture: Real-time frontend ↔ backend voice processing creates a highly accessible user experience.

  *Hybrid Database Design: Demonstrates architectural maturity by using the right database paradigm for the right data (SQL for Auth, NoSQL for AI logs).

  *Production-Ready Modularity: Environment-based configurations and a clean separation of concerns.

**Project Link:** https://github.com/KevalParmar75/adiyogi-wellness

<div align="center">
<i>AdiYogi Wellness. Built by Keval & Team❤️.</i>
</div>
  
