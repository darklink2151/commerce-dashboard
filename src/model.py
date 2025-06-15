import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ArtGenerator:
    def __init__(self, model_id="runwayml/stable-diffusion-v1-5"):
        self.model_id = model_id
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.pipe = None
        logger.info(f"Initializing ArtGenerator with model {model_id} on {self.device}")
    
    def load_model(self):
        """Load the model if not already loaded"""
        if self.pipe is None:
            logger.info(f"Loading model {self.model_id} on {self.device}")
            
            # Use DPMSolverMultistepScheduler for faster inference
            self.pipe = StableDiffusionPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                safety_checker=None  # Disable safety checker for performance
            )
            
            # Use more efficient scheduler
            self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(self.pipe.scheduler.config)
            
            # Move to device
            if self.device == "cuda":
                self.pipe = self.pipe.to(self.device)
                
            # Enable memory efficient attention if available
            if hasattr(self.pipe, "enable_attention_slicing"):
                self.pipe.enable_attention_slicing()
                
            logger.info(f"Model loaded successfully")
        return self.pipe
    
    def generate_image(self, prompt, negative_prompt="", num_inference_steps=30, 
                      guidance_scale=7.5, width=512, height=512):
        """Generate an image based on the prompt"""
        try:
            # Load model if needed
            self.load_model()
            
            logger.info(f"Generating image with prompt: {prompt}")
            
            # Generate the image
            image = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                width=width,
                height=height
            ).images[0]
            
            logger.info(f"Image generated successfully")
            return image
            
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            raise
    
    def change_model(self, model_id):
        """Change the model being used"""
        if self.model_id != model_id:
            logger.info(f"Changing model from {self.model_id} to {model_id}")
            self.model_id = model_id
            self.pipe = None  # Force reload with new model
            return True
        return False
    
    def get_model_info(self):
        """Return information about the current model"""
        return {
            "model_id": self.model_id,
            "device": self.device,
            "cuda_available": torch.cuda.is_available(),
            "loaded": self.pipe is not None
        }
    
    def unload_model(self):
        """Unload the model to free up memory"""
        if self.pipe is not None:
            del self.pipe
            self.pipe = None
            torch.cuda.empty_cache()
            logger.info("Model unloaded")
            return True
        return False

# Global instance
generator = ArtGenerator() 