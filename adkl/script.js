document.addEventListener('DOMContentLoaded', function() {
    // ==================== المتغيرات العامة ====================
    let currentUser = null;
    let allQuestions = JSON.parse(localStorage.getItem('questions')) || [];
    let allUsers = JSON.parse(localStorage.getItem('users')) || [];
    let questionsChart = null;
    let performanceChart = null;
    
    // ==================== عناصر DOM ====================
    // شاشة التحميل
    const loadingScreen = document.querySelector('.loading-screen');
    
    // شاشة تسجيل الدخول
    const loginSection = document.getElementById('login-section');
    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username');
    const uniqueIdSpan = document.getElementById('unique-id');
    const copyIdBtn = document.getElementById('copy-id');
    
    // الواجهة الرئيسية
    const appSection = document.getElementById('app-section');
    const welcomeMsg = document.getElementById('welcome-msg');
    const userAvatar = document.getElementById('user-avatar');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarUserid = document.getElementById('sidebar-userid');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logout-btn');
    const pageTitle = document.getElementById('page-title');
    
    // أقسام الصفحات
    const contentSections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('nav li[data-page]');
    
    // قسم الأسئلة
    const questionsPage = document.getElementById('questions-page');
    const questionsList = document.getElementById('questions-list');
    const questionSearch = document.getElementById('question-search');
    const questionFilter = document.getElementById('question-filter');
    const progressPercent = document.getElementById('progress-percent');
    const progressFill = document.getElementById('progress-fill');
    
    // واجهة حل السؤال
    const quizModal = document.getElementById('quiz-modal');
    const quizOverlay = document.getElementById('quiz-overlay');
    const quizTitle = document.getElementById('quiz-title');
    const quizQuestion = document.getElementById('quiz-question');
    const quizImageContainer = document.getElementById('quiz-image-container');
    const quizOptions = document.getElementById('quiz-options');
    const submitAnswerBtn = document.getElementById('submit-answer');
    const quizFeedback = document.getElementById('quiz-feedback');
    const feedbackContent = document.getElementById('feedback-content');
    const nextQuestionBtn = document.getElementById('next-question');
    const closeQuizBtn = document.getElementById('close-quiz');
    
    // قسم إضافة سؤال
    const addQuestionForm = document.getElementById('add-question-form');
    const newQuestionInput = document.getElementById('new-question');
    const questionImageInput = document.getElementById('question-image');
    const imageNameSpan = document.getElementById('image-name');
    const answerOptions = document.getElementById('answer-options');
    const addOptionBtn = document.getElementById('add-option');
    
    // قسم الإحصائيات
    const statisticsPage = document.getElementById('statistics-page');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const solvedQuestionsSpan = document.getElementById('solved-questions');
    const unsolvedQuestionsSpan = document.getElementById('unsolved-questions');
    const imageQuestionsSpan = document.getElementById('image-questions');
    const activityList = document.getElementById('activity-list');
    
    // قسم النسخ الاحتياطي
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    const importFileInput = document.getElementById('import-file');
    
    // الإشعارات
    const notificationContainer = document.getElementById('notification-container');
    
    // ==================== دوال مساعدة ====================
    
    // توليد معرف فريد بناءً على MAC Address
    function generateUniqueId() {
        // في بيئة حقيقية، يمكن استخدام مكتبة للحصول على MAC Address
        // هنا نستخدم توليد عشوائي لأغراض العرض التوضيحي
        return 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
    }
    
    // عرض إشعار للمستخدم
    function showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} fade-in`;
        
        let icon;
        switch(type) {
            case 'success': icon = 'fa-check-circle'; break;
            case 'error': icon = 'fa-times-circle'; break;
            case 'warning': icon = 'fa-exclamation-circle'; break;
            default: icon = 'fa-info-circle';
        }
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="notification-message">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // إغلاق الإشعار عند النقر على الزر
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });
        
        // إزالة الإشعار تلقائياً بعد 5 ثواني
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // تحميل الصورة كـ base64
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // تحديث واجهة المستخدم بناءً على المستخدم الحالي
    function updateUI() {
        if (!currentUser) return;
        
        // تحديث معلومات المستخدم
        welcomeMsg.textContent = `مرحباً، ${currentUser.username || 'مستخدم'}`;
        sidebarUsername.textContent = currentUser.username || 'مستخدم';
        sidebarUserid.textContent = `ID: ${currentUser.id.substr(0, 12)}...`;
        
        // تحديث الصورة الرمزية
        const avatarText = currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U';
        userAvatar.textContent = avatarText;
        sidebarAvatar.textContent = avatarText;
        
        // تحديث الصفحة النشطة
        const activePage = document.querySelector('nav li.active');
        if (activePage) {
            const page = activePage.getAttribute('data-page');
            pageTitle.textContent = activePage.textContent.trim();
            document.body.className = `${page}-page`;
        }
        
        // تحديث الأسئلة والإحصائيات
        renderQuestions();
        updateStatistics();
    }
    
    // تصفية الأسئلة للمستخدم الحالي
    function getUserQuestions() {
        if (!currentUser) return [];
        return allQuestions.filter(q => q.userId === currentUser.id);
    }
    
    // عرض الأسئلة في القسم المخصص
    function renderQuestions() {
        const userQuestions = getUserQuestions();
        const searchTerm = questionSearch.value.toLowerCase();
        const filterValue = questionFilter.value;
        
        // تطبيق البحث والتصفية
        let filteredQuestions = userQuestions.filter(q => {
            const matchesSearch = q.questionText.toLowerCase().includes(searchTerm) || 
                                q.options.some(opt => opt.text.toLowerCase().includes(searchTerm));
            
            let matchesFilter = true;
            if (filterValue === 'solved') matchesFilter = q.solved;
            if (filterValue === 'unsolved') matchesFilter = !q.solved;
            
            return matchesSearch && matchesFilter;
        });
        
        // عرض الأسئلة
        questionsList.innerHTML = '';
        
        if (filteredQuestions.length === 0) {
            questionsList.innerHTML = `
                <div class="no-questions">
                    <i class="fas fa-book-open"></i>
                    <p>لا توجد أسئلة لعرضها</p>
                </div>
            `;
            return;
        }
        
        filteredQuestions.forEach(question => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card slide-up';
            questionCard.dataset.id = question.id;
            
            const questionTextShort = question.questionText.length > 100 
                ? question.questionText.substring(0, 100) + '...' 
                : question.questionText;
            
            const hasImage = question.image ? `<img src="${question.image}" class="question-card-image" alt="صورة السؤال">` : '';
            
            questionCard.innerHTML = `
                <div class="question-card-header">
                    <span class="question-card-id">${question.id.substr(0, 8)}</span>
                    <span class="question-card-status ${question.solved ? 'solved' : 'unsolved'}">
                        ${question.solved ? 'محلولة' : 'غير محلولة'}
                    </span>
                </div>
                <div class="question-card-body">
                    ${hasImage}
                    <p class="question-card-text">${questionTextShort}</p>
                </div>
                <div class="question-card-footer">
                    <span class="question-card-options">
                        <i class="fas fa-list-ol"></i> ${question.options.length} خيارات
                    </span>
                    <button class="solve-btn" data-id="${question.id}">
                        <i class="fas fa-pencil-alt"></i> حل السؤال
                    </button>
                </div>
            `;
            
            questionsList.appendChild(questionCard);
        });
        
        // تحديث شريط التقدم
        updateProgressBar();
        
        // إضافة معالجات الأحداث لأزرار حل السؤال
        document.querySelectorAll('.solve-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const questionId = this.dataset.id;
                showQuizModal(questionId);
            });
        });
    }
    
    // تحديث شريط التقدم
    function updateProgressBar() {
        const userQuestions = getUserQuestions();
        if (userQuestions.length === 0) {
            progressPercent.textContent = '0%';
            progressFill.style.width = '0%';
            return;
        }
        
        const solvedCount = userQuestions.filter(q => q.solved).length;
        const percent = Math.round((solvedCount / userQuestions.length) * 100);
        
        progressPercent.textContent = `${percent}%`;
        progressFill.style.width = `${percent}%`;
    }
    
    // عرض واجهة حل السؤال
    function showQuizModal(questionId) {
        const question = allQuestions.find(q => q.id === questionId);
        if (!question) return;
        
        quizModal.dataset.questionId = questionId;
        quizTitle.textContent = `السؤال ${question.id.substr(0, 8)}`;
        quizQuestion.textContent = question.questionText;
        
        // عرض صورة السؤال إن وجدت
        quizImageContainer.innerHTML = '';
        if (question.image) {
            const img = document.createElement('img');
            img.src = question.image;
            img.alt = 'صورة السؤال';
            quizImageContainer.appendChild(img);
        }
        
        // عرض الخيارات
        quizOptions.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';
            optionDiv.innerHTML = `
                <input type="radio" id="option-${index}" name="quiz-answer" value="${index}">
                <label for="option-${index}">${option.text}</label>
            `;
            quizOptions.appendChild(optionDiv);
        });
        
        // إخفاء التغذية الراجعة
        quizFeedback.style.display = 'none';
        feedbackContent.className = 'feedback-content';
        feedbackContent.innerHTML = '';
        
        // تفعيل زر التقديم
        submitAnswerBtn.disabled = false;
        
        // عرض الواجهة
        quizOverlay.classList.add('active');
        quizModal.classList.add('active');
    }
    
    // إغلاق واجهة حل السؤال
    function closeQuizModal() {
        quizOverlay.classList.remove('active');
        quizModal.classList.remove('active');
    }
    
    // معالجة إرسال الإجابة
    function handleAnswerSubmission() {
        const questionId = quizModal.dataset.questionId;
        const question = allQuestions.find(q => q.id === questionId);
        if (!question) return;
        
        const selectedOption = document.querySelector('input[name="quiz-answer"]:checked');
        if (!selectedOption) {
            showNotification('warning', 'الرجاء اختيار إجابة قبل التقديم');
            return;
        }
        
        const selectedAnswerIndex = parseInt(selectedOption.value);
        const isCorrect = selectedAnswerIndex === question.correctAnswer;
        
        // تعطيل زر التقديم
        submitAnswerBtn.disabled = true;
        
        // تسجيل محاولة الحل
        if (!question.attempts) question.attempts = [];
        question.attempts.push({
            date: new Date().toISOString(),
            answer: selectedAnswerIndex,
            isCorrect: isCorrect
        });
        
        // إذا كانت الإجابة صحيحة، وضع علامة محلولة
        if (isCorrect && !question.solved) {
            question.solved = true;
        }
        
        // حفظ التغييرات
        localStorage.setItem('questions', JSON.stringify(allQuestions));
        
        // عرض التغذية الراجعة
        feedbackContent.className = `feedback-content ${isCorrect ? 'correct' : 'wrong'}`;
        
        if (isCorrect) {
            feedbackContent.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>إجابة صحيحة! أحسنت!</span>
            `;
        } else {
            const correctAnswer = question.options[question.correctAnswer].text;
            feedbackContent.innerHTML = `
                <i class="fas fa-times-circle"></i>
                <span>إجابة خاطئة. الإجابة الصحيحة هي: ${correctAnswer}</span>
            `;
        }
        
        quizFeedback.style.display = 'block';
        
        // تحديث الواجهة
        renderQuestions();
        updateStatistics();
    }
    
    // تحديث قسم الإحصائيات
    function updateStatistics() {
        const userQuestions = getUserQuestions();
        const total = userQuestions.length;
        const solved = userQuestions.filter(q => q.solved).length;
        const unsolved = total - solved;
        const withImages = userQuestions.filter(q => q.image).length;
        
        totalQuestionsSpan.textContent = total;
        solvedQuestionsSpan.textContent = solved;
        unsolvedQuestionsSpan.textContent = unsolved;
        imageQuestionsSpan.textContent = withImages;
        
        // تحديث النشاط الأخير
        updateRecentActivity();
        
        // تحديث الرسوم البيانية
        updateCharts();
    }
    
    // تحديث النشاط الأخير
    function updateRecentActivity() {
        const userQuestions = getUserQuestions();
        activityList.innerHTML = '';
        
        // جمع جميع المحاولات
        let allAttempts = [];
        userQuestions.forEach(q => {
            if (q.attempts && q.attempts.length > 0) {
                q.attempts.forEach(a => {
                    allAttempts.push({
                        ...a,
                        questionId: q.id,
                        questionText: q.questionText
                    });
                });
            }
        });
        
        // ترتيب حسب التاريخ (الأحدث أولاً)
        allAttempts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // عرض آخر 5 نشاطات
        const recentAttempts = allAttempts.slice(0, 5);
        
        if (recentAttempts.length === 0) {
            activityList.innerHTML = `
                <div class="no-activity">
                    <i class="fas fa-info-circle"></i>
                    <p>لا يوجد نشاط حديث</p>
                </div>
            `;
            return;
        }
        
        recentAttempts.forEach(attempt => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const icon = attempt.isCorrect ? 'fa-check-circle' : 'fa-times-circle';
            const colorClass = attempt.isCorrect ? 'success' : 'danger';
            
            activityItem.innerHTML = `
                <div class="activity-icon ${colorClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="activity-info">
                    <div class="activity-title">
                        ${attempt.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'} على السؤال
                    </div>
                    <div class="activity-date">
                        ${new Date(attempt.date).toLocaleString('ar-EG')}
                    </div>
                </div>
            `;
            
            activityList.appendChild(activityItem);
        });
    }
    
    // تحديث الرسوم البيانية
    function updateCharts() {
        const userQuestions = getUserQuestions();
        
        // توزيع الأسئلة
        const ctx1 = document.getElementById('questions-chart').getContext('2d');
        
        if (questionsChart) {
            questionsChart.destroy();
        }
        
        if (userQuestions.length > 0) {
            const solved = userQuestions.filter(q => q.solved).length;
            const unsolved = userQuestions.length - solved;
            const withImages = userQuestions.filter(q => q.image).length;
            const withoutImages = userQuestions.length - withImages;
            
            questionsChart = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['محلولة', 'غير محلولة', 'بصور', 'بدون صور'],
                    datasets: [{
                        data: [solved, unsolved, withImages, withoutImages],
                        backgroundColor: [
                            '#28a745',
                            '#fd7e14',
                            '#17a2b8',
                            '#6c757d'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            rtl: true
                        }
                    }
                }
            });
        } else {
            document.getElementById('questions-chart').innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-pie"></i>
                    <p>لا توجد بيانات كافية</p>
                </div>
            `;
        }
        
        // أداء الحل
        const ctx2 = document.getElementById('performance-chart').getContext('2d');
        
        if (performanceChart) {
            performanceChart.destroy();
        }
        
        if (userQuestions.length > 0 && userQuestions.some(q => q.attempts && q.attempts.length > 0)) {
            // تحضير بيانات الأداء
            const performanceData = [];
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();
            
            last7Days.forEach(date => {
                let correct = 0;
                let incorrect = 0;
                
                userQuestions.forEach(q => {
                    if (q.attempts) {
                        q.attempts.forEach(a => {
                            if (a.date.split('T')[0] === date) {
                                if (a.isCorrect) correct++;
                                else incorrect++;
                            }
                        });
                    }
                });
                
                performanceData.push({
                    date,
                    correct,
                    incorrect
                });
            });
            
            performanceChart = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: last7Days.map(d => new Date(d).toLocaleDateString('ar-EG')),
                    datasets: [
                        {
                            label: 'إجابات صحيحة',
                            data: performanceData.map(d => d.correct),
                            backgroundColor: '#28a745'
                        },
                        {
                            label: 'إجابات خاطئة',
                            data: performanceData.map(d => d.incorrect),
                            backgroundColor: '#dc3545'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            rtl: true
                        }
                    }
                }
            });
        } else {
            document.getElementById('performance-chart').innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-bar"></i>
                    <p>لا توجد بيانات كافية</p>
                </div>
            `;
        }
    }
    
    // تصدير بيانات المستخدم
    function exportUserData() {
        if (!currentUser) return;
        
        const userQuestions = getUserQuestions();
        const userData = {
            userId: currentUser.id,
            username: currentUser.username,
            exportedAt: new Date().toISOString(),
            questions: userQuestions
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportName = `أسئلة_${currentUser.username || currentUser.id.substr(0, 8)}_${new Date().toISOString().split('T')[0]}.json`;
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', exportName);
        link.click();
        
        showNotification('success', 'تم تصدير بياناتك بنجاح');
    }
    
    // استيراد بيانات المستخدم
    function importUserData(file) {
        if (!file) {
            showNotification('warning', 'الرجاء اختيار ملف للاستيراد');
            return;
        }
        
        if (!currentUser) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // التحقق من أن الملف يحتوي على بيانات صالحة
                if (!data.userId || !data.questions) {
                    throw new Error('هذا الملف لا يحتوي على بيانات صالحة');
                }
                
                // التحقق من أن الملف خاص بالمستخدم الحالي
                if (data.userId !== currentUser.id) {
                    throw new Error('هذا الملف لا يحتوي على أسئلتك');
                }
                
                // دمج الأسئلة مع تجنب التكرار
                let importedCount = 0;
                data.questions.forEach(importedQuestion => {
                    const exists = allQuestions.some(q => q.id === importedQuestion.id && q.userId === currentUser.id);
                    if (!exists) {
                        allQuestions.push(importedQuestion);
                        importedCount++;
                    }
                });
                
                // حفظ البيانات
                localStorage.setItem('questions', JSON.stringify(allQuestions));
                
                // تحديث الواجهة
                renderQuestions();
                updateStatistics();
                
                showNotification('success', `تم استيراد ${importedCount} سؤال بنجاح`);
                
            } catch (error) {
                showNotification('error', `حدث خطأ أثناء استيراد الملف: ${error.message}`);
            }
        };
        reader.readAsText(file);
    }
    
    // ==================== معالجات الأحداث ====================
    
    // تسجيل الدخول
    loginBtn.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showNotification('warning', 'الرجاء إدخال اسم المستخدم');
            return;
        }
        
        // إنشاء أو جلب المستخدم
        let userId = localStorage.getItem('currentUserId');
        let user = allUsers.find(u => u.id === userId);
        
        if (!user) {
            // مستخدم جديد
            userId = generateUniqueId();
            user = {
                id: userId,
                username: username,
                createdAt: new Date().toISOString()
            };
            
            allUsers.push(user);
            localStorage.setItem('users', JSON.stringify(allUsers));
            localStorage.setItem('currentUserId', userId);
            
            showNotification('success', `مرحباً ${username}! تم إنشاء حسابك بنجاح`);
        } else {
            // مستخدم موجود
            user.username = username;
            localStorage.setItem('users', JSON.stringify(allUsers));
            
            showNotification('success', `مرحباً بعودتك ${username}!`);
        }
        
        // تحديث المستخدم الحالي
        currentUser = user;
        
        // إخفاء شاشة التحميل بعد 1.5 ثانية
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                loginSection.style.display = 'none';
                appSection.style.display = 'block';
                updateUI();
            }, 500);
        }, 1500);
    });
    
    // نسخ المعرف
    copyIdBtn.addEventListener('click', function() {
        const userId = uniqueIdSpan.textContent;
        navigator.clipboard.writeText(userId).then(() => {
            showNotification('success', 'تم نسخ المعرف بنجاح');
        });
    });
    
    // تسجيل الخروج
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUserId');
        
        // إظهار شاشة التحميل
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';
        
        // العودة إلى شاشة تسجيل الدخول بعد 1 ثانية
        setTimeout(() => {
            appSection.style.display = 'none';
            loginSection.style.display = 'flex';
            usernameInput.value = '';
            
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }, 1000);
    });
    
    // تبديل القائمة الجانبية
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // تبديل الصفحات
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إزالة النشاط من جميع الروابط
            navLinks.forEach(l => l.classList.remove('active'));
            
            // إضافة النشاط للرابط الحالي
            this.classList.add('active');
            
            // إخفاء جميع الأقسام
            contentSections.forEach(section => section.classList.remove('active'));
            
            // عرض القسم المحدد
            const page = this.getAttribute('data-page');
            document.getElementById(`${page}-page`).classList.add('active');
            
            // تحديث عنوان الصفحة
            pageTitle.textContent = this.textContent.trim();
            document.body.className = `${page}-page`;
            
            // إغلاق القائمة الجانبية على الأجهزة الصغيرة
            if (window.innerWidth < 768) {
                sidebar.classList.remove('active');
            }
            
            // إذا كانت الصفحة هي الإحصائيات، قم بتحديث الرسوم البيانية
            if (page === 'statistics') {
                updateStatistics();
            }
        });
    });
    
    // البحث في الأسئلة
    questionSearch.addEventListener('input', renderQuestions);
    questionFilter.addEventListener('change', renderQuestions);
    
    // حل السؤال
    submitAnswerBtn.addEventListener('click', handleAnswerSubmission);
    nextQuestionBtn.addEventListener('click', closeQuizModal);
    closeQuizBtn.addEventListener('click', closeQuizModal);
    quizOverlay.addEventListener('click', closeQuizModal);
    
    // إضافة سؤال جديد
    addQuestionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) return;
        
        const questionText = newQuestionInput.value.trim();
        if (!questionText) {
            showNotification('warning', 'الرجاء إدخال نص السؤال');
            return;
        }
        
        // جمع الخيارات
        const options = [];
        let correctAnswer = 0;
        
        const optionInputs = document.querySelectorAll('.option-input');
        optionInputs.forEach((input, index) => {
            const text = input.value.trim();
            if (text) {
                options.push({ text });
                
                // تحديد الإجابة الصحيحة
                const radio = document.querySelector(`input[name="correct-answer"][value="${index}"]`);
                if (radio.checked) {
                    correctAnswer = index;
                }
            }
        });
        
        if (options.length < 2) {
            showNotification('warning', 'الرجاء إدخال خيارين على الأقل');
            return;
        }
        
        // إنشاء كائن السؤال
        const newQuestion = {
            id: 'q-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            userId: currentUser.id,
            questionText,
            options,
            correctAnswer,
            createdAt: new Date().toISOString(),
            solved: false
        };
        
        // معالجة صورة السؤال إذا وجدت
        if (questionImageInput.files[0]) {
            try {
                newQuestion.image = await readFileAsDataURL(questionImageInput.files[0]);
            } catch (error) {
                showNotification('error', 'حدث خطأ أثناء تحميل الصورة');
                return;
            }
        }
        
        // إضافة السؤال إلى القائمة
        allQuestions.push(newQuestion);
        localStorage.setItem('questions', JSON.stringify(allQuestions));
        
        // إعادة تعيين النموذج
        addQuestionForm.reset();
        answerOptions.innerHTML = `
            <div class="option-item" data-index="0">
                <div class="option-controls">
                    <input type="radio" name="correct-answer" value="0" checked>
                    <button type="button" class="remove-option" disabled>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <input type="text" class="option-input" placeholder="الخيار الأول" required>
            </div>
            <div class="option-item" data-index="1">
                <div class="option-controls">
                    <input type="radio" name="correct-answer" value="1">
                    <button type="button" class="remove-option" disabled>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <input type="text" class="option-input" placeholder="الخيار الثاني" required>
            </div>
        `;
        
        // إعادة إرفاق معالجات الأحداث لأزرار الحذف
        document.querySelectorAll('.remove-option').forEach(btn => {
            btn.addEventListener('click', function() {
                if (document.querySelectorAll('.option-item').length > 2) {
                    this.closest('.option-item').remove();
                    updateOptionIndexes();
                }
            });
        });
        
        imageNameSpan.textContent = 'لم يتم اختيار صورة';
        
        // عرض رسالة نجاح
        showNotification('success', 'تم إضافة السؤال بنجاح');
        
        // تحديث الواجهة
        renderQuestions();
        updateStatistics();
        
        // الذهاب إلى قسم الأسئلة
        document.querySelector('nav li[data-page="questions"]').click();
    });
    
    // إضافة خيار جديد
    addOptionBtn.addEventListener('click', function() {
        const optionCount = document.querySelectorAll('.option-item').length;
        const newIndex = optionCount;
        
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        optionItem.dataset.index = newIndex;
        optionItem.innerHTML = `
            <div class="option-controls">
                <input type="radio" name="correct-answer" value="${newIndex}">
                <button type="button" class="remove-option">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <input type="text" class="option-input" placeholder="الخيار الجديد" required>
        `;
        
        answerOptions.appendChild(optionItem);
        
        // إضافة معالج الحدث لزر الحذف
        optionItem.querySelector('.remove-option').addEventListener('click', function() {
            if (document.querySelectorAll('.option-item').length > 2) {
                optionItem.remove();
                updateOptionIndexes();
            }
        });
    });
    
    // تحديث فهارس الخيارات بعد الحذف
    function updateOptionIndexes() {
        document.querySelectorAll('.option-item').forEach((item, index) => {
            item.dataset.index = index;
            const radio = item.querySelector('input[type="radio"]');
            radio.value = index;
        });
    }
    
    // اختيار صورة السؤال
    questionImageInput.addEventListener('change', function() {
        if (this.files[0]) {
            imageNameSpan.textContent = this.files[0].name;
        } else {
            imageNameSpan.textContent = 'لم يتم اختيار صورة';
        }
    });
    
    // تصدير البيانات
    exportDataBtn.addEventListener('click', exportUserData);
    
    // استيراد البيانات
    importDataBtn.addEventListener('click', function() {
        if (importFileInput.files[0]) {
            importUserData(importFileInput.files[0]);
            importFileInput.value = '';
        } else {
            showNotification('warning', 'الرجاء اختيار ملف للاستيراد');
        }
    });
    
    // ==================== التهيئة الأولية ====================
    
    // محاكاة شاشة التحميل
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            
            // التحقق من وجود مستخدم مسجل
            const userId = localStorage.getItem('currentUserId');
            if (userId) {
                currentUser = allUsers.find(u => u.id === userId);
                if (currentUser) {
                    loginSection.style.display = 'none';
                    appSection.style.display = 'block';
                    updateUI();
                    return;
                }
            }
            
            // إذا لم يكن هناك مستخدم مسجل، عرض شاشة تسجيل الدخول
            loginSection.style.display = 'flex';
            
            // توليد معرف فريد للمستخدم الجديد
            const newUserId = generateUniqueId();
            uniqueIdSpan.textContent = newUserId;
            
        }, 500);
    }, 2000);
    
    // إضافة معالجات الأحداث لأزرار حذف الخيارات الأولية
    document.querySelectorAll('.remove-option').forEach(btn => {
        btn.addEventListener('click', function() {
            if (document.querySelectorAll('.option-item').length > 2) {
                this.closest('.option-item').remove();
                updateOptionIndexes();
            }
        });
    });
});


















