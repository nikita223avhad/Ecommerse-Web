from pydantic import BaseModel,EmailStr

class UserCreate(BaseModel):
    username : str
    email : EmailStr
    password : str

class LoginSchema(BaseModel):

    email:EmailStr
    password : str    