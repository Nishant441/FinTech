from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    transactions = relationship("Transaction", back_populates="file", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    description = Column(String)
    category = Column(String)
    amount = Column(Float)
    is_recurring = Column(Integer, default=0) # Using 1 for True, 0 for False
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=True)
    file = relationship("UploadedFile", back_populates="transactions")

class Summary(Base):
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String) 
