const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const app = express();

// Use a porta definida pelo Heroku ou 3000 para ambiente local
const port = process.env.PORT || 3000;

const saltRounds = 10;

// Configuração do CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de Sessões
app.use(session({
    secret: 'segredo-muito-seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Armazenamento de usuários e requisições (simulação de banco de dados)
const users = [];
const requests = []; // Armazena os pedidos de dias de folga

// Função para verificar se o usuário está logado
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).send('Login necessário.');
}

// Função para verificar se o usuário é administrador
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Acesso negado.');
}

// Redirecionar a raiz para a página de login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rota para servir a página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota de cadastro de usuário
app.post('/register', (req, res) => {
    let { username, password, role } = req.body;

    // Transformar o nome de usuário para minúsculas
    username = username.toLowerCase();

    // Verifica se o usuário já existe (também comparando em minúsculas)
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ message: 'Usuário já existe.' });
    }

    // Criptografar a senha antes de salvar
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao cadastrar o usuário.' });
        }

        // Salvar o novo usuário com senha criptografada
        users.push({ username, password: hash, role });
        res.json({ message: 'Usuário cadastrado com sucesso.' });
    });
});

// Rota para obter informações sobre o usuário logado
app.get('/get-user', (req, res) => {
    if (req.session.user) {
        res.json({
            username: req.session.user.username,
            role: req.session.user.role,
            isLoggedIn: true
        });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// Rota de Login
app.post('/login', (req, res) => {
    let { username, password } = req.body;
    username = username.toLowerCase();

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).send('Usuário ou senha incorretos.');
    }

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            req.session.user = { username: user.username, role: user.role };
            res.send('Login bem-sucedido.');
        } else {
            res.status(401).send('Usuário ou senha incorretos.');
        }
    });
});

// Rota para fazer logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logout realizado com sucesso.');
});

// Rota para acessar a página de upload (somente para admin)
app.get('/upload', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Rota para fazer upload do arquivo CSV (somente admin)
app.post('/upload', isAdmin, multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, 'agenda.csv')
    })
}).single('file'), (req, res) => {
    res.send('Arquivo carregado com sucesso.');
});

// Rota para acessar a página principal (para usuários comuns)
app.get('/index', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para obter o conteúdo do CSV (para exibição)
app.get('/data', isAuthenticated, (req, res) => {
    fs.readFile('uploads/agenda.csv', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Erro ao ler o arquivo.');
        }
        res.send(data);
    });
});

// Rota para acessar a página de "Request Days Off" (usuários comuns)
app.get('/request-days-off', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'request.html'));
});

// Rota para submeter uma solicitação de dias de folga (usuários comuns)
app.post('/submit-request', isAuthenticated, (req, res) => {
    const { daysRequested, reason } = req.body;
    const user = req.session.user.username;

    const newRequest = {
        id: Date.now(), // ID único
        user,
        daysRequested,
        reason,
        status: 'Pending' // Status inicial como pendente
    };

    requests.push(newRequest);
    res.json({ message: 'Request submitted successfully.' });
});

// Rota para o usuário ver suas solicitações de folga e status
app.get('/user/requests', isAuthenticated, (req, res) => {
    const user = req.session.user.username;
    const userRequests = requests.filter(r => r.user === user);
    res.json({ userRequests });
});

// Rota para o admin ver todas as solicitações de dias de folga
app.get('/admin/requests', isAdmin, (req, res) => {
    res.json({ requests });
});

// Rota para aprovar uma solicitação
app.post('/admin/approve/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    const request = requests.find(r => r.id === parseInt(id));
    if (request) {
        request.status = 'Approved';
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Rota para negar uma solicitação
app.post('/admin/deny/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    const request = requests.find(r => r.id === parseInt(id));
    if (request) {
        request.status = 'Denied';
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

