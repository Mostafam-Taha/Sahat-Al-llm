document.addEventListener('DOMContentLoaded', () => {
    const testNameInput = document.getElementById('testName');
    const startTestButton = document.getElementById('startTest');
    const quizContainer = document.getElementById('quiz');
    const submitButton = document.getElementById('submit');
    const testNameSection = document.getElementById('testNameSection');
    const nextButton = document.createElement('button');
    const prevButton = document.createElement('button');
    const progressDisplay = document.getElementById('progress');

    let myQuestions = [];
    let currentQuestionIndex = 0;

    nextButton.textContent = 'السؤال التالي';
    prevButton.textContent = 'السؤال السابق';
    prevButton.style.display = 'none';

    function startTimer(duration, display) {
        let timer = duration, minutes, seconds;
        const timerInterval = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(timerInterval);
                showResults();
                alert('انتهى الوقت المحدد للاختبار. سيتم إرسال إجاباتك الآن.');
                window.location.href = '../index.html';
            }
        }, 1000);
    }

    startTestButton.addEventListener('click', () => {
        const testName = testNameInput.value.trim();
        if (!testName) {
            alert('يرجى إدخال اسم للاختبار');
            return;
        }

        testNameSection.style.display = 'none';
        quizContainer.style.display = 'block';
        submitButton.style.display = 'block';

        fetch('../Quiztion/arabic-quiz.json')
            .then(response => response.json())
            .then(data => {
                myQuestions = data.questions;
                const selectedQuestions = getRandomQuestions(myQuestions, 14);
                myQuestions = selectedQuestions;
                buildQuiz(selectedQuestions);
                showQuestion(currentQuestionIndex);
            });

        const display = document.getElementById('timer');
        startTimer( 20 * 60, display);
    });

    function getRandomQuestions(questions, numberOfQuestions) {
        const shuffled = questions.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numberOfQuestions);
    }

    function buildQuiz(questions) {
        const output = [];
        questions.forEach((currentQuestion, questionNumber) => {
            const answers = [];
            for (let letter in currentQuestion.answers) {
                answers.push(
                    `<label>
                        <input type="radio" name="question${questionNumber}" value="${letter}">
                        ${letter} :
                        ${currentQuestion.answers[letter]}
                    </label>`
                );
            }
            
            output.push(
                `<div class="flex-root">
                    <div class="quiztion-flex">
                        <div class="question" style="display: none;" data-question-index="${questionNumber}"> 
                                ${currentQuestion.question} 
                        </div>
                        <div class="answers" data-question-index="${questionNumber}"> 
                            ${answers.join('')} 
                        </div>
                    </div>
                    <div class="image-container" data-question-index="${questionNumber}" style="display: none;">
                        ${currentQuestion.image ? `<img src="${currentQuestion.image}" alt="Question image" style="max-width: 100%; height: auto;">` : ''}
                    </div>
                </div>`
            );
        });
        quizContainer.innerHTML = output.join('');
        quizContainer.appendChild(prevButton);
        quizContainer.appendChild(nextButton);

        // Add event listener to images for zoom functionality
        document.querySelectorAll('.image-container img').forEach(img => {
            img.addEventListener('click', () => {
                img.classList.toggle('zoomed');
            });
        });
    }

    function showQuestion(index) {
        const questions = quizContainer.querySelectorAll('.question');
        const answers = quizContainer.querySelectorAll('.answers');
        const images = quizContainer.querySelectorAll('.image-container');

        questions.forEach((question, i) => {
            question.style.display = (i === index) ? 'block' : 'none';
        });

        answers.forEach((answer, i) => {
            answer.style.display = (i === index) ? 'flex' : 'none';
        });

        images.forEach((image, i) => {
            image.style.display = (i === index && image.innerHTML.trim() !== '') ? 'block' : 'none';
        });

        prevButton.style.display = (index === 0) ? 'none' : 'inline-block';
        nextButton.style.display = (index === questions.length - 1) ? 'none' : 'inline-block';
        submitButton.style.display = (index === questions.length - 1) ? 'block' : 'none';

        updateProgress();
    }

    function isAnswered(index) {
        const answerContainer = quizContainer.querySelector(`.answers[data-question-index="${index}"]`);
        const selectedOption = answerContainer.querySelector(`input[name="question${index}"]:checked`);
        return !!selectedOption;
    }

    function updateProgress() {
        const totalQuestions = myQuestions.length;
        const answered = document.querySelectorAll('.answers input:checked').length;
        const percentage = Math.round((answered / totalQuestions) * 100);
        
// تحديث نص النسبة
        progressDisplay.textContent = `Completed: ${percentage}%`;
        
// تحديث عرض شريط التقدم
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = `${percentage}%`;
    }

    nextButton.addEventListener('click', () => {
        if (currentQuestionIndex < myQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    });
    
    prevButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    function findFirstUnansweredQuestion() {
        const totalQuestions = myQuestions.length;
        for (let i = 0; i < totalQuestions; i++) {
            if (!isAnswered(i)) {
                return i; // إرجاع أول سؤال لم تتم الإجابة عليه
            }
        }
        return -1; // جميع الأسئلة مُجابة
    }    

    function showResults() {
        const answerContainers = quizContainer.querySelectorAll('.answers');
        let numCorrect = 0;
        const totalQuestions = 14;
        const testName = document.getElementById('testName').value.trim();
        const results = [];
    
        for (let questionNumber = 0; questionNumber < totalQuestions; questionNumber++) {
            const answerContainer = answerContainers[questionNumber];
            if (answerContainer) {
                const selector = `input[name="question${questionNumber}"]:checked`;
                const userAnswer = (answerContainer.querySelector(selector) || {}).value;
                const correctAnswer = myQuestions[questionNumber].correctAnswer;
    
                const questionText = myQuestions[questionNumber].question;
                const answers = Object.entries(myQuestions[questionNumber].answers).map(([key, value]) => {
                    return `<div>${key}: ${value}</div>`;
                }).join('');
    
                let resultText;
                if (userAnswer === correctAnswer) {
                    numCorrect++;
                    resultText = `<div class="question correct">
                        <p><strong>السؤال:</strong> ${questionText}</p>
                        <p><strong>الإجابات:</strong> ${answers}</p>
                        <p><strong>إجابتك:</strong> ${myQuestions[questionNumber].answers[userAnswer]}</p>
                        <p><strong>الإجابة الصحيحة:</strong> ${myQuestions[questionNumber].answers[correctAnswer]}</p>
                    </div>`;
                } else {
                    resultText = `<div class="question incorrect">
                        <p><strong>السؤال:</strong> ${questionText}</p>
                        <p><strong>الإجابات:</strong> ${answers}</p>
                        <p><strong>إجابتك:</strong> ${myQuestions[questionNumber].answers[userAnswer]}</p>
                        <p><strong>الإجابة الصحيحة:</strong> ${myQuestions[questionNumber].answers[correctAnswer]}</p>
                    </div>`;
                }
    
                results.push(resultText);
            } else {
                console.warn(`Answer container for question ${questionNumber} is missing.`);
            }
        }
    
        const percentage = Math.round((numCorrect / totalQuestions) * 100);
        const today = new Date().toISOString().split('T')[0];
        let studentProgress = JSON.parse(localStorage.getItem('studentProgress')) || {};
        if (!studentProgress[testName]) {
            studentProgress[testName] = {};
        }
        studentProgress[testName][today] = numCorrect;
    
        localStorage.setItem('studentProgress', JSON.stringify(studentProgress));
        localStorage.setItem('studentPercentage', percentage);
    
        // Save results in localStorage
        localStorage.setItem('testResults', JSON.stringify(results));
    
        // Redirect to results page
        window.location.href = '../statistics.html';
    }
    

    submitButton.addEventListener('click', () => {
        const firstUnansweredIndex = findFirstUnansweredQuestion();
        if (firstUnansweredIndex !== -1) {
            alert(`يرجى الإجابة على جميع الأسئلة. يتم الآن نقلك إلى السؤال ${firstUnansweredIndex + 1}.`);
            currentQuestionIndex = firstUnansweredIndex;
            showQuestion(currentQuestionIndex);
        } else {
            showResults();
        }
    });
});
