import pandas as pd
import numpy as np
import io
from thefuzz import fuzz

def process_csv(file_content: bytes) -> pd.DataFrame:
    """
    Parses raw CSV bytes into a clean Pandas DataFrame.
    
    Validates required columns (date, description, category, amount) 
    and ensures correct data types.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_content))
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
    """Groups spending by category and returns a dictionary of totals."""
    spending = df.groupby('category')['amount'].sum().to_dict()
    return spending

def calculate_monthly_growth(df: pd.DataFrame) -> float:
    """
    Calculates the percentage growth in spending between the last two months.
    Returns 0.0 if fewer than 2 months of data exist.
    """
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
    
    if prev_month <= 0:
        return 0.0
        
    return ((last_month - prev_month) / prev_month) * 100

def predict_spending(df: pd.DataFrame) -> list:
    """
    Uses linear regression to predict next month's spending.
    Returns a list of dictionaries with actual and predicted data points.
    """
    if df.empty:
        return []

    df = df.copy()
    df['month_period'] = df['date'].dt.to_period('M')
    
    # Ensure chronological order and reset index for regression math
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

    # Predict next month index
    next_idx = len(monthly_data)
    next_val = m * next_idx + c
    next_month_str = str(monthly_data['month_period'].iloc[-1] + 1)

    result = []
    # Add actual data points
    for _, row in monthly_data.iterrows():
        result.append({
            "month": str(row['month_period']),
            "amount": float(row['amount']),
            "type": "actual"
        })

    # Add predicted data point
    result.append({
        "month": next_month_str,
        "amount": max(0, float(next_val)),
        "type": "predicted"
    })

    return result

def find_recurring_patterns(df: pd.DataFrame):
    """
    Detects recurring transactions (e.g., Netflix, Rent) based on:
    1. Description similarity (fuzzy matching > 65)
    2. Consistent amounts (within ±$15)
    3. Occurrences spread across at least 4 distinct months
    """
    if df.empty:
        return []

    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M')
    df = df.sort_values('date')
    
    descriptions = df['description'].unique()
    
    recurring = []
    groups = []
    processed = set()
    
    # Phase 1: Group descriptions using fuzzy matching
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
        
    # Phase 2: Validate grouped transactions for recurrence
    for group_descs in groups:
        group_df = df[df['description'].isin(group_descs)]
        
        if len(group_df) < 4:
            continue
            
        # Amount consistency check (using median and ±$15 tolerance)
        amounts = group_df['amount'].values
        median_amount = np.median(amounts)
        consistent_subset = group_df[np.abs(group_df['amount'] - median_amount) <= 15]
        
        # Verify long-term pattern (must span at least 4 different months)
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
