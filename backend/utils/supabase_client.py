from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.
    
    Returns:
        Client: Configured Supabase client
        
    Raises:
        ValueError: If required environment variables are not set
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url:
        raise ValueError("SUPABASE_URL environment variable is required")
    if not key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
    
    return create_client(url, key)
