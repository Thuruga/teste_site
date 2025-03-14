function showRegister() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
}

// Mostrar tela de login
function showLogin() {
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
}

// Sistema de Cadastro
function register() {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const area = document.getElementById('new-area').value;
    const subarea = document.getElementById('new-subarea').value;
    if (!username || !password || !area || !subarea) {
        alert("Por favor, preencha todos os campos.");
        return;
    }
    const users = JSON.parse(localStorage.getItem('users'));
    if (users[username]) {
        alert("Usuário já existe!");
        return;
    }
    users[username] = {
        password,
        role: "user",
        area,
        subarea
    };
    localStorage.setItem('users', JSON.stringify(users));
    alert("Usuário cadastrado com sucesso!");
    showLogin();
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
            area: users[username].area,
            subarea: users[username].subarea
        };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (currentUser.role === 'admin') {
            showAdminArea();
        } else {
            startQuiz(currentUser.area, currentUser.subarea);
        }
    } else {
        alert("Credenciais inválidas!");
    }
}

// Expor funções globais
window.showRegister = showRegister;
window.showLogin = showLogin;
window.register = register;
window.login = login;