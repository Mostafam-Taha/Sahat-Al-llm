document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('results');
    const scoreLogContainer = document.getElementById('scoreLog');
    const progressChart = document.getElementById('progressChart');
    const activityStatsChart = document.getElementById('activityStatsChart');
    const monthlyChart = document.getElementById('monthlyChart');
    const comparisonChart = document.getElementById('comparisonChart');
    const emailPrompt = document.getElementById('emailPrompt');
    const emailInput = document.getElementById('email');
    const saveDataButton = document.getElementById('saveData');
    const logoutButton = document.getElementById('logout-button');
    const sharesValue = document.getElementById('sharesValue');
    const percentageChange = document.getElementById('percentageChange');
    const testsBarChart = document.getElementById('testsBarChart');

    if (!resultsContainer || !scoreLogContainer || !progressChart || !activityStatsChart || !emailPrompt || !emailInput || !saveDataButton || !logoutButton || !sharesValue || !percentageChange || !testsBarChart || !monthlyChart || !comparisonChart) {
        console.error('One or more required elements are missing in the DOM.');
        return;
    }

    const progressChartCtx = progressChart.getContext('2d');
    const activityStatsChartCtx = activityStatsChart.getContext('2d');
    const testsBarChartCtx = testsBarChart.getContext('2d');
    const monthlyChartCtx = monthlyChart.getContext('2d');
    const comparisonChartCtx = comparisonChart.getContext('2d');

    const studentProgressData = JSON.parse(localStorage.getItem('studentProgress')) || {};
    const email = localStorage.getItem('email');
    const percentage = parseInt(localStorage.getItem('studentPercentage')) || 0;

    if (email) {
        emailPrompt.classList.add('hidden');
    } else {
        emailPrompt.classList.remove('hidden');
        setTimeout(() => {
            emailPrompt.classList.add('visible');
        }, 100);
    }

    const dailyResults = {};
    const monthlyResults = {};
    const weeklyResults = {};

    // تجميع نتائج الاختبارات لكل يوم وشهر وأسبوع
    for (const [testName, testResults] of Object.entries(studentProgressData)) {
        for (const [date, score] of Object.entries(testResults)) {
            if (date) {
                const [datePart, timePart] = date.split('T');
                const [year, month] = datePart.split('-');
                const day = datePart;
                const week = getWeekOfYear(new Date(datePart));

                // تجميع النتائج اليومية
                if (!dailyResults[day]) {
                    dailyResults[day] = 0;
                }
                dailyResults[day] += score;

                // تجميع النتائج الشهرية
                const monthKey = `${year}-${month}`;
                if (!monthlyResults[monthKey]) {
                    monthlyResults[monthKey] = 0;
                }
                monthlyResults[monthKey] += score;

                // تجميع النتائج الأسبوعية
                if (!weeklyResults[week]) {
                    weeklyResults[week] = 0;
                }
                weeklyResults[week] += score;
            }
        }
    }

    const dates = Object.keys(dailyResults);
    if (dates.length > 0) {
        const latestDate = dates.pop();
        const score = dailyResults[latestDate];
        // resultsContainer.innerHTML = `أحدث نتيجة يومية: ${score} تاريخ: ${latestDate})`;
    } else {
        resultsContainer.innerHTML = 'لم يتم العثور على نتائج.';
    }

    let scoreLogHtml = '<h2>سجل الاختبارات</h2><ul>';
    let totalScore = 0;
    let totalDays = 0;

    for (const [date, score] of Object.entries(dailyResults)) {
        scoreLogHtml += `<li>نتيجة الكلية لليوم - ${score} <div>تاريخ: ${date} </div></li>`;
        totalScore += score;
        totalDays += 1;
    }

    scoreLogHtml += '</ul>';
    scoreLogContainer.innerHTML = scoreLogHtml;

    // حساب متوسط النتيجة اليومية
    const averageScore = totalDays > 0 ? totalScore / totalDays : 0;
    sharesValue.textContent = averageScore.toFixed(2);

    // حساب نسبة التغيير
    let lastScore = 0;
    if (dates.length > 0) {
        const latestDate = dates.pop();
        lastScore = dailyResults[latestDate];
    }

    const percentageChangeValue = lastScore > 0 ? ((averageScore - lastScore) / lastScore) * 100 : 0;
    const percentageChangeText = `${percentageChangeValue.toFixed(2)}%`;

    // تغيير لون النص بناءً على القيمة
    if (percentageChangeValue >= 0) {
        percentageChange.classList.remove('text-danger');
        percentageChange.classList.add('text-success');
    } else {
        percentageChange.classList.remove('text-success');
        percentageChange.classList.add('text-danger');
    }

    // تحديث النص المعروض
    percentageChange.textContent = percentageChangeText;

    // رسم الرسم البياني للنتائج اليومية
    const sortedDates = Object.keys(dailyResults).sort((a, b) => new Date(a) - new Date(b));
    const dailyData = sortedDates.map(date => dailyResults[date]);

    new Chart(progressChartCtx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'نسبة الإجابات الصحيحة يومياً',
                data: dailyData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}%`;
                        }
                    }
                }
            }
        }
    });

    // رسم الرسم البياني للأنشطة
    const correctAnswers = averageScore; // نسبة الإجابات الصحيحة المحسوبة مسبقاً
    const incorrectAnswers = 100 - correctAnswers; // نسبة الإجابات الخاطئة
    
    const activityStatsData = {
        labels: ['الإجابات الصحيحة', 'الإجابات الخاطئة'],
        datasets: [{
            label: 'نسبة الإجابات',
            data: [correctAnswers, incorrectAnswers],
            backgroundColor: [
                'rgba(75, 192, 192, 0.2)',
                'rgba(255, 99, 132, 0.2)'
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    new Chart(activityStatsChartCtx, {
        type: 'doughnut',
        data: activityStatsData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}%`;
                        }
                    }
                }
            }
        }
    });

    // رسم الرسم البياني بالأعمدة لعرض الساعة والدقيقة ونتيجة الاختبار واسم الاختبار
    const testEntries = [];

    for (const [testName, testResults] of Object.entries(studentProgressData)) {
        for (const [date, score] of Object.entries(testResults)) {
            if (date) {
                const [datePart, timePart] = date.split('T');
                const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
                testEntries.push({
                    testName,
                    time: `${hours}:${minutes}`,
                    score,
                    date: datePart
                });
            }
        }
    }

    testEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = testEntries.map(entry => `${entry.date} ${entry.time}`);
    const scores = testEntries.map(entry => entry.score);
    const testNames = testEntries.map(entry => entry.testName);

    new Chart(testsBarChartCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'نتائج الاختبارات',
                data: scores,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'x',
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const index = tooltipItem.dataIndex;
                            return `اختبار: ${testNames[index]} - ${tooltipItem.label}: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });

    // رسم الرسم البياني الشهري
    const sortedMonths = Object.keys(monthlyResults).sort((a, b) => new Date(a) - new Date(b));
    const monthlyData = sortedMonths.map(month => monthlyResults[month]);

    new Chart(monthlyChartCtx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'نتائج الشهرية',
                data: monthlyData,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `نتيجة: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });

    // رسم الرسم البياني للمقارنة بين أسبوعين
    function getWeekOfYear(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    const weekResults = { currentWeek: 0, previousWeek: 0 };

    const now = new Date();
    const currentWeek = getWeekOfYear(now);
    const previousWeek = currentWeek - 1;

    for (const [date, score] of Object.entries(dailyResults)) {
        const dateObj = new Date(date);
        const week = getWeekOfYear(dateObj);

        if (week === currentWeek) {
            weekResults.currentWeek += score;
        } else if (week === previousWeek) {
            weekResults.previousWeek += score;
        }
    }

    new Chart(comparisonChartCtx, {
        type: 'bar',
        data: {
            labels: ['الأسبوع الحالي', 'الأسبوع السابق'],
            datasets: [{
                label: 'مقارنة نتائج الأسبوعين',
                data: [weekResults.currentWeek, weekResults.previousWeek],
                backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 159, 64, 0.2)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 159, 64, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `نتيجة: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });

    saveDataButton.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (email) {
            localStorage.setItem('email', email);
            downloadData(email, studentProgressData);
            emailPrompt.classList.remove('visible');
            setTimeout(() => {
                emailPrompt.classList.add('hidden');
            }, 500);
        } else {
            alert('يرجى إدخال البريد الإلكتروني.');
        }
    });

    function downloadData(email, data) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${email}_progress.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    logoutButton.addEventListener('click', logout);

    function logout() {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('studentProgress');
        localStorage.removeItem('email');
        window.location.href = 'login.html';
    }

    function getClassification(percentage) {
        if (percentage === 100) return 'متفوق';
        if (percentage >= 90) return 'ممتاز';
        if (percentage >= 82) return 'جيد جداً مرتفع';
        if (percentage >= 75) return 'جيد جداً';
        if (percentage >= 60) return 'جيد';
        if (percentage >= 50) return 'متوسط';
        return 'سيء جداً';
    }

    const classification = getClassification(percentage);
    const progressHtml = `
        <div class="mt-3">
            <p>التقدير: <span class="badge bg-success">${classification}</span></p>
            <div class="progress">
                <div class="progress-bar bg-success" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div>
            </div>
        </div>
    `;
    resultsContainer.innerHTML += progressHtml;
});

function adjustCanvasHeight() {
    const scoreLog = document.getElementById('scoreLog');
    const progressChart = document.getElementById('progressChart');

    if (scoreLog && progressChart) {
        if (window.innerWidth <= 768) {
            progressChart.style.height = 'auto';
        } else {
            progressChart.style.height = scoreLog.clientHeight + 'px';
        }
    }
}

window.onload = adjustCanvasHeight;
window.onresize = adjustCanvasHeight;






document.addEventListener('DOMContentLoaded', () => {
    // عناصر HTML
    const ratingElement = document.getElementById('rating');
    const scoreSummaryElement = document.getElementById('score-summary');

    // تحقق من وجود العناصر قبل استخدامها
    if (!ratingElement || !scoreSummaryElement) {
        console.error('One or more target elements are missing in the DOM.');
        return;
    }

    // الحصول على بيانات التقدم المخزنة من LocalStorage
    const studentProgressData = JSON.parse(localStorage.getItem('studentProgress')) || {};

    let totalScore = 0;
    let totalTests = 0;

    // حساب النتيجة الكلية وعدد الاختبارات
    for (const testResults of Object.values(studentProgressData)) {
        for (const score of Object.values(testResults)) {
            totalScore += score;
            totalTests += 1;
        }
    }

    // حساب التقييم (متوسط النتيجة على سبيل المثال)
    const averageScore = totalTests > 0 ? totalScore / totalTests : 0;

    // عرض النتيجة الكلية والتقييم
    scoreSummaryElement.textContent = `النتيجة الكلية: ${totalScore}`;
    ratingElement.textContent = `التقييم: ${averageScore.toFixed(2)}`;

    // حساب التقييم على مقياس من 1 إلى 5
    function determineRating(score) {
        if (score >= 5) return { level: 5, icon: 'fa-star' };
        if (score >= 4) return { level: 4, icon: 'fa-star' };
        if (score >= 3) return { level: 3, icon: 'fa-star-half-alt' };
        if (score >= 2) return { level: 2, icon: 'fa-star-half-alt' };
        return { level: 1, icon: 'fa-star-half-alt' };
    }

    const classification = determineRating(averageScore);
    const percentage = (averageScore / 5) * 100; // نسبة مئوية من 0 إلى 100

    const resultHtml = `
        <div class="mt-3-5">
            <p>التقييم النهائي: 
                <span class="badge bg-success">${classification.level}
                    <i class="fa ${classification.icon}" aria-hidden="true"></i>
                </span>
            </p>
            <div class="progress">
                <div class="progress-bar bg-success" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="5">${percentage.toFixed(2)}%</div>
            </div>
        </div>
    `;
    // إدراج resultHtml في العنصر المناسب
    ratingElement.innerHTML += resultHtml;
});
