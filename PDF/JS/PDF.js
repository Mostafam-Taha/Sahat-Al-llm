document.addEventListener('DOMContentLoaded', () => {
    const grades = document.querySelectorAll('.grade');
    const selectSection = document.getElementById('selectSection');
    const matrileSection = document.getElementById('matrileSection');
    const materials = document.querySelectorAll('.matrile .container div');
    const downloadSections = document.querySelectorAll('.download');

    grades.forEach(grade => {
        grade.addEventListener('click', () => {
            selectSection.style.display = 'none';
            matrileSection.style.display = 'flex';
        });
    });

    materials.forEach(material => {
        material.addEventListener('click', () => {
            matrileSection.style.display = 'none';
            const materialClass = material.classList[0];
            downloadSections.forEach(section => {
                if (section.classList.contains(materialClass)) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
});

// شريط البحث
    function searchBooks() {
        const input = document.getElementById('searchInput').value.toLowerCase();
        const sections = document.querySelectorAll('.download');

        sections.forEach(section => {
            const title = section.querySelector('h2').textContent.toLowerCase();
            const description = section.querySelector('p').textContent.toLowerCase();
            if (title.includes(input) || description.includes(input)) {
                section.style.display = '';
            } else {
                section.style.display = 'none';
            }
        });
    }

    // يمكن أيضاً استخدام هذه الوظيفة أثناء الكتابة في مربع البحث
    function handleKeyUp(event) {
        searchBooks();
    }


function searchBooks() {
    var input, filter, sections, i, textValue;
    input = document.getElementById('searchInput');
    filter = input.value.toUpperCase();
    sections = document.querySelectorAll('.download .pdf-ra');
    
    sections.forEach(function(section) {
        textValue = section.textContent || section.innerText;
        section.style.display = textValue.toUpperCase().includes(filter) ? "" : "none";
    });
}