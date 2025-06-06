from fastapi import HTTPException
from colorama import Fore, Style
import asyncio


class HealthCheckService:
    def __init__(self):
        self.status = "healthy"

    def get_status(self):
        return {"status": self.status}

    def pulse(self):
        try:
            # Add logic to check database connection, external APIs, etc.
            return {"pulse": "active"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def continuous_pulse(self):
        while True:
            try:
                pulse_status = self.pulse()
                print(f"{Fore.GREEN}Health Pulse: {pulse_status}{Style.RESET_ALL}")
            except Exception as e:
                print(f"{Fore.RED}Health Pulse Error: {str(e)}{Style.RESET_ALL}")
            await asyncio.sleep(10)
