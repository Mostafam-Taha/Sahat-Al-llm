const planContainer = document.getElementById('plan-container');
const deleteButton = document.getElementById('delete-plan');
const progressBar = document.getElementById('progress-bar');

const plan = JSON.parse(localStorage.getItem('studyPlan'));
    const today = new Date().toISOString().split('T')[0];  // الحصول على التاريخ اليومي (YYYY-MM-DD)
    const checkSound = new Audio('../sounds/livechat-129007.mp3');  // مسار الصوت المحلي
    let isSoundPlaying = false;  // متغير لتتبع حالة الصوت

if (plan) {
    planContainer.innerHTML = `<h1>${plan.name}</h1>`;
    let totalLessons = 0;
    let completedLessons = 0;

    plan.days.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.innerHTML = `<h3 class="${day.date === today ? 'today' : ''}">${day.date}</h3>`;

        day.lessons.forEach((lesson, index) => {
            const checkboxLabel = document.createElement('label');
            checkboxLabel.innerHTML = `
                <input type="checkbox" name="lesson" data-day="${day.date}" data-index="${index}" ${getCheckedState(day.date, index) ? 'checked' : ''}> ${lesson}
            `;
            dayDiv.appendChild(checkboxLabel);
            dayDiv.appendChild(document.createElement('br'));

            // زيادة العداد الإجمالي
            totalLessons++;
            if (getCheckedState(day.date, index)) {
                completedLessons++;
            }

            // إضافة حدث لتحديث حالة المربع عند التغيير
                checkboxLabel.querySelector('input').addEventListener('change', function() {
                saveCheckedState(day.date, index, this.checked);
                updateProgress();
                if (this.checked) {
                    checkboxLabel.classList.add('checked');
                        playSound();  // تشغيل الصوت عند تفعيل علامة الصح
                } else {
                    checkboxLabel.classList.remove('checked');
                }
            });
        });

        planContainer.appendChild(dayDiv);
    });

    updateProgress();

    function getCheckedState(day, index) {
        const savedPlan = JSON.parse(localStorage.getItem('studyPlanStatus')) || {};
        return savedPlan[`${day}-${index}`] || false;
    }

    function saveCheckedState(day, index, checked) {
        const savedPlan = JSON.parse(localStorage.getItem('studyPlanStatus')) || {};
        savedPlan[`${day}-${index}`] = checked;
        localStorage.setItem('studyPlanStatus', JSON.stringify(savedPlan));
    }

    function updateProgress() {
        const progress = (completedLessons / totalLessons) * 100;
        progressBar.style.width = progress + '%';
    }

    function playSound() {
        if (!isSoundPlaying) {
            isSoundPlaying = true;
            checkSound.play();
            checkSound.onended = () => {
                isSoundPlaying = false;
            };
        }
    }
} else {
    planContainer.innerHTML = '<p>لا توجد خطة محفوظة.</p>';
}

deleteButton.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من حذف الخطة؟')) {
        localStorage.removeItem('studyPlan');
        localStorage.removeItem('studyPlanStatus');
        alert('تم حذف الخطة.');
        planContainer.innerHTML = '<p>لا توجد خطة محفوظة.</p>';
        progressBar.style.width = '0%';
    }
});
