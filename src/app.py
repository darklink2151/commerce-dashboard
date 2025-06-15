#!/usr/bin/env python3
import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import time
import uuid
from PIL import Image
import logging
from model import generator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
            static_folder="../static",
            template_folder="../templates")
CORS(app)

# Configuration
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/generate', methods=['POST'])
def generate_image():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        negative_prompt = data.get('negative_prompt', '')
        steps = int(data.get('steps', 30))
        guidance_scale = float(data.get('guidance_scale', 7.5))
        width = int(data.get('width', 512))
        height = int(data.get('height', 512))
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        # Generate image
        logger.info(f"Generating image with prompt: {prompt}")
        start_time = time.time()
        
        image = generator.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=steps,
            guidance_scale=guidance_scale,
            width=width,
            height=height
        )
        
        # Save the image
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        image.save(filepath)
        
        generation_time = time.time() - start_time
        logger.info(f"Image generated in {generation_time:.2f} seconds")
        
        return jsonify({
            "success": True,
            "image_url": f"/static/generated/{filename}",
            "generation_time": round(generation_time, 2),
            "prompt": prompt
        })
    
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    models = [
        {"id": "runwayml/stable-diffusion-v1-5", "name": "Stable Diffusion v1.5"},
        {"id": "stabilityai/stable-diffusion-2-1", "name": "Stable Diffusion v2.1"},
        {"id": "CompVis/stable-diffusion-v1-4", "name": "Stable Diffusion v1.4"}
    ]
    return jsonify(models)

@app.route('/model', methods=['GET', 'POST'])
def handle_model():
    if request.method == 'GET':
        return jsonify(generator.get_model_info())
    else:
        data = request.json
        model_id = data.get('model_id')
        if model_id:
            try:
                generator.change_model(model_id)
                return jsonify({"success": True, "message": f"Model changed to {model_id}"})
            except Exception as e:
                logger.error(f"Error changing model: {str(e)}")
                return jsonify({"error": str(e)}), 500
        return jsonify({"error": "model_id is required"}), 400

@app.route('/status', methods=['GET'])
def status():
    return jsonify(generator.get_model_info())

if __name__ == '__main__':
    logger.info(f"AI Art Generator starting...")
    app.run(host='0.0.0.0', port=5000, debug=True) 