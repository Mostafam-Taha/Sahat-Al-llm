// العناصر
const toggleUser = document.getElementById('toggle-user');
const userBox = document.getElementById('user-box');
const overlay = document.getElementById('overlay');

// وظيفة فتح العنصر
toggleUser.addEventListener('click', () => {
    userBox.classList.add('show');
    overlay.classList.add('active');
});

// وظيفة إغلاق العنصر عند الضغط خارجًا
overlay.addEventListener('click', () => {
    userBox.classList.remove('show');
    overlay.classList.remove('active');
});

// عندما يتم تحميل الصفحة بالكامل
window.addEventListener("load", function () {
    // إخفاء شاشة التحميل بعد ثانية واحدة
    setTimeout(() => {
      // إخفاء شاشة التحميل
      const loadingScreen = document.getElementById("loading-screen");
      loadingScreen.style.display = "none";
  
      // عرض المحتوى
      const content = document.getElementById("content");
    //   content.style.display = "block";
    }, 1); // تأخير لمدة ثانية واحدة (1000 مللي ثانية)
});

document.addEventListener("DOMContentLoaded", function () {
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    // عرض البيانات
    if (userName && userEmail) {
        document.getElementById("user-name").textContent = userName;
        document.getElementById("user-email").textContent = userEmail;
    } else {
        alert("لم يتم تسجيل الدخول. الرجاء العودة وتسجيل الدخول.");
        window.location.href = "../login.html"; // إعادة التوجيه إذا لم توجد بيانات
    }
});