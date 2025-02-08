function translatePage(targetLang) {
    const elements = document.querySelectorAll('*:not(script):not(style)');  
    const texts = [];

    elements.forEach(el => {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && el.textContent.trim() !== '') {
            texts.push(el.textContent.trim());
        }
    });

    if (texts.length === 0) return;

    // Google Translate Free Web Service (Scraping Method)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(texts.join('||'))}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const translatedTexts = data[0].map(item => item[0]);
            let index = 0;

            elements.forEach(el => {
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && el.textContent.trim() !== '') {
                    el.textContent = translatedTexts[index];
                    index++;
                }
            });
        })
        .catch(error => console.error('Translation Error:', error));
}

// Auto-translate page to Spanish (Change 'es' to the desired language)
document.addEventListener('DOMContentLoaded', () => {
    translatePage('es');
});