// ==================== تعديلات على قسم النسخ الاحتياطي ====================

// إنشاء عناصر DOM للتحكم بكلمة المرور
const backupCards = document.querySelector('.backup-cards');
backupCards.insertAdjacentHTML('beforeend', `
    <div class="password-modal" id="password-modal">
        <div class="password-content">
            <h3>إدخال كلمة المرور</h3>
            <p>الرجاء إدخال كلمة مرور لتأمين ملف النسخة الاحتياطية</p>
            <input type="password" id="backup-password" placeholder="كلمة المرور">
            <div class="password-buttons">
                <button id="confirm-password" class="primary-btn">تأكيد</button>
                <button id="cancel-password" class="secondary-btn">إلغاء</button>
            </div>
        </div>
    </div>
`);

// متغيرات للتحكم بعملية النسخ الاحتياطي
let currentExportData = null;
let currentImportFile = null;

// عرض نافذة إدخال كلمة المرور
function showPasswordModal(action, data = null) {
    const passwordModal = document.getElementById('password-modal');
    const backupPassword = document.getElementById('backup-password');
    const confirmBtn = document.getElementById('confirm-password');
    const cancelBtn = document.getElementById('cancel-password');
    
    // تنظيف الحقول
    backupPassword.value = '';
    
    // إعداد الوظيفة بناءً على الإجراء
    if (action === 'export') {
        currentExportData = data;
        passwordModal.querySelector('h3').textContent = 'إدخال كلمة المرور';
        passwordModal.querySelector('p').textContent = 'الرجاء إدخال كلمة مرور لتأمين ملف النسخة الاحتياطية';
    } else {
        passwordModal.querySelector('h3').textContent = 'إدخال كلمة المرور';
        passwordModal.querySelector('p').textContent = 'الرجاء إدخال كلمة المرور لفتح ملف النسخة الاحتياطية';
    }
    
    // عرض النافذة
    passwordModal.style.display = 'flex';
    setTimeout(() => {
        passwordModal.style.opacity = '1';
        backupPassword.focus();
    }, 10);
    
    // معالجة الأحداث
    const handleConfirm = () => {
        const password = backupPassword.value.trim();
        if (!password) {
            showNotification('warning', 'الرجاء إدخال كلمة المرور');
            return;
        }
        
        if (action === 'export') {
            exportWithPassword(currentExportData, password);
        } else {
            importWithPassword(currentImportFile, password);
        }
        
        // إخفاء النافذة
        passwordModal.style.opacity = '0';
        setTimeout(() => {
            passwordModal.style.display = 'none';
        }, 300);
    };
    
    const handleCancel = () => {
        passwordModal.style.opacity = '0';
        setTimeout(() => {
            passwordModal.style.display = 'none';
            currentExportData = null;
            currentImportFile = null;
        }, 300);
    };
    
    // إزالة المعالجات السابقة إن وجدت
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    backupPassword.removeEventListener('keypress', handleKeyPress);
    
    // إضافة المعالجات الجديدة
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    function handleKeyPress(e) {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    }
    
    backupPassword.addEventListener('keypress', handleKeyPress);
}

