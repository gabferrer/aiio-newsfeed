from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, JSON
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import glob
import time
from pathlib import Path

# --- Configuration ---
SYNC_FOLDER = r"E:\Gabriel\Users\Desktop\NewsroomTest"
Path(SYNC_FOLDER).mkdir(parents=True, exist_ok=True) 

# --- Database Setup ---
DATABASE_URL = "sqlite:///./newsroom.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ArticleModel(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    
    # Core Fields
    headline = Column(String, index=True)
    summary = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    published_date = Column(String, nullable=True)
    sources = Column(JSON, nullable=True)
    
    # Taxonomy Filters
    news_type = Column(String, index=True, nullable=True)
    category = Column(String, index=True, nullable=True)
    
    # Editorial & Deep Dive
    overview = Column(Text, nullable=True)
    analysis = Column(Text, nullable=True)
    key_takeaways = Column(JSON, nullable=True) 
    
    # Verification
    primary_citations_repositories = Column(JSON, nullable=True)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Schemas ---
class ArticleResponse(BaseModel):
    id: int
    headline: str
    summary: Optional[str] = None
    url: Optional[str] = None
    published_date: Optional[str] = None
    sources: Optional[List[str]] = []
    
    news_type: Optional[str] = None
    category: Optional[str] = None
    
    overview: Optional[str] = None
    analysis: Optional[str] = None
    key_takeaways: Optional[List[str]] = []
    
    # Using List[Dict[str, Any]] to accommodate the structured citation objects
    primary_citations_repositories: Optional[List[Dict[str, Any]]] = []

# --- FastAPI App ---
app = FastAPI(title="AI Newsroom API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/news", response_model=List[ArticleResponse])
def get_articles_and_ingest(
    category: Optional[str] = None, 
    news_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # 1. INGESTION PHASE: Scan the folder for new JSON files
    search_pattern = os.path.join(SYNC_FOLDER, "*.json")
    current_time = time.time()
    
    for filepath in glob.glob(search_pattern):
        # 120-Second File Age Buffer to prevent race conditions with ChatGPT
        file_age = current_time - os.path.getmtime(filepath)
        if file_age < 120:
            continue
            
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Map the comprehensive JSON schema to the SQLite database safely
            db_article = ArticleModel(
                headline=data.get("headline", "Untitled"), 
                summary=data.get("summary", ""), 
                url=data.get("url", "#"),
                published_date=data.get("published_date"),
                sources=data.get("sources", []),
                
                news_type=data.get("news_type"),
                category=data.get("category"),
                
                overview=data.get("overview", ""),
                analysis=data.get("analysis", ""),
                key_takeaways=data.get("key_takeaways", []),
                
                primary_citations_repositories=data.get("primary_citations_repositories", [])
            )
            db.add(db_article)
            db.commit()
            
            # Delete the file so it isn't ingested again next time
            os.remove(filepath)
            print(f"Ingested and removed: {filepath}")
            
        except Exception as e:
            print(f"Failed to process {filepath}: {e}")
            os.rename(filepath, filepath + ".error")

    # 2. RETRIEVAL PHASE: Query the database with optional filters
    query = db.query(ArticleModel)
    
    # Apply filters if they were provided in the request URL (e.g., ?category=LLMS)
    if category and category.upper() != "ALL":
        query = query.filter(ArticleModel.category == category)
    if news_type and news_type.upper() != "ALL":
        query = query.filter(ArticleModel.news_type == news_type)
        
    return query.order_by(ArticleModel.id.desc()).limit(100).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)