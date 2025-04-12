const features = [
    'شريط تنقل متحرك',
    'معرض صور متحرك',
    'نموذج اتصل بنا',
    'محرر نصوص',
    'مخطط إحصائي',
    'قائمة منسدلة',
    'شرائح صور',
    'مؤقت عد تنازلي',
    'مربع بحث',
    'روابط اجتماعية'
];

function initializeFeatures() {
    const container = document.getElementById('featuresContainer');
    features.forEach((feature, index) => {
        const div = document.createElement('div');
        div.className = 'feature-item';
        div.innerHTML = `
            <input type="checkbox" id="feature${index}" class="feature-checkbox">
            <label for="feature${index}">${feature}</label>
        `;
        container.appendChild(div);
    });
}

function addSection() {
    const sectionName = prompt('أدخل اسم القسم الجديد:');
    if (sectionName) {
        alert(`تم إضافة قسم: ${sectionName}`);
        // يمكنك إضافة المنطق الخاص بإضافة الأقسام هنا
    }
}

function generateSite() {
    const siteName = document.getElementById('siteName').value || 'موقعي';
    const bgColor = document.getElementById('bgColor').value;
    const textColor = document.getElementById('textColor').value;
    const customCode = document.getElementById('customCode').value;

    // إنشاء محتوى HTML للموقع النهائي
    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${siteName}</title>
    <style>
        body {
            background: ${bgColor};
            color: ${textColor};
            font-family: Arial, sans-serif;
        }
        ${generateFeatureStyles()}
    </style>
</head>
<body>
    <h1>مرحبا بكم في ${siteName}</h1>
    ${generateFeatureHTML()}
    ${customCode}
    <script>
        ${generateFeatureJS()}
    <\/script>
</body>
</html>
    `;

    // إنشاء ملف ZIP
    const zip = new JSZip();
    zip.file("index.html", htmlContent);
    zip.file("style.css", "");
    zip.file("script.js", "");

    zip.generateAsync({type:"blob"})
    .then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${siteName}.zip`;
        link.click();
    });
}

function generateFeatureHTML() {
    // إضافة منطق توليد HTML للمميزات المختارة
    return Array.from(document.querySelectorAll('.feature-checkbox:checked'))
        .map(checkbox => {
            const featureText = checkbox.nextElementSibling.textContent;
            return `<section class="feature-section">
                        <h2>${featureText}</h2>
                        <!-- محتوى الميزة هنا -->
                    </section>`;
        }).join('');
}

function generateFeatureStyles() {
    // إضافة أنماط CSS للمميزات المختارة
    return `
    .feature-section {
        padding: 20px;
        margin: 15px 0;
        border: 1px solid #ddd;
        border-radius: 8px;
    }
    `;
}

function generateFeatureJS() {
    // إضافة JavaScript للمميزات المختارة
    return `
    // كود جافاسكريبت للمميزات هنا
    `;
}

// تهيئة المميزات عند التحميل
window.onload = initializeFeatures;