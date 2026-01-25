from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
from io import BytesIO
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import tempfile
import urllib.request

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    couple_names: str = "Anna & Nemanja"
    welcome_text: str = "Leave a memory for"
    background_image: Optional[str] = None
    admin_password: str = "memora2024"
    tone_page_enabled: bool = True
    tone_questions: dict = {
        "wise": [
            "What wisdom would you share with them?",
            "What life lesson do you hope they remember?",
            "What truth about love would you tell them?",
            "What would you want them to never forget?",
            "What wise words would you give to them?"
        ],
        "funny": [
            "What's a funny memory or joke for them?",
            "What always makes you laugh about them?",
            "What's the funniest thing you remember?",
            "What would make them smile today?",
            "What's your most hilarious memory together?"
        ],
        "advice": [
            "What advice would you give them?",
            "What tip would help their journey?",
            "What suggestion do you have for them?",
            "What would you recommend they do?",
            "What guidance would you share?"
        ],
        "emotional": [
            "What heartfelt message do you have for them?",
            "What touches your heart about them?",
            "What do you love most about them?",
            "What makes them special to you?",
            "What would you want them to feel?"
        ]
    }

class SettingsUpdate(BaseModel):
    couple_names: Optional[str] = None
    welcome_text: Optional[str] = None
    background_image: Optional[str] = None
    admin_password: Optional[str] = None
    tone_page_enabled: Optional[bool] = None
    tone_questions: Optional[dict] = None

class Memory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    guest_name: str
    photo: Optional[str] = None
    message: str
    tone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemoryCreate(BaseModel):
    guest_name: str
    photo: Optional[str] = None
    message: str
    tone: Optional[str] = None

class AdminLogin(BaseModel):
    password: str

# Initialize settings if not exists
async def init_settings():
    settings = await db.settings.find_one({}, {"_id": 0})
    default_settings = Settings().model_dump()
    if not settings:
        await db.settings.insert_one(default_settings)
        return default_settings
    # Merge with defaults to add any new fields
    for key, value in default_settings.items():
        if key not in settings:
            settings[key] = value
            await db.settings.update_one({}, {"$set": {key: value}})
    return settings

@app.on_event("startup")
async def startup_event():
    await init_settings()

# Routes
@api_router.get("/")
async def root():
    return {"message": "Memora API"}

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({}, {"_id": 0, "admin_password": 0})
    if not settings:
        await init_settings()
        settings = await db.settings.find_one({}, {"_id": 0, "admin_password": 0})
    return settings

@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = Settings().model_dump()
    if login.password == settings.get("admin_password", "memora2024"):
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.put("/admin/settings")
async def update_settings(update: SettingsUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.settings.update_one({}, {"$set": update_data}, upsert=True)
    settings = await db.settings.find_one({}, {"_id": 0, "admin_password": 0})
    return settings

@api_router.post("/admin/background")
async def upload_background(file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    content_type = file.content_type or 'image/jpeg'
    data_url = f"data:{content_type};base64,{base64_image}"
    await db.settings.update_one({}, {"$set": {"background_image": data_url}}, upsert=True)
    return {"success": True, "background_image": data_url}

@api_router.post("/memories", response_model=Memory, status_code=201)
async def create_memory(memory: MemoryCreate):
    memory_obj = Memory(**memory.model_dump())
    doc = memory_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.memories.insert_one(doc)
    return memory_obj

@api_router.get("/memories", response_model=List[Memory])
async def get_memories():
    memories = await db.memories.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for memory in memories:
        if isinstance(memory.get('created_at'), str):
            memory['created_at'] = datetime.fromisoformat(memory['created_at'])
    return memories

@api_router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str):
    result = await db.memories.delete_one({"id": memory_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"success": True}

@api_router.get("/memories/pdf")
async def download_memories_pdf():
    memories = await db.memories.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    settings = await db.settings.find_one({}, {"_id": 0})
    
    buffer = BytesIO()
    width, height = A4
    c = canvas.Canvas(buffer, pagesize=A4)
    
    for i, memory in enumerate(memories):
        # Draw decorative border
        c.setStrokeColorRGB(0.9, 0.89, 0.88)
        c.setLineWidth(2)
        margin = 0.5 * inch
        c.rect(margin, margin, width - 2*margin, height - 2*margin)
        
        # Draw inner border
        c.setLineWidth(0.5)
        inner_margin = 0.7 * inch
        c.rect(inner_margin, inner_margin, width - 2*inner_margin, height - 2*inner_margin)
        
        # Title
        c.setFillColorRGB(0.11, 0.1, 0.09)
        c.setFont("Helvetica-Bold", 24)
        title = "This is your page in"
        title_width = c.stringWidth(title, "Helvetica-Bold", 24)
        c.drawString((width - title_width) / 2, height - 1.5*inch, title)
        
        c.setFont("Helvetica-Bold", 24)
        subtitle = "their book of memories."
        subtitle_width = c.stringWidth(subtitle, "Helvetica-Bold", 24)
        c.drawString((width - subtitle_width) / 2, height - 2*inch, subtitle)
        
        # Photo
        if memory.get('photo'):
            try:
                photo_data = memory['photo']
                if photo_data.startswith('data:'):
                    photo_data = photo_data.split(',')[1]
                img_bytes = base64.b64decode(photo_data)
                img = Image.open(BytesIO(img_bytes))
                
                # Resize for PDF
                img_width = 2.5 * inch
                img_height = 2.5 * inch
                img_x = (width - img_width) / 2
                img_y = height - 5 * inch
                
                # Save temp image
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                    img.save(tmp.name, 'PNG')
                    c.drawImage(tmp.name, img_x, img_y, width=img_width, height=img_height, preserveAspectRatio=True, mask='auto')
                    os.unlink(tmp.name)
            except Exception as e:
                logging.error(f"Error adding photo: {e}")
        
        # Guest name
        c.setFillColorRGB(0.11, 0.1, 0.09)
        c.setFont("Helvetica-Bold", 20)
        name = memory.get('guest_name', 'Guest')
        name_width = c.stringWidth(name, "Helvetica-Bold", 20)
        c.drawString((width - name_width) / 2, height - 5.5*inch, name)
        
        # Question
        c.setFont("Helvetica-Oblique", 14)
        question = "What do you wish them never to forget?"
        question_width = c.stringWidth(question, "Helvetica-Oblique", 14)
        c.drawString((width - question_width) / 2, height - 6.2*inch, question)
        
        # Message box
        c.setFillColorRGB(0.96, 0.96, 0.95)
        box_width = 5 * inch
        box_height = 2.5 * inch
        box_x = (width - box_width) / 2
        box_y = height - 9 * inch
        c.roundRect(box_x, box_y, box_width, box_height, 10, fill=1, stroke=0)
        
        # Message text
        c.setFillColorRGB(0.11, 0.1, 0.09)
        c.setFont("Helvetica", 12)
        message = memory.get('message', '')
        
        # Word wrap
        words = message.split()
        lines = []
        current_line = ""
        for word in words:
            test_line = f"{current_line} {word}".strip()
            if c.stringWidth(test_line, "Helvetica", 12) < box_width - 40:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        
        y_offset = box_y + box_height - 30
        for line in lines[:10]:
            c.drawString(box_x + 20, y_offset, line)
            y_offset -= 18
        
        if i < len(memories) - 1:
            c.showPage()
    
    c.save()
    buffer.seek(0)
    
    settings = await db.settings.find_one({}, {"_id": 0})
    couple_names = settings.get('couple_names', 'Memories') if settings else 'Memories'
    filename = f"memora_{couple_names.replace(' ', '_').replace('&', 'and')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
