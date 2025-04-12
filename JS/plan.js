// العناصر الرئيسية
const planContainer = document.getElementById('plan-container');
const deleteButton = document.getElementById('delete-plan');
const progressBar = document.getElementById('progress-bar');
const progressPercentage = document.getElementById('progress-percentage');
const daysRemainingElement = document.getElementById('days-remaining');
const exportButton = document.getElementById('export-plan');
const importButton = document.getElementById('import-plan');
const importFile = document.getElementById('import-file');

// عناصر الإحصاءات
const completedCountElement = document.getElementById('completed-count');
const remainingCountElement = document.getElementById('remaining-count');
const dailyProgressElement = document.getElementById('daily-progress');

// عناصر بومودورو
const pomodoroTimer = document.getElementById('pomodoro-timer');
const startPomodoroButton = document.getElementById('start-pomodoro');
const shortBreakButton = document.getElementById('short-break');
const longBreakButton = document.getElementById('long-break');

// المتغيرات العامة
const today = new Date().toISOString().split('T')[0];
const checkSound = new Audio('../Sounds/livechat-129007.mp3'); // أو أي مسار آخر
let isSoundPlaying = false;
let totalLessons = 0;
let completedLessons = 0;
let pomodoroInterval;

// تحميل الخطة من localStorage
const plan = JSON.parse(localStorage.getItem('studyPlan')) || {
    name: 'خطتي الدراسية',
    days: [],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

// تهيئة التطبيق
function initApp() {
    processMissedDays();
    updateRemainingDays();
    renderPlan();
    setupEventListeners();
    requestNotificationPermission();
}

// معالجة الأيام الفائتة
function processMissedDays() {
    let missedLessons = [];
    
    plan.days = plan.days.filter(day => {
        if (day.date < today) {
            const hasUncompleted = day.lessons.some((_, index) => !getCheckedState(day.date, index));
            if (hasUncompleted) {
                missedLessons.push(...day.lessons.filter((_, index) => !getCheckedState(day.date, index)));
            }
            return !hasUncompleted;
        }
        return true;
    });

    if (missedLessons.length > 0) {
        const todayExists = plan.days.some(day => day.date === today);
        if (!todayExists) {
            plan.days.unshift({ 
                date: today, 
                lessons: missedLessons,
                isToday: true
            });
        } else {
            plan.days.find(day => day.date === today).lessons.push(...missedLessons);
        }
        savePlan();
    }
}

// عرض الخطة
function renderPlan() {
    totalLessons = 0;
    completedLessons = 0;
    
    planContainer.innerHTML = `<h1>${plan.name}</h1>`;
    
    if (plan.days.length === 0) {
        planContainer.innerHTML += '<p>لا توجد أيام مضافة بعد. ابدأ بإضافة بعض الدروس!</p>';
        updateProgress();
        return;
    }

    plan.days.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = `day-container ${day.date === today ? 'today' : ''}`;
        
        const dateHeader = document.createElement('h3');
        
        // استخدام دالة formatDate المحسنة
        const formattedDate = formatDate(day.date);
        dateHeader.textContent = formattedDate;

        if (day.date === today) {
            const todayBadge = document.createElement('span');
            todayBadge.className = 'today-badge';
            todayBadge.textContent = 'اليوم';
            dateHeader.appendChild(todayBadge);
        }
        
        dayDiv.appendChild(dateHeader);
        
        day.lessons.forEach((lesson, index) => {
            const isChecked = getCheckedState(day.date, index);
            const priority = getLessonPriority(lesson);
            
            const lessonLabel = document.createElement('label');
            lessonLabel.className = `lesson-item priority-${priority} ${isChecked ? 'checked' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isChecked;
            checkbox.dataset.day = day.date;
            checkbox.dataset.index = index;
            
            const lessonText = document.createTextNode(cleanLessonText(lesson));
            
            lessonLabel.appendChild(checkbox);
            lessonLabel.appendChild(lessonText);
            
            lessonLabel.addEventListener('change', handleLessonCheck);
            
            dayDiv.appendChild(lessonLabel);
            dayDiv.appendChild(document.createElement('br'));
            
            totalLessons++;
            if (isChecked) completedLessons++;
        });
        
        planContainer.appendChild(dayDiv);
    });
    
    updateProgress();
}

// إدارة أحداث التطبيق
function setupEventListeners() {
    deleteButton.addEventListener('click', handleDeletePlan);
    exportButton.addEventListener('click', handleExportPlan);
    // importButton.addEventListener('click', () => importFile.click());
    // importFile.addEventListener('change', handleImportPlan);
    
    // أحداث بومودورو
    startPomodoroButton.addEventListener('click', () => startTimer(25, false));
    shortBreakButton.addEventListener('click', () => startTimer(5, true));
    longBreakButton.addEventListener('click', () => startTimer(15, true));
}

// دالة تحديث التقدم
function updateProgress() {
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const roundedProgress = Math.round(progress);
    
    progressBar.style.width = `${progress}%`;
    progressPercentage.textContent = `${roundedProgress}%`;
    
    // تغيير لون الشريط حسب النسبة
    if (roundedProgress < 33) {
        progressBar.style.backgroundColor = '#e53935';
    } else if (roundedProgress < 66) {
        progressBar.style.backgroundColor = '#fb8c00';
    } else {
        progressBar.style.backgroundColor = '#43a047';
    }
    
    updateStats();
}

// تحديث الإحصائيات
function updateStats() {
    completedCountElement.textContent = completedLessons;
    remainingCountElement.textContent = totalLessons - completedLessons;
    
    const todayLessons = plan.days.find(day => day.date === today)?.lessons.length || 0;
    const todayCompleted = plan.days.find(day => day.date === today)?.lessons.filter((_, i) => 
        getCheckedState(today, i)).length || 0;
    const dailyProgress = todayLessons > 0 ? Math.round((todayCompleted / todayLessons) * 100) : 0;
    
    dailyProgressElement.textContent = `${dailyProgress}%`;
}

// مؤقت بومودورو
function startTimer(durationMin, isBreak) {
    clearInterval(pomodoroInterval);
    
    let minutes = durationMin - 1;
    let seconds = 59;
    
    updatePomodoroDisplay(minutes, seconds);
    
    pomodoroInterval = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(pomodoroInterval);
                playSound();
                
                if (!isBreak) {
                    showNotification('حان وقت الاستراحة!', 'خذ استراحة قصيرة لتعود بنشاط');
                } else {
                    showNotification('انتهت الاستراحة!', 'حان وقت العودة للدراسة');
                }
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        
        updatePomodoroDisplay(minutes, seconds);
    }, 1000);
}

function updatePomodoroDisplay(minutes, seconds) {
    pomodoroTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// إدارة حالة الدروس
function handleLessonCheck(e) {
    const checkbox = e.target;
    const day = checkbox.dataset.day;
    const index = parseInt(checkbox.dataset.index);
    const isChecked = checkbox.checked;
    
    saveCheckedState(day, index, isChecked);
    
    if (isChecked) {
        playSound();
        completedLessons++;
    } else {
        completedLessons--;
    }
    
    checkbox.parentElement.classList.toggle('checked', isChecked);
    updateProgress();
}

// حذف الخطة
function handleDeletePlan() {
    if (confirm('هل أنت متأكد من حذف الخطة؟ سيتم حذف جميع البيانات بشكل دائم.')) {
        localStorage.removeItem('studyPlan');
        localStorage.removeItem('studyPlanStatus');
        plan.days = [];
        renderPlan();
        progressBar.style.width = '0%';
        progressPercentage.textContent = '0%';
        daysRemainingElement.textContent = '';
    }
}

// تصدير الخطة
function handleExportPlan() {
    const data = {
        plan: JSON.parse(localStorage.getItem('studyPlan')),
        status: JSON.parse(localStorage.getItem('studyPlanStatus')) || {}
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-plan-${today}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// استيراد الخطة
function handleImportPlan(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (confirm('هل تريد استبدال البيانات الحالية بالبيانات المستوردة؟')) {
                localStorage.setItem('studyPlan', JSON.stringify(data.plan));
                localStorage.setItem('studyPlanStatus', JSON.stringify(data.status));
                location.reload();
            }
        } catch (error) {
            alert('خطأ في قراءة الملف. يرجى التأكد من صحة الملف.');
            console.error('Error importing plan:', error);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // إعادة تعيين قيمة الإدخال
}

// الأيام المتبقية
function updateRemainingDays() {
    if (!plan.endDate) {
        daysRemainingElement.textContent = 'لا يوجد تاريخ انتهاء';
        return;
    }
    
    try {
        const endDate = new Date(plan.endDate);
        if (isNaN(endDate.getTime())) {
            throw new Error('Invalid endDate');
        }
        
        const currentDate = new Date();
        const timeDiff = endDate.getTime() - currentDate.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        daysRemainingElement.textContent = daysRemaining > 0 
            ? `الأيام المتبقية: ${daysRemaining}` 
            : "انتهت مدة الخطة";
    } catch (error) {
        console.error('Error calculating remaining days:', error);
        daysRemainingElement.textContent = 'تاريخ انتهاء غير صالح';
    }
}

// وظائف مساعدة
function getCheckedState(day, index) {
    const savedPlan = JSON.parse(localStorage.getItem('studyPlanStatus')) || {};
    return savedPlan[`${day}-${index}`] || false;
}

function saveCheckedState(day, index, checked) {
    const savedPlan = JSON.parse(localStorage.getItem('studyPlanStatus')) || {};
    savedPlan[`${day}-${index}`] = checked;
    localStorage.setItem('studyPlanStatus', JSON.stringify(savedPlan));
}

function savePlan() {
    localStorage.setItem('studyPlan', JSON.stringify(plan));
}

function playSound() {
    if (!isSoundPlaying) {
        isSoundPlaying = true;
        checkSound.play().catch(e => console.error('Error playing sound:', e));
        checkSound.onended = () => isSoundPlaying = false;
    }
}

function formatDate(dateString) {
    // إذا كانت القيمة غير موجودة أو فارغة
    if (!dateString) return 'بدون تاريخ';
    
    try {
        // إذا كان التاريخ بصيغة YYYY-MM-DD (ISO)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const date = new Date(dateString + 'T00:00:00'); // إضافة وقت لضمان عدم وجود مشاكل في المناطق الزمنية
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                });
            }
        }
        
        // محاولة تحليل التاريخ بأي صيغة
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }
        
        // إذا فشل كل شيء، نعيد التاريخ الأصلي
        return dateString;
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString; // العودة للتاريخ الأصلي إذا فشل التنسيق
    }
}

function getLessonPriority(lesson) {
    if (lesson.includes('(عالي)')) return 'high';
    if (lesson.includes('(متوسط)')) return 'medium';
    return 'low';
}

function cleanLessonText(lesson) {
    return lesson.replace('(عالي)', '').replace('(متوسط)', '').trim();
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', initApp);











// العناصر
const restoreBtn = document.getElementById('restore-btn');
const modal = document.getElementById('restore-modal');
const closeModal = document.querySelector('.close-modal');
const dropZone = document.getElementById('drop-zone');
const browseBtn = document.getElementById('browse-files');
const restoreFile = document.getElementById('restore-file');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const confirmBtn = document.getElementById('confirm-restore');

let selectedFile = null;

// فتح النافذة المنبثقة
restoreBtn.addEventListener('click', () => {
    modal.style.display = 'block';
});

// إغلاق النافذة المنبثقة
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    resetFileSelection();
});

// إغلاق عند النقر خارج النافذة
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        resetFileSelection();
    }
});

// تصفح الملفات
browseBtn.addEventListener('click', () => {
    restoreFile.click();
});

// اختيار الملف
restoreFile.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFileSelection(e.target.files[0]);
    }
});

// Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropZone.classList.add('active');
}

function unhighlight() {
    dropZone.classList.remove('active');
}

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    
    if (file && file.name.endsWith('.json')) {
        handleFileSelection(file);
    } else {
        alert('الرجاء اختيار ملف بصيغة JSON فقط');
    }
});

// معالجة الملف المحدد
function handleFileSelection(file) {
    selectedFile = file;
    fileName.textContent = file.name;
    dropZone.style.display = 'none';
    fileInfo.style.display = 'block';
}

// تأكيد الاسترداد
confirmBtn.addEventListener('click', () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.plan && data.status) {
                localStorage.setItem('studyPlan', JSON.stringify(data.plan));
                localStorage.setItem('studyPlanStatus', JSON.stringify(data.status));
                alert('تم استعادة البيانات بنجاح!');
                location.reload();
            } else {
                throw new Error('الملف لا يحتوي على بيانات صالحة');
            }
        } catch (error) {
            alert('خطأ في استعادة البيانات: ' + error.message);
            console.error(error);
            resetFileSelection();
        }
    };
    
    reader.readAsText(selectedFile);
});

// إعادة تعيين اختيار الملف
function resetFileSelection() {
    selectedFile = null;
    dropZone.style.display = 'block';
    fileInfo.style.display = 'none';
    restoreFile.value = '';
}


function validatePlanDates() {
    if (!plan.days) return;
    
    plan.days.forEach(day => {
        if (!isValidDate(day.date)) {
            console.warn(`Invalid date found: ${day.date}`);
            // يمكنك هنا إما تصحيح التاريخ أو حذف اليوم إذا لزم الأمر
        }
    });
    
    if (plan.endDate && !isValidDate(plan.endDate)) {
        console.warn(`Invalid endDate: ${plan.endDate}`);
    }
}

function isValidDate(dateString) {
    if (!dateString) return false;
    return !isNaN(new Date(dateString).getTime());
}

// استدعاء الدالة في initApp
function initApp() {
    validatePlanDates(); // <-- أضف هذا السطر
    processMissedDays();
    updateRemainingDays();
    renderPlan();
    setupEventListeners();
    requestNotificationPermission();
}

function fixInvalidDates() {
    if (!plan.days) return;
    
    plan.days.forEach(day => {
        if (!isValidDate(day.date)) {
            // محاولة تصحيح التاريخ أو تعيين تاريخ افتراضي
            day.date = new Date().toISOString().split('T')[0];
        }
    });
    
    if (plan.endDate && !isValidDate(plan.endDate)) {
        plan.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    savePlan();
}  













// ... الكود الحالي الذي لديك ...

// ==================== نظام تصدير PDF ====================
document.getElementById('export-pdf').addEventListener('click', exportAsPDF);

function exportAsPDF() {
    const element = document.getElementById('plan-container');
    const opt = {
        margin: 10,
        filename: `خطة_الدراسة_${new Date().toLocaleDateString('ar-EG')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            logging: true,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            putOnlyUsedFonts: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // إضافة مؤشر تحميل
    const loading = document.createElement('div');
    loading.style.position = 'fixed';
    loading.style.top = '0';
    loading.style.left = '0';
    loading.style.width = '100%';
    loading.style.height = '100%';
    loading.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loading.style.display = 'flex';
    loading.style.justifyContent = 'center';
    loading.style.alignItems = 'center';
    loading.style.zIndex = '9999';
    loading.innerHTML = '<div style="color:white; font-size:24px;">جاري تحضير PDF... <i class="fas fa-spinner fa-spin"></i></div>';
    document.body.appendChild(loading);

    // تأخير عملية التصدير لضمان تحميل كل العناصر
    setTimeout(() => {
        html2pdf().from(element).set(opt).save().then(() => {
            document.body.removeChild(loading);
        });
    }, 1000);
}

// ==================== نظام التقويم المرئي ====================
document.getElementById('toggle-calendar').addEventListener('click', toggleCalendarView);

let calendar;
let isCalendarView = false;

function toggleCalendarView() {
    isCalendarView = !isCalendarView;
    
    if (isCalendarView) {
        document.getElementById('plan-container').style.display = 'none';
        document.getElementById('calendar-container').style.display = 'block';
        initCalendar();
    } else {
        document.getElementById('plan-container').style.display = 'block';
        document.getElementById('calendar-container').style.display = 'none';
    }
}

function initCalendar() {
    const calendarEl = document.getElementById('calendar-container');
    
    if (calendar) {
        calendar.destroy();
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'ar',
        direction: 'rtl',
        initialView: 'dayGridMonth',
        headerToolbar: {
            right: 'today prev,next',
            center: 'title',
            left: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: generateCalendarEvents(),
        eventContent: renderEventContent,
        eventClick: handleEventClick,
        datesSet: updateCalendarTitle
    });
    
    calendar.render();
}

function generateCalendarEvents() {
    const events = [];
    
    plan.days.forEach(day => {
        const completed = day.lessons.filter((_, index) => getCheckedState(day.date, index)).length;
        const total = day.lessons.length;
        
        if (total > 0) {
            events.push({
                title: `الدروس: ${completed}/${total}`,
                start: day.date,
                allDay: true,
                backgroundColor: getProgressColor(completed/total),
                extendedProps: {
                    lessons: day.lessons,
                    date: day.date
                }
            });
        }
    });
    
    return events;
}

function renderEventContent(eventInfo) {
    const percentage = Math.round((eventInfo.event.extendedProps.lessons).filter((_, i) => 
        getCheckedState(eventInfo.event.startStr, i)).length / 
        eventInfo.event.extendedProps.lessons.length * 100);
    
    const element = document.createElement('div');
    element.className = 'fc-event-content';
    element.innerHTML = `
        <div class="fc-event-title">${eventInfo.event.title}</div>
        <div class="fc-event-progress" style="width:${percentage}%"></div>
    `;
    
    return { domNodes: [element] };
}

function handleEventClick(info) {
    const date = info.event.startStr;
    const day = plan.days.find(d => d.date === date);
    
    if (day) {
        // عرض تفاصيل اليوم في نافذة منبثقة
        const modal = document.createElement('div');
        modal.className = 'calendar-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h3>${formatDate(date)}</h3>
                <div class="day-lessons">
                    ${day.lessons.map((lesson, index) => `
                        <label class="lesson-item ${getCheckedState(date, index) ? 'checked' : ''}">
                            <input type="checkbox" 
                                   ${getCheckedState(date, index) ? 'checked' : ''}
                                   data-day="${date}" 
                                   data-index="${index}"
                                   onchange="handleCalendarLessonCheck(event)">
                            ${cleanLessonText(lesson)}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

function handleCalendarLessonCheck(e) {
    handleLessonCheck(e); // استدعاء الدالة الأصلية
    calendar.refetchEvents(); // تحديث التقويم بعد التغيير
}

function getProgressColor(percentage) {
    if (percentage < 0.33) return '#e53935';
    if (percentage < 0.66) return '#fb8c00';
    return '#43a047';
}

function updateCalendarTitle() {
    const title = document.querySelector('.fc-toolbar-title');
    if (title) {
        title.innerHTML = title.innerHTML.replace(/،/g, ' - ');
    }
}

// ... بقية الكود الحالي ...



















// العناصر الجديدة
const crazyModeBtn = document.getElementById('crazy-mode-btn');
const crazyModeModal = document.getElementById('crazy-mode-modal');
const daysSlider = document.getElementById('days-slider');
const daysCount = document.getElementById('days-count');
const confirmCrazyMode = document.getElementById('confirm-crazy-mode');

// أحداث جديدة
crazyModeBtn.addEventListener('click', () => {
    crazyModeModal.style.display = 'block';
    createFallingPaws();
});

// تحديث عدد الأيام عند تحريك السلايدر
daysSlider.addEventListener('input', () => {
    daysCount.textContent = daysSlider.value;
});

// تأكيد تقسيم المنهج
confirmCrazyMode.addEventListener('click', () => {
    const days = parseInt(daysSlider.value);
    distributeLessons(days);
    crazyModeModal.style.display = 'none';
    stopFallingPaws();
    showSuccessMessage();
});

// دالة لتوزيع الدروس على الأيام
function distributeLessons(daysCount) {
    // جمع جميع الدروس غير المكتملة
    let allLessons = [];
    
    plan.days.forEach(day => {
        day.lessons.forEach((lesson, index) => {
            if (!getCheckedState(day.date, index)) {
                allLessons.push(lesson);
            }
        });
    });
    
    // إذا لم يكن هناك دروس، لا تفعل شيئاً
    if (allLessons.length === 0) {
        alert('مفيش دروس متبقية يا معلم! كل الدروس خلصت!');
        return;
    }
    
    // خلط الدروس عشوائياً
    allLessons = shuffleArray(allLessons);
    
    // إنشاء أيام جديدة
    const newDays = [];
    const startDate = new Date();
    
    for (let i = 0; i < daysCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // حساب عدد الدروس لهذا اليوم (توزيع متساوٍ تقريباً)
        const startIdx = Math.floor(i * allLessons.length / daysCount);
        const endIdx = Math.floor((i + 1) * allLessons.length / daysCount);
        const dayLessons = allLessons.slice(startIdx, endIdx);
        
        newDays.push({
            date: dateStr,
            lessons: dayLessons,
            isToday: dateStr === today
        });
    }
    
    // حذف الأيام القديمة (التي تحتوي على دروس غير مكتملة)
    plan.days = plan.days.filter(day => 
        day.lessons.every((_, index) => getCheckedState(day.date, index))
    );
    
    // إضافة الأيام الجديدة
    plan.days = [...plan.days, ...newDays].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // تحديث تاريخ الانتهاء
    const lastDay = newDays[newDays.length - 1].date;
    plan.endDate = lastDay;
    
    // حفظ الخطة وإعادة التحميل
    savePlan();
    renderPlan();
    updateRemainingDays();
}

// دالة لخلط المصفوفة عشوائياً
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// تأثيرات المرح - آثار كفوف الكلاب
let pawInterval;

function createFallingPaws() {
    pawInterval = setInterval(() => {
        const paw = document.createElement('div');
        paw.className = 'dog-paw';
        
        // وضع عشوائي
        const left = Math.random() * 100;
        const size = Math.random() * 20 + 10;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        paw.style.left = `${left}%`;
        paw.style.top = '-30px';
        paw.style.width = `${size}px`;
        paw.style.height = `${size}px`;
        paw.style.animation = `fall ${duration}s linear ${delay}s forwards`;
        
        document.body.appendChild(paw);
        
        // إزالة العنصر بعد الانتهاء
        setTimeout(() => {
            paw.remove();
        }, (duration + delay) * 1000);
        
    }, 300);
}

function stopFallingPaws() {
    clearInterval(pawInterval);
}

// رسالة نجاح ممتعة
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
        <i class="fas fa-dog"></i>
        <span>تم تقسيم المنهج بنجاح! كلابك زنقت!</span>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => message.remove(), 500);
    }, 3000);
}

// أضف هذا النمط للرسالة
/*
.success-message {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff9f43;
    color: white;
    padding: 15px 25px;
    border-radius: 50px;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    opacity: 0;
    transition: opacity 0.5s;
    z-index: 1000;
}

.success-message.show {
    opacity: 1;
}

.success-message i {
    margin-right: 10px;
    animation: bounce 0.5s infinite alternate;
}

@keyframes bounce {
    to { transform: translateY(-5px); }
}

@keyframes fall {
    to { transform: translateY(calc(100vh + 30px)) rotate(360deg); }
}
*/