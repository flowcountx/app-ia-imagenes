document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const processBtn = document.getElementById('process-btn');
    const clearBtn = document.getElementById('clear-btn');
    const actionSelect = document.getElementById('action-select');
    const customInstruction = document.getElementById('custom-instruction');
    const resultsContainer = document.getElementById('results-container');
    const themeToggle = document.getElementById('theme-toggle');

    let imageFiles = [];

    // Cambiar entre modo oscuro y claro
    themeToggle.addEventListener('change', () => {
        document.documentElement.classList.toggle('light');
        document.documentElement.classList.toggle('dark');
    });

    // Guardar las imágenes seleccionadas
    imageInput.addEventListener('change', (event) => {
        imageFiles = Array.from(event.target.files);
        // Aquí podrías mostrar una vista previa de las imágenes
    });

    // Procesar las imágenes al hacer clic en el botón
    processBtn.addEventListener('click', async () => {
        if (imageFiles.length === 0) {
            alert('Por favor, selecciona al menos una imagen.');
            return;
        }

        resultsContainer.innerHTML = 'Procesando...';
        let resultsHTML = '';

        for (const file of imageFiles) {
            const action = actionSelect.value;
            let resultText = '';

            try {
                if (action === 'ocr') {
                    // 1. Reconocer texto
                    resultText = await puter.ai.img2txt(file);
                } else if (action === 'describe') {
                    // 2. Describir la imagen
                    const response = await puter.ai.chat({
                        messages: [
                            { role: 'user', content: 'Describe detalladamente lo que ves en esta imagen.' },
                            { role: 'user', content: file }
                        ]
                    });
                    resultText = response.message.content;
                } else if (action === 'custom') {
                    // 3. Instrucción personalizada
                    const instruction = customInstruction.value;
                    if (!instruction) {
                        alert('Por favor, escribe una instrucción.');
                        return;
                    }
                    const ocrText = await puter.ai.img2txt(file); // Extraemos el texto primero
                    const response = await puter.ai.chat(`Dada la siguiente imagen y su texto extraído: "${ocrText}". Realiza la siguiente instrucción: "${instruction}"`);
                    resultText = response;
                }

                // Crear el HTML para mostrar el resultado
                const imageURL = URL.createObjectURL(file);
                resultsHTML += `
                    <div class="result-item">
                        <img src="${imageURL}" alt="${file.name}">
                        <div class="text-content">
                            <textarea readonly>${resultText || 'No se encontró texto o no se pudo procesar.'}</textarea>
                            <button class="copy-btn">Copiar</button>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error procesando la imagen:', error);
                resultsHTML += `<p>Error al procesar ${file.name}</p>`;
            }
        }
        resultsContainer.innerHTML = resultsHTML;
    });

    // Limpiar todo
    clearBtn.addEventListener('click', () => {
        imageFiles = [];
        imageInput.value = '';
        resultsContainer.innerHTML = '';
    });

    // Funcionalidad para copiar texto
    resultsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('copy-btn')) {
            const textarea = event.target.previousElementSibling;
            textarea.select();
            document.execCommand('copy');
            alert('¡Texto copiado!');
        }
    });
});