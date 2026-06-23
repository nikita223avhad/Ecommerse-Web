from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base

DATABASE_URL = "mysql+pymysql://root:Niki2003%40ta@localhost:3306/ecommerce_db"

engine = create_engine(DATABASE_URL)

SessionaLocal = sessionmaker(
    autocommit = False,
    autoflush= False,
    bind=engine
)

Base = declarative_base()