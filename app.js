document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a todos los elementos del DOM que usaremos ---
    const imageInput = document.getElementById('image-input');
    const processBtn = document.getElementById('process-btn');
    const clearBtn = document.getElementById('clear-btn');
    const actionSelect = document.getElementById('action-select');
    const customInstruction = document.getElementById('custom-instruction');
    const resultsContainer = document.getElementById('results-container');
    const themeToggle = document.getElementById('theme-toggle');
    const dropZone = document.getElementById('drop-zone');
    const fileList = document.getElementById('file-list');

    // Variable global para almacenar los archivos de imagen seleccionados
    let imageFiles = [];

    // --- FUNCIONES AYUDANTES ---

    /**
     * Convierte un objeto File a una cadena de texto base64 (Data URL).
     * Necesario para la función de OCR de Puter.
     * @param {File} file - El archivo a convertir.
     * @returns {Promise<string>} Una promesa que se resuelve con la Data URL.
     */
    const convertFileToDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    /**
     * Redimensiona una imagen en el navegador si excede un ancho máximo para optimizarla.
     * Previene errores de red con archivos grandes.
     * @param {File} file - El archivo de imagen original.
     * @param {number} maxWidth - El ancho máximo permitido en píxeles.
     * @returns {Promise<File>} Una promesa que se resuelve con el nuevo archivo optimizado.
     */
    const resizeImage = (file, maxWidth = 1500) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    if (img.width <= maxWidth) {
                        // La imagen ya es suficientemente pequeña, no es necesario redimensionar.
                        return resolve(file);
                    }

                    const canvas = document.createElement('canvas');
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Convierte el canvas de nuevo a un archivo (Blob) con calidad del 90%
                    ctx.canvas.toBlob((blob) => {
                        const resizedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(resizedFile);
                    }, file.type, 0.9);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    // --- LÓGICA DE LA INTERFAZ DE USUARIO (UI) ---

    // Lógica para el cambio de tema (oscuro/claro)
    themeToggle.addEventListener('change', () => {
        document.documentElement.classList.toggle('light');
        document.documentElement.classList.toggle('dark');
    });

    // Función para actualizar la lista visual de archivos cargados
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

    // Función centralizada para manejar los archivos
    const handleFiles = (files) => {
        imageFiles = Array.from(files);
        updateFileList();
    };

    // Event listener para el botón de selección de archivos
    imageInput.addEventListener('change', (event) => handleFiles(event.target.files));

    // Lógica completa para Arrastrar y Soltar (Drag and Drop)
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(event.dataTransfer.files);
    });

    // Lógica para mostrar/ocultar el campo de instrucción personalizada
    actionSelect.addEventListener('change', () => {
        customInstruction.style.display = (actionSelect.value === 'custom') ? 'block' : 'none';
    });
    actionSelect.dispatchEvent(new Event('change'));


    // --- LÓGICA PRINCIPAL DE PROCESAMIENTO ---
    processBtn.addEventListener('click', async () => {
        if (imageFiles.length === 0) {
            alert('Por favor, selecciona al menos una imagen.');
            return;
        }

        resultsContainer.innerHTML = '<p>Procesando, por favor espera...</p>';
        let resultsHTML = '';

        for (const originalFile of imageFiles) {
            try {
                // 1. OPTIMIZAR: Redimensionamos la imagen antes de hacer cualquier otra cosa.
                const file = await resizeImage(originalFile);

                const action = actionSelect.value;
                let resultText = '';

                // 2. PROCESAR: Ejecutamos la acción de IA seleccionada con el archivo optimizado.
                if (action === 'ocr') {
                    const fileAsDataURL = await convertFileToDataURL(file);
                    resultText = await puter.ai.img2txt(fileAsDataURL);
                } else {
                    const instruction = action === 'describe'
                        ? 'Describe detalladamente lo que ves en esta imagen.'
                        : customInstruction.value;
                    
                    if (!instruction) {
                        alert('Por favor, escribe una instrucción para la opción personalizada.');
                        continue; // Salta a la siguiente imagen
                    }

                    const response = await puter.ai.chat({
                        messages: [
                            { role: 'user', content: instruction },
                            { role: 'user', content: file }
                        ]
                    });
                    resultText = response.message.content;
                }

                // 3. MOSTRAR: Creamos la tarjeta de resultado en el HTML.
                const imageURL = URL.createObjectURL(originalFile);
                resultsHTML += `
                    <div class="result-item">
                        <img src="${imageURL}" alt="${originalFile.name}">
                        <div class="text-content">
                            <textarea readonly>${resultText || 'No se pudo generar una respuesta.'}</textarea>
                            <button class="copy-btn" data-text="${resultText || ''}">Copiar</button>
                        </div>
                    </div>
                `;

            } catch (error) {
                // MANEJO DE ERRORES: Si algo falla, mostramos una tarjeta de error.
                console.error('Error procesando la imagen:', error);
                let errorMessage = "Ocurrió un error desconocido.";
                if (error && error.error && typeof error.error.message === 'string') {
                    errorMessage = error.error.message;
                } else if (error && typeof error.message === 'string') {
                    errorMessage = error.message;
                } else {
                    errorMessage = JSON.stringify(error);
                }
                resultsHTML += `
                    <div class="result-item error">
                        <p>Error al procesar ${originalFile.name}</p>
                        <p><small>${errorMessage}</small></p>
                    </div>`;
            }
        }
        resultsContainer.innerHTML = resultsHTML;
    });

    // --- ACCIONES ADICIONALES ---

    // Lógica para el botón de Limpiar Todo
    clearBtn.addEventListener('click', () => {
        imageFiles = [];
        imageInput.value = '';
        resultsContainer.innerHTML = '';
        updateFileList();
    });

    // Lógica para el botón de Copiar Texto
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
    // Asegura que la lista de archivos se muestre correctamente al cargar la página.
    updateFileList();
});