// تصدير البيانات مع كلمة مرور
function exportWithPassword(data, password) {
    try {
        // إضافة كلمة المرور وتاريخ التصدير إلى البيانات
        const securedData = {
            ...data,
            password: btoa(password), // تشفير بسيط لكلمة المرور (يفضل استخدام تشفير أقوى في التطبيقات الحقيقية)
            exportedAt: new Date().toISOString(),
            secured: true
        };
        
        const dataStr = JSON.stringify(securedData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportName = `أسئلة_${currentUser.username || currentUser.id.substr(0, 8)}_${new Date().toISOString().split('T')[0]}.json`;
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', exportName);
        link.click();
        
        showNotification('success', 'تم تصدير بياناتك بنجاح مع حماية بكلمة مرور');
    } catch (error) {
        showNotification('error', 'حدث خطأ أثناء تصدير البيانات: ' + error.message);
    }
}

// استيراد البيانات مع التحقق من كلمة المرور
async function importWithPassword(file, password) {
    try {
        const fileContent = await readFileAsText(file);
        const data = JSON.parse(fileContent);
        
        // التحقق من أن الملف محمي بكلمة مرور
        if (!data.secured || !data.password) {
            throw new Error('هذا الملف غير محمي بكلمة مرور');
        }
        
        // التحقق من كلمة المرور
        if (btoa(password) !== data.password) {
            throw new Error('كلمة المرور غير صحيحة');
        }
        
        // التحقق من أن الملف يحتوي على بيانات صالحة
        if (!data.userId || !data.questions) {
            throw new Error('هذا الملف لا يحتوي على بيانات صالحة');
        }
        
        // التحقق من أن الملف خاص بالمستخدم الحالي
        if (data.userId !== currentUser.id) {
            throw new Error('هذا الملف لا يحتوي على أسئلتك');
        }
        
        // دمج الأسئلة مع تجنب التكرار
        let importedCount = 0;
        data.questions.forEach(importedQuestion => {
            const exists = allQuestions.some(q => q.id === importedQuestion.id && q.userId === currentUser.id);
            if (!exists) {
                allQuestions.push(importedQuestion);
                importedCount++;
            }
        });
        
        // حفظ البيانات
        localStorage.setItem('questions', JSON.stringify(allQuestions));
        
        // تحديث الواجهة
        renderQuestions();
        updateStatistics();
        
        showNotification('success', `تم استيراد ${importedCount} سؤال بنجاح`);
        
    } catch (error) {
        showNotification('error', `حدث خطأ أثناء استيراد الملف: ${error.message}`);
    }
}

// دالة مساعدة لقراءة الملف كنص
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// تعديل معالجات الأحداث للتصدير والاستيراد
exportDataBtn.addEventListener('click', function() {
    if (!currentUser) return;
    
    const userQuestions = getUserQuestions();
    const userData = {
        userId: currentUser.id,
        username: currentUser.username,
        questions: userQuestions
    };
    
    showPasswordModal('export', userData);
});

importDataBtn.addEventListener('click', function() {
    if (importFileInput.files[0]) {
        currentImportFile = importFileInput.files[0];
        showPasswordModal('import');
        importFileInput.value = '';
    } else {
        showNotification('warning', 'الرجاء اختيار ملف للاستيراد');
    }
});

// إضافة CSS للنافذة المنبثقة
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .password-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .password-content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            text-align: center;
        }
        
        .password-content h3 {
            margin-top: 0;
            color: #333;
        }
        
        .password-content p {
            color: #666;
            margin-bottom: 20px;
        }
        
        #backup-password {
            width: 100%;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        
        .password-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .password-buttons button {
            flex: 1;
        }
    </style>
`);