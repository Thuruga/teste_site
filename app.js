let currentUser = null;
let currentQuestionIndex = 0;
let selectedQuestions = [];

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente carregado");
    initializeData();
    checkSession();
});

// Carregar dados iniciais
async function initializeData() {
    if (!localStorage.getItem('questions')) {
        const questions = await fetch('data/questions.json').then(res => res.json());
        localStorage.setItem('questions', JSON.stringify(questions));
        console.log("Perguntas carregadas e salvas no localStorage");
    }
    if (!localStorage.getItem('users')) {
        const users = {
            "admin": {
                "password": "admin123",
                "role": "admin"
            },
            "teste1": {
                "password": "teste123",
                "role": "user",
                "area": "Eletronicas",
                "subarea": "Adult Care"
            },
            "teste2": {
                "password": "teste456",
                "role": "user",
                "area": "Mecânicas",
                "subarea": "PH"
            }
        };
        localStorage.setItem('users', JSON.stringify(users));
        console.log("Usuários carregados e salvos no localStorage");
    }
    if (!localStorage.getItem('responses')) {
        localStorage.setItem('responses', JSON.stringify([]));
        console.log("Respostas inicializadas no localStorage");
    }
}

// Verificar sessão ativa
function checkSession() {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        console.log("Usuário atual:", currentUser);
        if (currentUser.role === 'admin') {
            showAdminArea();
        } else {
            startQuiz(currentUser.area, currentUser.subarea);
        }
    } else {
        console.log("Nenhuma sessão ativa encontrada");
    }
}

// Gerenciamento do Quiz
function startQuiz(area, subarea) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('quiz-title').textContent = `Quiz de ${area} - ${subarea}`;
    
    const questions = JSON.parse(localStorage.getItem('questions'));
    if (questions && questions[area] && questions[area][subarea]) {
        // Selecionar 6 perguntas da área específica do usuário
        const specificQuestions = questions[area][subarea].sort(() => Math.random() - 0.5).slice(0, 6);
        
        // Selecionar 4 perguntas gerais da especialidade
        const generalQuestions = questions[area].general.sort(() => Math.random() - 0.5).slice(0, 4);
        
        // Combinar as perguntas específicas e gerais
        selectedQuestions = [...specificQuestions, ...generalQuestions].sort(() => Math.random() - 0.5);
        
        console.log("Perguntas selecionadas para o quiz:", selectedQuestions);
        renderQuestion();
    } else {
        console.error(`Perguntas não encontradas para ${area} - ${subarea}`);
    }
}

function renderQuestion() {
    const container = document.getElementById('question-container');
    const q = selectedQuestions[currentQuestionIndex];
    container.innerHTML = `
        <div class="question-card">
            <h3>${currentQuestionIndex + 1}. ${q.question}</h3>
            <div class="options">
                ${q.options.map((opt, i) => `
                    <label class="option">
                        <input type="radio" name="q${currentQuestionIndex}" value="${i}">
                        ${opt}
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    updateNavigationButtons();
}

