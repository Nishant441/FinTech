import pandas as pd
import numpy as np
from datetime import datetime
from io import BytesIO

def process_csv(file_content: bytes) -> pd.DataFrame:

    try:
        df = pd.read_csv(BytesIO(file_content))
        df = pd.read_csv(BytesIO(file_content))
        df.columns = [c.lower().strip() for c in df.columns]
        
        required_cols = {'date', 'description', 'category', 'amount'}
        if not required_cols.issubset(df.columns):
            missing = required_cols - set(df.columns)
            raise ValueError(f"Missing columns: {missing}")

        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        return df
    except Exception as e:
        raise ValueError(f"Error processing CSV: {str(e)}")

def calculate_category_spending(df: pd.DataFrame) -> dict:

    spending = df.groupby('category')['amount'].sum().to_dict()
    return spending

def calculate_monthly_growth(df: pd.DataFrame) -> float:

    if df.empty:
        return 0.0
    
    df['month'] = df['date'].dt.to_period('M')
    monthly = df.groupby('month')['amount'].sum().sort_index()
    
    if len(monthly) < 2:
        return 0.0
    
    last_month = monthly.iloc[-1]
    prev_month = monthly.iloc[-2]
    
    if prev_month == 0:
        return 0.0
        
    return ((last_month - prev_month) / prev_month) * 100

def predict_spending(df: pd.DataFrame) -> list:

    if df.empty:
        return []

    df['month_period'] = df['date'].dt.to_period('M')
    monthly_data = df.groupby('month_period')['amount'].sum().reset_index()
    monthly_data['month_idx'] = np.arange(len(monthly_data))
    

    if len(monthly_data) < 2:
        result = []
        for _, row in monthly_data.iterrows():
            result.append({
                "month": str(row['month_period']),
                "amount": float(row['amount']),
                "type": "actual"
            })
        return result

    x = monthly_data['month_idx'].values
    y = monthly_data['amount'].values
    

    A = np.vstack([x, np.ones(len(x))]).T
    m, c = np.linalg.lstsq(A, y, rcond=None)[0]
    

    next_idx = len(monthly_data)
    next_val = m * next_idx + c
    next_month_str = str(monthly_data['month_period'].iloc[-1] + 1)
    
    result = []
    for _, row in monthly_data.iterrows():
        result.append({
            "month": str(row['month_period']),
            "amount": float(row['amount']),
            "type": "actual"
        })
    
    result.append({
        "month": next_month_str,
        "amount": max(0, float(next_val)),
        "type": "predicted"
    })
    
    return result
