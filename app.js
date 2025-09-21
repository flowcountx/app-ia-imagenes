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

    // --- Lógica para el cambio de tema (oscuro/claro) ---
    themeToggle.addEventListener('change', () => {
        document.documentElement.classList.toggle('light');
        document.documentElement.classList.toggle('dark');
    });

    // --- Función para actualizar la lista visual de archivos cargados ---
    const updateFileList = () => {
        fileList.innerHTML = ''; // Limpiamos la lista para no duplicar nombres
        if (imageFiles.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Ninguna imagen seleccionada.';
            fileList.appendChild(li);
        } else {
            imageFiles.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file.name; // Mostramos el nombre de cada archivo
                fileList.appendChild(li);
            });
        }
    };

    // --- Función centralizada para manejar los archivos (ya sea por clic o arrastre) ---
    const handleFiles = (files) => {
        imageFiles = Array.from(files);
        updateFileList();
    };

    // --- Event listener para el botón de selección de archivos ---
    imageInput.addEventListener('change', (event) => handleFiles(event.target.files));

    // --- Lógica completa para Arrastrar y Soltar (Drag and Drop) ---
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault(); // Previene el comportamiento por defecto del navegador
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(event.dataTransfer.files); // Usamos los archivos del evento 'drop'
    });

    // --- Lógica para mostrar/ocultar el campo de instrucción personalizada ---
    actionSelect.addEventListener('change', () => {
        customInstruction.style.display = (actionSelect.value === 'custom') ? 'block' : 'none';
    });
    // Se ejecuta una vez al cargar la página para asegurar el estado inicial correcto
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
                        continue; // Salta a la siguiente imagen si no hay instrucción
                    }
                    const response = await puter.ai.chat({
                        messages: [
                            { role: 'user', content: instruction },
                            { role: 'user', content: file }
                        ]
                    });
                    resultText = response.message.content;
                }

                // Genera el HTML para un resultado exitoso
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
                
                // --- MANEJO DE ERRORES AVANZADO Y CORREGIDO ---
                let errorMessage = "Ocurrió un error desconocido.";

                if (error && error.error && typeof error.error.message === 'string') {
                    // Captura el error específico de la API de Puter: {success: false, error: {message: "..."}}
                    errorMessage = error.error.message;
                } else if (error && typeof error.message === 'string') {
                    // Captura un error estándar de JavaScript
                    errorMessage = error.message;
                } else {
                    // Si el error es un objeto pero no tiene el formato esperado, lo muestra como texto
                    errorMessage = JSON.stringify(error);
                }

                // Genera el HTML para un resultado con error
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
        imageInput.value = ''; // Resetea el input de archivo
        resultsContainer.innerHTML = '';
        updateFileList(); // Actualiza la lista para mostrar que está vacía
    });

    // --- Lógica para el botón de Copiar Texto ---
    resultsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('copy-btn')) {
            const textToCopy = event.target.dataset.text;
            navigator.clipboard.writeText(textToCopy).then(() => {
                event.target.textContent = '¡Copiado!'; // Feedback visual
                setTimeout(() => {
                    event.target.textContent = 'Copiar'; // Vuelve al estado original
                }, 2000);
            }).catch(err => console.error('Error al copiar:', err));
        }
    });

    // --- Llamada inicial para establecer el estado de la UI al cargar ---
    updateFileList();
});