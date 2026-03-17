# FinSight Engine

FinSight Engine is a financial analytics dashboard that visualizes spending data, calculates growth trends, and forecasts future expenses. It consists of a FastAPI backend and a React frontend.

## Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn

## Installation & Setup

### 1. Backend Setup

The backend is built with FastAPI and uses SQLite for data storage.

1.  **Navigate to the project root:**
    ```bash
    cd FinTech
    ```

2.  **Create a virtual environment:**
    ```bash
    python3 -m venv venv
    ```

3.  **Activate the virtual environment:**
    - On macOS/Linux:
      ```bash
      source venv/bin/activate
      ```
    - On Windows:
      ```bash
      venv\Scripts\activate
      ```

4.  **Install dependencies:**
    ```bash
    pip install -r backend/requirements.txt
    ```
    *(Note: If `requirements.txt` is missing, install the main packages manually: `pip install fastapi uvicorn sqlalchemy pandas numpy reportlab multipart`)*

5.  **Run the Backend Server:**
    ```bash
    cd backend
    uvicorn main:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000`.
    API Documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

The frontend is built with React, Vite, and Tailwind CSS.

1.  **Open a new terminal and navigate to the frontend directory:**
    ```bash
    cd FinTech/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Frontend Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Features
- **Dashboard**: View total spending, month-over-month growth, and AI-powered spending forecasts.
- **Visualizations**: Interactive pie charts for category spending and line charts for trends using **Recharts**.
- **Data Management**:
    - **Upload CSV**: Ingest bank transaction CSV files via a **FastAPI** endpoint.
    - **Simulate Data**: Generate realistic sample financial data using **NumPy** and **Pandas**.
    - **Clear Data**: Reset the **SQLite** database.
- **Forecasting**: **Linear Regression** model (implemented in Python) to predict next month's spending based on historical trends.
- **Reporting**: Generate and download a PDF financial report using **ReportLab**.

## Tech Stack
- **Backend:** Python, FastAPI, SQLAlchemy, Pandas, NumPy, ReportLab
- **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide React
- **Database:** SQLite

## CSV Format

If uploading a CSV, ensure it has the following headers:
`date`, `description`, `category`, `amount`
