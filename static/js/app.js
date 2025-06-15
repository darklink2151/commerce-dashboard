document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const generationForm = document.getElementById('generation-form');
    const promptInput = document.getElementById('prompt');
    const negativePromptInput = document.getElementById('negative-prompt');
    const stepsInput = document.getElementById('steps');
    const stepsValue = document.getElementById('steps-value');
    const guidanceInput = document.getElementById('guidance');
    const guidanceValue = document.getElementById('guidance-value');
    const widthSelect = document.getElementById('width');
    const heightSelect = document.getElementById('height');
    const generateBtn = document.getElementById('generate-btn');
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('result');
    const resultImage = document.getElementById('result-image');
    const generationTimeElement = document.getElementById('generation-time');
    const initialMessage = document.getElementById('initial-message');
    const errorMessage = document.getElementById('error-message');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    const galleryElement = document.getElementById('gallery');
    
    // Local gallery storage
    let galleryImages = JSON.parse(localStorage.getItem('aiArtGallery')) || [];
    
    // Update range input displays
    stepsInput.addEventListener('input', () => {
        stepsValue.textContent = stepsInput.value;
    });
    
    guidanceInput.addEventListener('input', () => {
        guidanceValue.textContent = guidanceInput.value;
    });
    
    // Form submission
    generationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!promptInput.value.trim()) {
            alert('Please enter a prompt');
            promptInput.focus();
            return;
        }
        
        // Show loading state
        setGeneratingState(true);
        
        // Prepare data
        const data = {
            prompt: promptInput.value.trim(),
            negative_prompt: negativePromptInput.value.trim(),
            steps: parseInt(stepsInput.value),
            guidance_scale: parseFloat(guidanceInput.value),
            width: parseInt(widthSelect.value),
            height: parseInt(heightSelect.value)
        };
        
        try {
            // Send request to API
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate image');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Display the generated image
                displayGeneratedImage(result);
                
                // Add to gallery
                addToGallery(result);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            setGeneratingState(false);
        }
    });
    
    // Download button
    downloadBtn.addEventListener('click', () => {
        if (resultImage.src) {
            const link = document.createElement('a');
            link.href = resultImage.src;
            link.download = `ai-art-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
    
    // Share button
    shareBtn.addEventListener('click', async () => {
        if (resultImage.src && navigator.share) {
            try {
                // Convert image to blob for sharing
                const response = await fetch(resultImage.src);
                const blob = await response.blob();
                const file = new File([blob], 'ai-artwork.png', { type: 'image/png' });
                
                await navigator.share({
                    title: 'My AI Generated Artwork',
                    text: `AI artwork generated with prompt: ${promptInput.value}`,
                    files: [file]
                });
            } catch (error) {
                console.error('Error sharing:', error);
                alert('Could not share the image');
            }
        } else {
            alert('Sharing is not supported on this browser');
        }
    });
    
    // Helper functions
    function setGeneratingState(isGenerating) {
        if (isGenerating) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
            loadingElement.classList.remove('hidden');
            resultElement.classList.add('hidden');
            initialMessage.classList.add('hidden');
            errorMessage.classList.add('hidden');
        } else {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Image';
            loadingElement.classList.add('hidden');
        }
    }
    
    function displayGeneratedImage(result) {
        resultImage.src = result.image_url;
        resultImage.alt = `AI generated image: ${result.prompt}`;
        generationTimeElement.textContent = `Generated in ${result.generation_time} seconds`;
        resultElement.classList.remove('hidden');
        initialMessage.classList.add('hidden');
    }
    
    function showError(message) {
        errorMessage.querySelector('p').textContent = message || 'Error generating image. Please try again.';
        errorMessage.classList.remove('hidden');
        resultElement.classList.add('hidden');
        initialMessage.classList.add('hidden');
    }
    
    function addToGallery(result) {
        // Add to local storage
        const galleryItem = {
            id: Date.now(),
            imageUrl: result.image_url,
            prompt: result.prompt,
            timestamp: new Date().toISOString()
        };
        
        galleryImages.unshift(galleryItem);
        
        // Limit gallery size
        if (galleryImages.length > 20) {
            galleryImages = galleryImages.slice(0, 20);
        }
        
        localStorage.setItem('aiArtGallery', JSON.stringify(galleryImages));
        
        // Update gallery display
        renderGallery();
    }
    
    function renderGallery() {
        galleryElement.innerHTML = '';
        
        if (galleryImages.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Your gallery is empty. Generate some art!';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#6c757d';
            galleryElement.appendChild(emptyMessage);
            return;
        }
        
        galleryImages.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.dataset.id = item.id;
            
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = item.prompt;
            img.loading = 'lazy';
            
            galleryItem.appendChild(img);
            galleryElement.appendChild(galleryItem);
            
            // Click to view
            galleryItem.addEventListener('click', () => {
                resultImage.src = item.imageUrl;
                resultImage.alt = `AI generated image: ${item.prompt}`;
                promptInput.value = item.prompt;
                resultElement.classList.remove('hidden');
                initialMessage.classList.add('hidden');
                errorMessage.classList.add('hidden');
                
                // Scroll to result
                resultElement.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
    
    // Initialize gallery
    renderGallery();
    
    // Check server status
    async function checkServerStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            console.log('Server status:', data);
            
            // If using CPU, show warning
            if (data.device === 'cpu') {
                const header = document.querySelector('header');
                const warning = document.createElement('div');
                warning.className = 'warning';
                warning.textContent = '⚠️ Running on CPU mode. Image generation will be slow.';
                warning.style.backgroundColor = '#fff3cd';
                warning.style.color = '#856404';
                warning.style.padding = '10px';
                warning.style.borderRadius = 'var(--border-radius)';
                warning.style.marginTop = '10px';
                header.appendChild(warning);
            }
        } catch (error) {
            console.error('Error checking server status:', error);
        }
    }
    
    checkServerStatus();
}); 