// app.js

let currentUser = null;

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    checkSession();
});

// Carregar dados iniciais
async function initializeData() {
    if (!localStorage.getItem('questions')) {
        const questions = await fetch('data/questions.json').then(res => res.json());
        localStorage.setItem('questions', JSON.stringify(questions));
    }
    
    if (!localStorage.getItem('users')) {
        const users = await fetch('data/users.json').then(res => res.json());
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    if (!localStorage.getItem('responses')) {
        localStorage.setItem('responses', JSON.stringify([]));
    }
}

// Verificar sessão ativa
function checkSession() {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        currentUser.role === 'admin' ? showAdminArea() : startQuiz(currentUser.area);
    }
}

// Sistema de Login
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const users = JSON.parse(localStorage.getItem('users'));

    if (users[username] && users[username].password === password) {
        currentUser = {
            username,
            role: users[username].role,
            area: users[username].area
        };
        
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        if (currentUser.role === 'admin') {
            showAdminArea();
        } else {
            startQuiz(currentUser.area);
        }
    } else {
        alert("Credenciais inválidas!");
    }
}

// Gerenciamento do Quiz
function startQuiz(area) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('quiz-title').textContent = `Quiz de ${area}`;

    const questions = JSON.parse(localStorage.getItem('questions'))[area];
    const selectedQuestions = questions.sort(() => Math.random() - 0.5).slice(0, 10);
    renderQuestions(selectedQuestions);
}

function renderQuestions(questions) {
    const container = document.getElementById('question-container');
    container.innerHTML = questions.map((q, index) => `
        <div class="question-card">
            <h3>${index + 1}. ${q.question}</h3>
            <div class="options">
                ${q.options.map((opt, i) => `
                    <label class="option"> <!-- Remova a classe 'correct' aqui -->
                        <input type="radio" name="q${index}" value="${i}">
                        ${opt}
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function submitQuiz() {
    const questions = JSON.parse(localStorage.getItem('questions'))[currentUser.area];
    let score = 0;
    const userResponse = [];

    questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected) {
            const selectedIndex = parseInt(selected.value);
            userResponse.push({
                question: q.question,
                selected: q.options[selectedIndex],
                correct: q.options[q.answer]
            });
            if (selectedIndex === q.answer) score++;
        }
    });

    saveResponse(score, userResponse);
    showResult(score, questions.length);
}

function saveResponse(score, answers) {
    const responses = JSON.parse(localStorage.getItem('responses'));
    responses.push({
        user: currentUser.username,
        area: currentUser.area,
        score,
        total: answers.length,
        date: new Date().toISOString(),
        answers
    });
    localStorage.setItem('responses', JSON.stringify(responses));
}

function showResult(score, total) {
    document.getElementById('quiz-container').style.display = 'none';
    const questions = JSON.parse(localStorage.getItem('questions'))[currentUser.area];
    const userAnswers = Array.from(document.querySelectorAll('input[type="radio"]:checked'));

    document.getElementById('result-container').innerHTML = `
        <div class="result-card">
            <h2>Resultado Final</h2>
            <p>Acertos: ${score}/${total}</p>
            <p>Percentual: ${((score / total) * 100).toFixed(1)}%</p>
            
            <div class="answers-review">
                ${questions.map((q, index) => {
                    const selected = userAnswers[index] ? parseInt(userAnswers[index].value) : null;
                    return `
                        <div class="question-review ${selected === q.answer ? 'correct' : 'incorrect'}">
                            <h4>Pergunta ${index + 1}: ${q.question}</h4>
                            <p>Sua resposta: ${selected !== null ? q.options[selected] : 'Nenhuma'}</p>
                            <p class="correct-answer">Resposta correta: ${q.options[q.answer]}</p>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <button onclick="location.reload()">Voltar</button>
        </div>
    `;
    document.getElementById('result-container').style.display = 'block';
}

// Painel Admin
function showAdminArea() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-container').style.display = 'block';
    renderAdminPanel();
}

function renderAdminPanel() {
    const container = document.getElementById('quiz-results');
    const questions = JSON.parse(localStorage.getItem('questions'));
    const responses = JSON.parse(localStorage.getItem('responses'));

    container.innerHTML = `
        <div class="admin-section">
            <h2>Gerenciar Perguntas</h2>
            ${Object.entries(questions).map(([area, qList]) => `
                <div class="question-area">
                    <h3>${area}</h3>
                    <button class="add-btn" onclick="addQuestion('${area}')">+ Nova Pergunta</button>
                    ${qList.map((q, i) => `
                        <div class="question-card">
                            <p>${q.question}</p>
                            <div class="options-grid">
                                ${q.options.map((opt, j) => `
                                    <div class="${j === q.answer ? 'correct' : ''}">${j + 1}. ${opt}</div>
                                `).join('')}
                            </div>
                            <div class="admin-actions">
                                <button onclick="editQuestion('${area}', ${i})">Editar</button>
                                <button class="delete" onclick="deleteQuestion('${area}', ${i})">Excluir</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>

        <div class="admin-section">
            <h2>Histórico de Respostas</h2>
            ${responses.map(res => `
                <div class="response-card">
                    <div class="response-header">
                        <span class="user">${res.user}</span>
                        <span class="area">${res.area}</span>
                        <span class="score">${res.score}/${res.total}</span>
                    </div>
                    ${res.answers.map(ans => `
                        <div class="answer ${ans.selected === ans.correct ? 'correct' : 'incorrect'}">
                            <p>${ans.question}</p>
                            <div class="answer-comparison">
                                <span>Sua resposta: ${ans.selected}</span>
                                <span>Resposta correta: ${ans.correct}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

// CRUD de Perguntas
function editQuestion(area, index) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    const q = questions[area][index];
    
    const newQuestion = prompt("Editar pergunta:", q.question);
    const newOptions = [];
    for (let i = 0; i < 4; i++) {
        newOptions.push(prompt(`Editar opção ${i + 1}:`, q.options[i]));
    }
    const newAnswer = parseInt(prompt("Índice da resposta correta (0-3):", q.answer));
    
    questions[area][index] = {
        question: newQuestion,
        options: newOptions,
        answer: newAnswer
    };
    
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

function addQuestion(area) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    const newQuestion = {
        question: prompt("Nova pergunta:"),
        options: Array.from({length: 4}, (_, i) => prompt(`Opção ${i + 1}:`)),
        answer: parseInt(prompt("Índice da resposta correta (0-3):"))
    };
    
    questions[area].push(newQuestion);
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

function deleteQuestion(area, index) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    questions[area].splice(index, 1);
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

// Event Listeners Globais
window.addEventListener('storage', () => {
    if (currentUser?.role === 'admin') renderAdminPanel();
    else if (currentUser) startQuiz(currentUser.area);
});

// Expor funções globais
window.login = login;
window.submitQuiz = submitQuiz;
window.editQuestion = editQuestion;
window.addQuestion = addQuestion;
window.deleteQuestion = deleteQuestion;