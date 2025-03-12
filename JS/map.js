document.getElementById('study-plan-form').addEventListener('submit', function (event) {
    event.preventDefault();

        const deadline = new Date(document.getElementById('deadline').value);
        const restDay = document.getElementById('rest-day').value;
        const planName = document.getElementById('plan-name').value.trim();

        if (!deadline || !restDay || !planName) {
            alert('يرجى تحديد تاريخ الانتهاء واختيار يوم الراحة وإدخال اسم الخطة.');
            return;
        }

        const today = new Date();
        const totalDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        if (totalDays <= 0) {
            alert('يرجى اختيار تاريخ لاحق للانتهاء من الخطة.');
            return;
        }

        let jsonFilePath = 'path/to/lessons.json';
        if (totalDays <= 30) {
            jsonFilePath = 'path/to/lessons-30day.json';
        } else if (totalDays <= 60) {
            jsonFilePath = 'path/to/lessons-60day.json';
        } else if (totalDays <= 65) {
            jsonFilePath = 'path/to/lessons-120day.json';
        }

        fetch(jsonFilePath)
            .then(response => response.json())
            .then(data => {
                const subjects = data;
                const studyDays = [];
                for (let i = 0; i < totalDays; i++) {
                    const currentDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
                    const dayName = currentDate.toLocaleDateString('ar-EG', { weekday: 'long' });
                    if (dayName !== restDay) {
                        studyDays.push(currentDate);
                    }
                }

                const allLessons = [];
                Object.entries(subjects).forEach(([subject, lessons]) => {
                    lessons.forEach(lesson => {
                        allLessons.push({ name: `${subject}: ${lesson.name}` });
                    });
                });

                const totalLessons = allLessons.length;
                const studyDaysCount = studyDays.length;
                const lessonsPerDay = Math.ceil(totalLessons / studyDaysCount);
                const plan = { name: planName, days: [] };

                let lessonIndex = 0;

                studyDays.forEach((studyDay) => {
                    const daySchedule = { date: studyDay.toLocaleDateString('ar-EG'), lessons: [] };
                    for (let i = 0; i < lessonsPerDay; i++) {
                        if (lessonIndex < totalLessons) {
                            daySchedule.lessons.push(allLessons[lessonIndex++].name);
                        } else {
                            break;
                        }
                    }
                    plan.days.push(daySchedule);
                });

                localStorage.setItem('studyPlan', JSON.stringify(plan));
                alert('تم إنشاء الخطة بنجاح!');
                document.getElementById('view-plan').style.display = 'block';
            })
            .catch(error => {
                console.error('حدث خطأ أثناء تحميل ملف JSON:', error);
            });
});

document.getElementById('view-plan').addEventListener('click', function () {
    window.location.href = 'view-plan.html';
});
