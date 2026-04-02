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
    
    df = df.copy()
    df['month'] = df['date'].dt.to_period('M')
    monthly = df.groupby('month')['amount'].sum().sort_index()
    
    if len(monthly) < 2:
        return 0.0
    
    # Get last two distinct months
    last_month = monthly.iloc[-1]
    prev_month = monthly.iloc[-2]
    
    if prev_month <= 0: # Handle 0 or negative (though negative is unlikely for spend)
        return 0.0
        
    return ((last_month - prev_month) / prev_month) * 100

def predict_spending(df: pd.DataFrame) -> list:
    if df.empty:
        return []

    df = df.copy()
    df['month_period'] = df['date'].dt.to_period('M')
    # Use sort_index to ensure chronological order before reset_index
    monthly_data = df.groupby('month_period')['amount'].sum().sort_index().reset_index()
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

    # Linear Regression (y = mx + c)
    A = np.vstack([x, np.ones(len(x))]).T
    m, c = np.linalg.lstsq(A, y, rcond=None)[0]

    # Predict next month
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

from thefuzz import fuzz

def find_recurring_patterns(df: pd.DataFrame):
    """
    Detects recurring transactions (e.g., Netflix, Rent) based on:
    1. Description similarity (fuzzy matching > 65)
    2. Consistent amounts (within ±$15)
    3. Occurs in at least 4 distinct months
    """
    if df.empty:
        return []

    # Sort by date for interval checking
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M')
    df = df.sort_values('date')
    
    descriptions = df['description'].unique()
    
    recurring = []
    groups = []
    processed = set()
    
    # 1. Fuzzy match descriptions (score > 65)
    for i, desc1 in enumerate(descriptions):
        if desc1 in processed:
            continue
        current_group = [desc1]
        processed.add(desc1)
        for desc2 in descriptions[i+1:]:
            if desc2 not in processed:
                score = fuzz.token_set_ratio(desc1.lower(), desc2.lower())
                if score > 65:
                    current_group.append(desc2)
                    processed.add(desc2)
        groups.append(current_group)
        
    for group_descs in groups:
        group_df = df[df['description'].isin(group_descs)]
        
        if len(group_df) < 4:
            continue
            
        # 2. Check if amounts are consistent (median ± $15)
        amounts = group_df['amount'].values
        median_amount = np.median(amounts)
        
        consistent_subset = group_df[np.abs(group_df['amount'] - median_amount) <= 15]
        
        # Verify it appears in at least 4 distinct months
        distinct_months = consistent_subset['month'].nunique()
        
        if distinct_months >= 4:
            dates = consistent_subset['date'].sort_values()
            recurring.append({
                "description": group_descs[0],
                "avg_amount": float(median_amount),
                "count": len(consistent_subset),
                "last_date": str(dates.iloc[-1].date()),
                "category": str(consistent_subset['category'].iloc[0]),
                "transaction_ids": consistent_subset['id'].tolist() if 'id' in consistent_subset.columns else []
            })
            
    return recurring
