import pytest
import pandas as pd
from analytics import process_csv, calculate_category_spending, calculate_monthly_growth, predict_spending


SAMPLE_CSV = b"""date,description,category,amount
2023-01-01,Groceries,Food,100
2023-01-15,Internet,Utilities,50
2023-02-01,Groceries,Food,120
2023-02-20,Phone,Utilities,60
2023-03-05,Groceries,Food,110
"""

def test_process_csv_valid():
    df = process_csv(SAMPLE_CSV)
    assert not df.empty
    assert list(df.columns) == ['date', 'description', 'category', 'amount']
    assert len(df) == 5

def test_process_csv_invalid_columns():
    invalid_csv = b"date,amount\n2023-01-01,100"
    with pytest.raises(ValueError, match="Missing columns"):
        process_csv(invalid_csv)

def test_calculate_category_spending():
    df = process_csv(SAMPLE_CSV)
    result = calculate_category_spending(df)
    assert result['Food'] == 330
    assert result['Utilities'] == 110

def test_calculate_monthly_growth():
    df = process_csv(SAMPLE_CSV)

    gw = calculate_monthly_growth(df)
    assert gw == pytest.approx(-38.88, 0.1)

def test_predict_spending():
    df = process_csv(SAMPLE_CSV)

    prediction = predict_spending(df)
    assert len(prediction) == 4
    assert prediction[-1]['type'] == 'predicted'
    assert prediction[-1]['month'] == '2023-04'
