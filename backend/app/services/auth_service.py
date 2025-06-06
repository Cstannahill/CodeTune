from app.core.database import get_database
from app.models.user import User
from passlib.context import CryptContext
from jose import JWTError, jwt


class AuthService:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    secret_key = "your_secret_key"
    algorithm = "HS256"

    @staticmethod
    async def register_user(username: str, password: str) -> bool:
        db = get_database()
        hashed_password = AuthService.pwd_context.hash(password)
        user = User(username=username, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        return True

    @staticmethod
    async def login_user(username: str, password: str) -> str | None:
        db = get_database()
        user = db.query(User).filter(User.username == username).first()
        if user and AuthService.pwd_context.verify(password, user.hashed_password):
            token = jwt.encode(
                {"sub": user.username},
                AuthService.secret_key,
                algorithm=AuthService.algorithm,
            )
            return token
        return None
