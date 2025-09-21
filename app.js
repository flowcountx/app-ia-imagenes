document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a los elementos del DOM ---
    const imageInput = document.getElementById('image-input');
    const processBtn = document.getElementById('process-btn');
    const clearBtn = document.getElementById('clear-btn');
    const actionSelect = document.getElementById('action-select');
    const customInstruction = document.getElementById('custom-instruction');
    const resultsContainer = document.getElementById('results-container');
    const themeToggle = document.getElementById('theme-toggle');
    const dropZone = document.getElementById('drop-zone'); // Nueva referencia
    const fileList = document.getElementById('file-list'); // Nueva referencia

    let imageFiles = []; // Mantenemos la lista de archivos aquí

    // --- Lógica para el cambio de tema (oscuro/claro) ---
    themeToggle.addEventListener('change', () => {
        document.documentElement.classList.toggle('light');
        document.documentElement.classList.toggle('dark');
    });

    // --- NUEVA FUNCIÓN: Actualizar la lista de archivos en la UI ---
    const updateFileList = () => {
        fileList.innerHTML = ''; // Limpiamos la lista anterior
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

    // --- NUEVA FUNCIÓN: Manejar los archivos seleccionados (reutilizable) ---
    const handleFiles = (files) => {
        imageFiles = Array.from(files);
        updateFileList();
    };

    // --- Event listeners para la carga de archivos ---
    imageInput.addEventListener('change', (event) => handleFiles(event.target.files));

    // --- NUEVA LÓGICA: Arrastrar y soltar ---
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault(); // ¡Muy importante! Previene que el navegador abra el archivo.
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault(); // ¡Muy importante!
        dropZone.classList.remove('drag-over');
        handleFiles(event.dataTransfer.files);
    });

    // --- LÓGICA CORREGIDA: Mostrar/ocultar el campo de instrucción personalizada ---
    actionSelect.addEventListener('change', () => {
        if (actionSelect.value === 'custom') {
            customInstruction.style.display = 'block';
        } else {
            customInstruction.style.display = 'none';
        }
    });
    // Llamamos una vez al inicio para asegurar el estado correcto
    actionSelect.dispatchEvent(new Event('change'));


    // --- LÓGICA CORREGIDA Y MEJORADA: Procesamiento de imágenes ---
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
                    resultText = await puter.ai.img2txt(file);
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
                        // Detenemos el procesamiento solo de este archivo, no de todos.
                        continue;
                    }
                    // ¡MEJORA IMPORTANTE! Enviamos la instrucción y la imagen juntas.
                    const response = await puter.ai.chat({
                        messages: [
                            { role: 'user', content: instruction }, // La instrucción del usuario
                            { role: 'user', content: file }       // El archivo de imagen
                        ]
                    });
                    // ¡CORRECCIÓN CLAVE! Accedemos a la propiedad '.message.content'
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
                resultsHTML += `
                    <div class="result-item error">
                        <p>Error al procesar ${file.name}</p>
                        <p><small>${error.message}</small></p>
                    </div>`;
            }
        }
        resultsContainer.innerHTML = resultsHTML;
    });

    // --- Lógica para limpiar la interfaz ---
    clearBtn.addEventListener('click', () => {
        imageFiles = [];
        imageInput.value = '';
        resultsContainer.innerHTML = '';
        updateFileList(); // Actualizamos la lista de archivos para que muestre "ninguno".
    });

    // --- Lógica MEJORADA para copiar texto ---
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

    // --- Llamada inicial para establecer el estado de la UI ---
    updateFileList();
});