function nextQuestion() {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function updateNavigationButtons() {
    document.getElementById('prev-button').style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    document.getElementById('next-button').style.display = currentQuestionIndex < selectedQuestions.length - 1 ? 'inline-block' : 'none';
}

function submitQuiz() {
    const questions = JSON.parse(localStorage.getItem('questions'))[currentUser.area][currentUser.subarea];
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
    const responses = JSON.parse(localStorage.getItem('responses')) || [];
    responses.push({
        user: currentUser.username,
        area: currentUser.area,
        subarea: currentUser.subarea,
        score,
        total: answers.length,
        date: new Date().toISOString(),
        answers
    });
    localStorage.setItem('responses', JSON.stringify(responses));
}

function showResult(score, total) {
    document.getElementById('quiz-container').style.display = 'none';
    const questions = JSON.parse(localStorage.getItem('questions'))[currentUser.area][currentUser.subarea];
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
    const questions = JSON.parse(localStorage.getItem('questions')) || {};
    const responses = JSON.parse(localStorage.getItem('responses')) || [];
    
    if (!questions) {
        console.error("Perguntas não encontradas no localStorage");
        return;
    }

    container.innerHTML = `
        <div class="admin-section">
            <h2>Gerenciar Perguntas</h2>
            ${Object.entries(questions).map(([area, subareas]) => `
                <div class="question-area">
                    <h3>${area}</h3>
                    <button class="add-btn" onclick="addGeneralQuestion('${area}')">+ Nova Pergunta Geral</button>
                    ${Object.entries(subareas).map(([subarea, qList]) => {
                        if (!Array.isArray(qList)) {
                            console.error(`qList não é um array para ${area} - ${subarea}`, qList);
                            return '';
                        }
                        return `
                            <div class="subarea">
                                <h4>${subarea}</h4>
                                <button class="add-btn" onclick="addQuestion('${area}', '${subarea}')">+ Nova Pergunta</button>
                                ${qList.map((q, i) => `
                                    <div class="question-card">
                                        <p>${q.question}</p>
                                        <div class="options-grid">
                                            ${q.options.map((opt, j) => `
                                                <div class="${j === q.answer ? 'correct' : ''}">${j + 1}. ${opt}</div>
                                            `).join('')}
                                        </div>
                                        <div class="admin-actions">
                                            <button onclick="editQuestion('${area}', '${subarea}', ${i})">Editar</button>
                                            <button class="delete" onclick="deleteQuestion('${area}', '${subarea}', ${i})">Excluir</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }).join('')}
                    <div class="general-questions">
                        <h4>Perguntas Gerais</h4>
                        ${questions[area].general ? questions[area].general.map((q, i) => `
                            <div class="question-card">
                                <p>${q.question}</p>
                                <div class="options-grid">
                                    ${q.options.map((opt, j) => `
                                        <div class="${j === q.answer ? 'correct' : ''}">${j + 1}. ${opt}</div>
                                    `).join('')}
                                </div>
                                <div class="admin-actions">
                                    <button onclick="editGeneralQuestion('${area}', ${i})">Editar</button>
                                    <button class="delete" onclick="deleteGeneralQuestion('${area}', ${i})">Excluir</button>
                                </div>
                            </div>
                        `).join('') : '<p>Nenhuma pergunta geral encontrada.</p>'}
                    </div>
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
                        <span class="subarea">${res.subarea}</span>
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
    console.log("Painel do administrador renderizado");
}
// CRUD de Perguntas
function editQuestion(area, subarea, index) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    const q = questions[area][subarea][index];
    const newQuestion = prompt("Editar pergunta:", q.question);
    const newOptions = [];
    for (let i = 0; i < 4; i++) {
        newOptions.push(prompt(`Editar opção ${i + 1}:`, q.options[i]));
    }
    const newAnswer = parseInt(prompt("Índice da resposta correta (0-3):", q.answer));
    questions[area][subarea][index] = {
        question: newQuestion,
        options: newOptions,
        answer: newAnswer
    };
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

function addQuestion(area, subarea) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    const newQuestion = {
        question: prompt("Nova pergunta:"),
        options: Array.from({length: 4}, (_, i) => prompt(`Opção ${i + 1}:`)),
        answer: parseInt(prompt("Índice da resposta correta (0-3):"))
    };
    questions[area][subarea].push(newQuestion);
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

function addGeneralQuestion(area) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    const newQuestion = {
        question: prompt("Nova pergunta geral:"),
        options: Array.from({length: 4}, (_, i) => prompt(`Opção ${i + 1}:`)),
        answer: parseInt(prompt("Índice da resposta correta (0-3):"))
    };
    questions[area].general.push(newQuestion);
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

function editGeneralQuestion(area, index) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    const q = questions[area].general[index];
    const newQuestion = prompt("Editar pergunta geral:", q.question);
    const newOptions = [];
    for (let i = 0; i < 4; i++) {
        newOptions.push(prompt(`Editar opção ${i + 1}:`, q.options[i]));
    }
    const newAnswer = parseInt(prompt("Índice da resposta correta (0-3):", q.answer));
    questions[area].general[index] = {
        question: newQuestion,
        options: newOptions,
        answer: newAnswer
    };
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

function deleteGeneralQuestion(area, index) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    questions[area].general.splice(index, 1);
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

function deleteQuestion(area, subarea, index) {
    const questions = JSON.parse(localStorage.getItem('questions'));
    questions[area][subarea].splice(index, 1);
    localStorage.setItem('questions', JSON.stringify(questions));
    renderAdminPanel();
}

// Event Listeners Globais
window.addEventListener('storage', () => {
    if (currentUser?.role === 'admin') renderAdminPanel();
    else if (currentUser) startQuiz(currentUser.area, currentUser.subarea);
});

// Expor funções globais
window.submitQuiz = submitQuiz;
window.editQuestion = editQuestion;
window.addQuestion = addQuestion;
window.deleteQuestion = deleteQuestion;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
