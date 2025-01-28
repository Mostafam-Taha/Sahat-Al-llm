// وظيفة لتبديل الوضع بين الفاتح والداكن
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const darkButton = document.querySelector('.dark-light div:first-child');
    const lightButton = document.querySelector('.dark-light div:last-child');
    
    if (isDarkMode) {
        if (darkButton) darkButton.classList.add('active');
        if (lightButton) lightButton.classList.remove('active');
        localStorage.setItem('theme', 'dark'); // حفظ الوضع الداكن في localStorage
    } else {
        if (darkButton) darkButton.classList.remove('active');
        if (lightButton) lightButton.classList.add('active');
        localStorage.setItem('theme', 'light'); // حفظ الوضع الفاتح في localStorage
    }
}

// ضبط الوضع الافتراضي بناءً على التفضيل المحفوظ في localStorage
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const darkButton = document.querySelector('.dark-light div:first-child');
    const lightButton = document.querySelector('.dark-light div:last-child');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (darkButton) darkButton.classList.add('active');
    } else {
        if (lightButton) lightButton.classList.add('active');
    }
    
    // إضافة حدث للنقر على زر تبديل الوضع
    const themeToggle = document.querySelector('.dark-light');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});
