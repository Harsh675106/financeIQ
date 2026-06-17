from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="Finance ML Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models directory
MODEL_DIR = os.getenv("MODEL_PATH", "./models")
os.makedirs(MODEL_DIR, exist_ok=True)

# Request models
class RiskAssessmentRequest(BaseModel):
    age: float
    income: float
    expenses: float
    savings: float
    debt: float

class StressPredictionRequest(BaseModel):
    debt_to_income_ratio: float
    savings_rate: float
    emi_burden: float
    expense_volatility: float

class MonteCarloRequest(BaseModel):
    initial_amount: float
    monthly_contribution: float
    years: int
    expected_return: float = 0.08
    volatility: float = 0.15

# Initialize models
scaler = StandardScaler()
stress_model = None

def load_or_train_stress_model():
    """Load existing stress prediction model or train a new one"""
    global stress_model, scaler
    model_path = os.path.join(MODEL_DIR, "stress_model.joblib")
    scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
    
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        stress_model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        print("Loaded existing stress prediction model")
    else:
        # Train a simple model with synthetic data
        print("Training new stress prediction model...")
        train_stress_model()
        joblib.dump(stress_model, model_path)
        joblib.dump(scaler, scaler_path)
        print("Model saved successfully")

def train_stress_model():
    """Train stress prediction model with synthetic data"""
    global stress_model, scaler
    
    # Generate synthetic training data
    np.random.seed(42)
    n_samples = 1000
    
    # Features: debt_to_income, savings_rate, emi_burden, expense_volatility
    X = np.random.rand(n_samples, 4)
    X[:, 0] = X[:, 0] * 0.6  # debt_to_income: 0-0.6
    X[:, 1] = X[:, 1] * 0.5  # savings_rate: 0-0.5
    X[:, 2] = X[:, 2] * 0.4  # emi_burden: 0-0.4
    X[:, 3] = X[:, 3] * 0.3  # expense_volatility: 0-0.3
    
    # Target: probability of stress (higher with high debt, low savings, high EMI)
    y = (X[:, 0] * 0.4 + (1 - X[:, 1]) * 0.3 + X[:, 2] * 0.2 + X[:, 3] * 0.1 + np.random.rand(n_samples) * 0.1)
    y = (y > 0.5).astype(int)
    
    # Scale features
    X_scaled = scaler.fit_transform(X)
    
    # Train model
    stress_model = LogisticRegression(random_state=42, max_iter=1000)
    stress_model.fit(X_scaled, y)
    
    print("Stress model trained successfully")

# Load models on startup
@app.on_event("startup")
async def startup_event():
    load_or_train_stress_model()

