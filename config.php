<?php
$host = 'localhost';
$dbname = 'sahat_alllm';
$username = 'root';
$password = '';

// إعدادات المنطقة الزمنية (إضافة جديدة)
date_default_timezone_set('Africa/Cairo'); // تغييرها حسب منطقتك الزمنية

try {
    // إنشاء اتصال PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // تعيين سمات PDO
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // إضافة مهمة للأمان
    
    // إعداد وقت MySQL (إضافة جديدة)
    $pdo->exec("SET time_zone = '+03:00';"); // تغييرها حسب فارق التوقيت لديك
    
} catch (PDOException $e) {
    // تسجيل الخطأ بدلاً من عرضه للمستخدم (أكثر أماناً)
    error_log("Database connection failed: " . $e->getMessage());
    die("حدث خطأ في الاتصال بقاعدة البيانات. الرجاء المحاولة لاحقاً.");
}

/**
 * تنظيف المدخلات
 * @param string $data البيانات المراد تنظيفها
 * @return string البيانات النظيفة
 */
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * دالة مساعدة جديدة لتنفيذ الاستعلامات المعدة مسبقاً
 * @param PDO $pdo كائن PDO
 * @param string $sql استعلام SQL
 * @param array $params معاملات الاستعلام
 * @return PDOStatement
 */
function executeQuery($pdo, $sql, $params = []) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

// دالة للتحقق من حالة الحظر
function checkIfBanned($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT is_banned FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    return ($user && $user['is_banned'] == 1);
}
?>