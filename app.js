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

    /**
     * Toma un objeto File y lo convierte a una cadena de texto base64 (Data URL).
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

    // --- Lógica para el cambio de tema (oscuro/claro) ---
    themeToggle.addEventListener('change', () => {
        document.documentElement.classList.toggle('light');
        document.documentElement.classList.toggle('dark');
    });

    // --- Función para actualizar la lista visual de archivos cargados ---
    const updateFileList = () => {
        fileList.innerHTML = '';
        if (imageFiles.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Ninguna imagen seleccionada.';
            fileList.appendChild(li);
        } else {
            imageFiles.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file.name;
                fileList.appendChild(li);
            });
        }
    };

    // --- Función centralizada para manejar los archivos ---
    const handleFiles = (files) => {
        imageFiles = Array.from(files);
        updateFileList();
    };

    // --- Event listener para el botón de selección de archivos ---
    imageInput.addEventListener('change', (event) => handleFiles(event.target.files));

    // --- Lógica completa para Arrastrar y Soltar (Drag and Drop) ---
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(event.dataTransfer.files);
    });

    // --- Lógica para mostrar/ocultar el campo de instrucción personalizada ---
    actionSelect.addEventListener('change', () => {
        customInstruction.style.display = (actionSelect.value === 'custom') ? 'block' : 'none';
    });
    actionSelect.dispatchEvent(new Event('change'));

    // --- Lógica principal de Procesamiento de imágenes ---
    processBtn.addEventListener('click', async () => {
        if (imageFiles.length === 0) {
            alert('Por favor, selecciona al menos una imagen.');
            return;
        }

        resultsContainer.innerHTML = '<p>Procesando, por favor espera...</p>';
        let resultsHTML = '';

        for (const file of imageFiles) {
            const action = actionSelect.value;
            let resultText = '';

            try {
                if (action === 'ocr') {
                    const fileAsDataURL = await convertFileToDataURL(file);
                    resultText = await puter.ai.img2txt(fileAsDataURL);
                } else if (action === 'describe') {
                    const response = await puter.ai.chat({
                        messages: [
                            { role: 'user', content: 'Describe detalladamente lo que ves en esta imagen.' },
                            { role: 'user', content: file }
                        ]
                    });
                    resultText = response.message.content;
                } else if (action === 'custom') {
                    const instruction = customInstruction.value;
                    if (!instruction) {
                        alert('Por favor, escribe una instrucción para la opción personalizada.');
                        continue;
                    }
                    const response = await puter.ai.chat({
                        messages: [
                            { role: 'user', content: instruction },
                            { role: 'user', content: file }
                        ]
                    });
                    resultText = response.message.content;
                }

                const imageURL = URL.createObjectURL(file);
                resultsHTML += `
                    <div class="result-item">
                        <img src="${imageURL}" alt="${file.name}">
                        <div class="text-content">
                            <textarea readonly>${resultText || 'No se pudo generar una respuesta.'}</textarea>
                            <button class="copy-btn" data-text="${resultText}">Copiar</button>
                        </div>
                    </div>
                `;
            } catch (error) {
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
                        <p>Error al procesar ${file.name}</p>
                        <p><small>${errorMessage}</small></p> 
                    </div>`;
            }
        }
        resultsContainer.innerHTML = resultsHTML;
    });

    // --- Lógica para el botón de Limpiar Todo ---
    clearBtn.addEventListener('click', () => {
        imageFiles = [];
        imageInput.value = '';
        resultsContainer.innerHTML = '';
        updateFileList();
    });

    // --- Lógica para el botón de Copiar Texto ---
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

    updateFileList();
});