document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a todos los elementos del DOM ---
    const imageInput = document.getElementById('image-input');
    const processBtn = document.getElementById('process-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resultsContainer = document.getElementById('results-container');
    const themeToggle = document.getElementById('theme-toggle');
    const dropZone = document.getElementById('drop-zone');
    const fileList = document.getElementById('file-list');

    let imageFiles = [];

    // --- FUNCIONES AYUDANTES ---

    const resizeImage = (file, maxWidth = 1500) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    if (img.width <= maxWidth) { return resolve(file); }
                    const canvas = document.createElement('canvas');
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    ctx.canvas.toBlob((blob) => {
                        const resizedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() });
                        resolve(resizedFile);
                    }, file.type, 0.9);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    /**
     * CORREGIDO: Reformatea el texto crudo del OCR, manejando todos los tipos de saltos de línea.
     * @param {string} rawText - El texto extraído directamente de la API de OCR.
     * @returns {string} El texto limpio y reformateado.
     */
    const reformatOcrText = (rawText) => {
        if (!rawText) return '';
        let normalizedText = rawText.replace(/\r\n?/g, '\n');
        let cleanedText = normalizedText.replace(/-\n/g, '');
        cleanedText = cleanedText.replace(/\n(?!\n)/g, ' ');
        cleanedText = cleanedText.replace(/ +/g, ' ');
        return cleanedText.trim();
    };

    // --- LÓGICA DE LA INTERFAZ DE USUARIO (UI) ---

    themeToggle.addEventListener('change', () => { document.documentElement.classList.toggle('light'); });
    const updateFileList = () => { /* ... (código sin cambios) ... */ };
    const handleFiles = (files) => { /* ... (código sin cambios) ... */ };
    // (Resto de la lógica de UI sin cambios)

    // --- LÓGICA PRINCIPAL DE PROCESAMIENTO ---
    processBtn.addEventListener('click', async () => {
        // (Lógica inicial sin cambios)

        for (const originalFile of imageFiles) {
            try {
                // (Lógica de fetch y llamada a la API sin cambios)
                
                const response = await fetch('https://api.ocr.space/parse/image', { /*...*/ });
                const data = await response.json();
                
                let rawText = '';
                if (data.IsErroredOnProcessing) {
                    throw new Error(data.ErrorMessage.join(' '));
                } else {
                    rawText = data.ParsedResults[0]?.ParsedText || '';
                }

                // Se llama a la función corregida, que ahora funcionará correctamente.
                const resultText = reformatOcrText(rawText);

                const imageURL = URL.createObjectURL(originalFile);
                resultsHTML += `
                    <div class="result-item">
                        <img src="${imageURL}" alt="${originalFile.name}">
                        <div class="text-content">
                            <textarea readonly>${resultText || 'No se pudo extraer texto.'}</textarea>
                            <button class="copy-btn" data-text="${resultText || ''}">Copiar</button>
                        </div>
                    </div>
                `;
            } catch (error) {
                // (Manejo de errores sin cambios)
            }
        }
        resultsContainer.innerHTML = resultsHTML;
    });

    // --- ACCIONES ADICIONALES ---
    // (clearBtn y copy-btn sin cambios)

    // --- INICIALIZACIÓN ---
    // (updateFileList sin cambios)
});
```
*(Nota: He colapsado el resto del código para que veas claramente que el único cambio está dentro de la función `reformatOcrText`. Por favor, utiliza la versión completa que te proporcionaré a continuación).*

Aquí está el código completo para que lo reemplaces directamente:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a todos los elementos del DOM ---
    const imageInput = document.getElementById('image-input');
    const processBtn = document.getElementById('process-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resultsContainer = document.getElementById('results-container');
    const themeToggle = document.getElementById('theme-toggle');
    const dropZone = document.getElementById('drop-zone');
    const fileList = document.getElementById('file-list');

    let imageFiles = [];

    // --- FUNCIONES AYUDANTES ---

    const resizeImage = (file, maxWidth = 1500) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    if (img.width <= maxWidth) { return resolve(file); }
                    const canvas = document.createElement('canvas');
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    ctx.canvas.toBlob((blob) => {
                        const resizedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() });
                        resolve(resizedFile);
                    }, file.type, 0.9);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    /**
     * CORREGIDO: Reformatea el texto crudo del OCR, manejando todos los tipos de saltos de línea.
     * @param {string} rawText - El texto extraído directamente de la API de OCR.
     * @returns {string} El texto limpio y reformateado.
     */
    const reformatOcrText = (rawText) => {
        if (!rawText) return '';
        let normalizedText = rawText.replace(/\r\n?/g, '\n');
        let cleanedText = normalizedText.replace(/-\n/g, '');
        cleanedText = cleanedText.replace(/\n(?!\n)/g, ' ');
        cleanedText = cleanedText.replace(/ +/g, ' ');
        return cleanedText.trim();
    };

    // --- LÓGICA DE LA INTERFAZ DE USUARIO (UI) ---

    themeToggle.addEventListener('change', () => { document.documentElement.classList.toggle('light'); });
    
    const updateFileList = () => {
        fileList.innerHTML = '';
        if (imageFiles.length === 0) {
            fileList.innerHTML = '<li>Ninguna imagen seleccionada.</li>';
        } else {
            imageFiles.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file.name;
                fileList.appendChild(li);
            });
        }
    };

    const handleFiles = (files) => {
        imageFiles = Array.from(files);
        updateFileList();
    };

    imageInput.addEventListener('change', (e) => handleFiles(e.target.files));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });

    // --- LÓGICA PRINCIPAL DE PROCESAMIENTO ---
    processBtn.addEventListener('click', async () => {
        if (imageFiles.length === 0) {
            alert('Por favor, selecciona al menos una imagen.');
            return;
        }
        if (typeof OCR_API_KEY === 'undefined' || OCR_API_KEY.includes('TU_CLAVE')) {
            alert('Error de configuración: La clave de la API no está definida.');
            return;
        }

        resultsContainer.innerHTML = '<p>Procesando, por favor espera...</p>';
        let resultsHTML = '';

        for (const originalFile of imageFiles) {
            try {
                const file = await resizeImage(originalFile);
                const formData = new FormData();
                formData.append('file', file);
                formData.append('apikey', OCR_API_KEY);
                formData.append('language', 'spa');

                const response = await fetch('https://api.ocr.space/parse/image', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();

                let rawText = '';
                if (data.IsErroredOnProcessing) {
                    throw new Error(data.ErrorMessage.join(' '));
                } else {
                    rawText = data.ParsedResults[0]?.ParsedText || '';
                }

                const resultText = reformatOcrText(rawText);

                const imageURL = URL.createObjectURL(originalFile);
                resultsHTML += `
                    <div class="result-item">
                        <img src="${imageURL}" alt="${originalFile.name}">
                        <div class="text-content">
                            <textarea readonly>${resultText || 'No se pudo extraer texto.'}</textarea>
                            <button class="copy-btn" data-text="${resultText || ''}">Copiar</button>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error procesando la imagen:', error);
                resultsHTML += `
                    <div class="result-item error">
                        <p>Error al procesar ${originalFile.name}</p>
                        <p><small>${error.message}</small></p>
                    </div>`;
            }
        }
        resultsContainer.innerHTML = resultsHTML;
    });

    // --- ACCIONES ADICIONALES ---
    clearBtn.addEventListener('click', () => {
        imageFiles = [];
        imageInput.value = '';
        resultsContainer.innerHTML = '';
        updateFileList();
    });

    resultsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('copy-btn')) {
            const textToCopy = event.target.dataset.text;
            navigator.clipboard.writeText(textToCopy).then(() => {
                event.target.textContent = '¡Copiado!';
                setTimeout(() => {
                    event.target.textContent = 'Copiar';
                }, 2000);
            }).catch(err => console.error('Error al copiar:', err));
        }
    });

    // --- INICIALIZACIÓN ---
    updateFileList();
});