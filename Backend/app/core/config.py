from pydantic_setting import BaseSettings

class Settings(BaseSettings):
    MYSQL_HOST : str
    MYSQL_PORT : int
    MYSQL_USER : str
    MYSQL_PASSWORD : str
    MYSQL_DATABASE : str

    class Config :
        env_file = '.env'

setting = Settings()        