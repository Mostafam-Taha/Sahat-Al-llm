// استخدام API للحصول على عنوان الـ IP
fetch('https://api.ipify.org?format=json')
  .then(response => response.json())
  .then(data => {
    // إدخال عنوان الـ IP في الحقل المخفي
    document.getElementById('ip_address').value = data.ip;
  })
  .catch(error => {
    console.error('Error fetching IP address:', error);
  });

function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  if (userAgent.indexOf("Win") !== -1) os = "Windows";
  else if (userAgent.indexOf("Mac") !== -1) os = "MacOS";
  else if (userAgent.indexOf("Linux") !== -1) os = "Linux";
  else if (userAgent.indexOf("Android") !== -1) os = "Android";
  else if (userAgent.indexOf("like Mac") !== -1) os = "iOS";

  if (userAgent.indexOf("Firefox") !== -1) browser = "Mozilla Firefox";
  else if (userAgent.indexOf("Chrome") !== -1) browser = "Google Chrome";
  else if (userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) browser = "Safari";
  else if (userAgent.indexOf("Edge") !== -1) browser = "Microsoft Edge";
  else if (userAgent.indexOf("Opera") !== -1 || userAgent.indexOf("OPR") !== -1) browser = "Opera";

  const deviceName = navigator.platform || "Unknown Device";
  const language = navigator.language || "Unknown Language";
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  const deviceMemory = navigator.deviceMemory || "Unknown Memory";
  const hardwareConcurrency = navigator.hardwareConcurrency || "Unknown CPU Cores";

  document.getElementById("device_name").value = deviceName;
  document.getElementById("os").value = os;
  document.getElementById("browser").value = browser;
  document.getElementById("language").value = language;
  document.getElementById("screen_width").value = screenWidth;
  document.getElementById("screen_height").value = screenHeight;
  document.getElementById("device_memory").value = deviceMemory;
  document.getElementById("hardware_concurrency").value = hardwareConcurrency;
}

// استدعاء الدالة عند تحميل الصفحة
getDeviceInfo();

if ('getBattery' in navigator) {
  navigator.getBattery().then(function(battery) {
    // تعبئة الحقول المخفية
    document.getElementById("battery_level").value = battery.level * 100;  // نسبة البطارية
    document.getElementById("charging_status").value = battery.charging; // حالة الشحن
  });
}


function saveUserData(event) {
    event.preventDefault(); // منع الإرسال الافتراضي للنموذج
    const firstName = document.getElementById("first-name").value;
    const email = document.getElementById("email").value;
    
    // حفظ البيانات في Local Storage
    localStorage.setItem("userName", firstName);
    localStorage.setItem("userEmail", email);
    
    // الانتقال إلى صفحة index.html
    window.location.href = "index.html";
}   