@app.get("/")
async def root():
    return {"message": "Finance ML Service", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/risk-assessment")
async def risk_assessment(request: RiskAssessmentRequest):
    """Calculate risk tolerance score and level"""
    try:
        age = request.age
        income = request.income
        expenses = request.expenses
        savings = request.savings
        debt = request.debt
        
        # Calculate risk score (0-100)
        risk_score = calculate_risk_score(age, income, expenses, savings, debt)
        
        # Determine risk level
        if risk_score < 40:
            risk_level = "Conservative"
        elif risk_score < 70:
            risk_level = "Balanced"
        else:
            risk_level = "Aggressive"
        
        # Calculate stress probability
        debt_to_income = debt / income if income > 0 else 0
        savings_rate = savings / income if income > 0 else 0
        emi_burden = (debt * 0.1) / income if income > 0 else 0  # Assuming 10% of debt as EMI
        expense_volatility = abs(expenses - income * 0.7) / income if income > 0 else 0
        
        stress_prob = predict_stress_probability(debt_to_income, savings_rate, emi_burden, expense_volatility)
        
        return {
            "riskScore": round(risk_score, 2),
            "riskLevel": risk_level,
            "stressProbability": round(stress_prob, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stress-prediction")
async def stress_prediction(request: StressPredictionRequest):
    """Predict financial stress probability"""
    try:
        prob = predict_stress_probability(
            request.debt_to_income_ratio,
            request.savings_rate,
            request.emi_burden,
            request.expense_volatility
        )
        
        return {
            "stressProbability": round(prob, 2),
            "riskLevel": "High" if prob > 0.5 else "Low"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/monte-carlo")
async def monte_carlo_simulation(request: MonteCarloRequest):
    """Run Monte Carlo simulation for portfolio projection"""
    try:
        results = run_monte_carlo(
            request.initial_amount,
            request.monthly_contribution,
            request.years,
            request.expected_return,
            request.volatility
        )
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_risk_score(age, income, expenses, savings, debt):
    """Calculate risk tolerance score (0-100)"""
    score = 50  # Base score
    
    # Age factor (younger = higher risk tolerance)
    if age < 30:
        score += 20
    elif age < 40:
        score += 10
    elif age < 50:
        score += 5
    
    # Savings ratio
    savings_ratio = savings / income if income > 0 else 0
    if savings_ratio > 0.3:
        score += 15
    elif savings_ratio > 0.2:
        score += 10
    elif savings_ratio > 0.1:
        score += 5
    
    # Debt ratio
    debt_ratio = debt / income if income > 0 else 0
    if debt_ratio < 0.2:
        score += 10
    elif debt_ratio < 0.3:
        score += 5
    elif debt_ratio > 0.4:
        score -= 15
    
    # Expense stability
    expense_ratio = expenses / income if income > 0 else 1
    if expense_ratio < 0.7:
        score += 10
    elif expense_ratio > 0.9:
        score -= 10
    
    return max(0, min(100, score))

def predict_stress_probability(debt_to_income, savings_rate, emi_burden, expense_volatility):
    """Predict probability of financial stress"""
    if stress_model is None:
        # Fallback calculation
        prob = (debt_to_income * 0.4 + (1 - savings_rate) * 0.3 + emi_burden * 0.2 + expense_volatility * 0.1)
        return min(100, max(0, prob * 100))
    
    # Use trained model
    features = np.array([[debt_to_income, savings_rate, emi_burden, expense_volatility]])
    features_scaled = scaler.transform(features)
    prob = stress_model.predict_proba(features_scaled)[0][1]
    return prob * 100

def run_monte_carlo(initial_amount, monthly_contribution, years, expected_return, volatility):
    """Run Monte Carlo simulation using Geometric Brownian Motion"""
    np.random.seed(42)
    n_simulations = 10000
    n_months = years * 12
    
    # Properly convert annual to monthly rates using continuous compounding
    # This accounts for the fact that returns compound geometrically, not linearly
    monthly_drift = (expected_return - 0.5 * volatility**2) / 12
    monthly_vol = volatility / np.sqrt(12)
    
    final_amounts = []
    
    for _ in range(n_simulations):
        amount = initial_amount
        
        for month in range(n_months):
            # Generate random shock from standard normal distribution
            random_shock = np.random.normal(0, 1)
            
            # Calculate monthly return using log-normal distribution (GBM)
            # This ensures returns follow a more realistic distribution
            log_return = monthly_drift + monthly_vol * random_shock
            monthly_multiplier = np.exp(log_return)
            
            # Apply return and add monthly contribution
            amount = amount * monthly_multiplier + monthly_contribution
        
        final_amounts.append(amount)
    
    final_amounts = np.array(final_amounts)
    
    # Calculate statistics
    worst_case = np.percentile(final_amounts, 5)
    best_case = np.percentile(final_amounts, 95)
    median = np.median(final_amounts)
    mean = np.mean(final_amounts)
    std_dev = np.std(final_amounts)
    
    return {
        "initialAmount": round(initial_amount, 2),
        "monthlyContribution": round(monthly_contribution, 2),
        "years": years,
        "simulations": n_simulations,
        "worstCase": round(worst_case, 2),
        "bestCase": round(best_case, 2),
        "median": round(median, 2),
        "mean": round(mean, 2),
        "stdDev": round(std_dev, 2),
        "expectedAnnualReturn": round(expected_return * 100, 2),
        "volatility": round(volatility * 100, 2)
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
