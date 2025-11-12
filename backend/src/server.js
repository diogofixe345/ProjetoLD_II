// server.js

const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT"],
        credentials: true, // ESSENCIAL para a sessão funcionar entre domínios/portas
    })
);
app.use(cookieParser());

app.use(
    session({
        key: "utilizador",
        secret: "subscribe",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 24 * 60 * 60 * 1000, 
        },
    })
);
app.use(bodyParser.urlencoded({ extended: true }));

// Conexão à base de dados
const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "", // Sua password
    database: "itasks",
});

// ===============================
// 🛡️ MIDDLEWARE DE SEGURANÇA
// ===============================

const verificarAutenticacao = (req, res, next) => {
    if (req.session.user) {
        next(); 
    } else {
        res.status(401).json({ message: "Não autenticado. Faça login para continuar." });
    }
};

const verificarGestor = (req, res, next) => {
    if (req.session.user && req.session.user.Papel === 'Gestor') {
        next();
    } else {
        res.status(403).json({ message: "Acesso negado. Apenas Gestores podem realizar esta operação." });
    }
};

// ===============================
// 🔐 LOGIN E REGISTO DE UTILIZADORES
// ===============================

// server.js (Substituir app.post("/register", ...) )

app.post("/register", (req, res) => {
    const { Nome, Username, Password, Papel } = req.body; // 🔑 Recebe Papel

    // 1. Verificar se o Username já existe
    db.query("SELECT * FROM Utilizador WHERE Username = ?", [Username], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Erro interno do servidor." });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: "Username já registado." });
        }

        // 2. Hash da Password
        bcrypt.hash(Password, saltRounds, (err, hash) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Erro interno do servidor." });
            }

            // 3. Inserir na tabela Utilizador
            db.query(
                "INSERT INTO Utilizador (Nome, Username, Password) VALUES (?,?,?)",
                [Nome, Username, hash],
                (err, userResult) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: "Erro ao registar Utilizador." });
                    }
                    
                    const newUserId = userResult.insertId;
                    let roleSql = "";
                    let roleValues = [newUserId];

                    // 4. Inserir na tabela de Papel (Gestor ou Programador)
                    if (Papel === 'Gestor') {
                        // Inserir apenas o ID na tabela Gestor
                        roleSql = "INSERT INTO Gestor (Id) VALUES (?)";
                        // Note: Departamento e GereUtilizadores terão valores padrão se não forem fornecidos
                    } else if (Papel === 'Programador') {
                        // Inserir ID na tabela Programador (IdGestor é NULL por padrão ou precisa ser definido)
                        // Para simplificar, assumimos que IdGestor pode ser NULL no registo inicial
                        roleSql = "INSERT INTO Programador (Id) VALUES (?)";
                    } else {
                        return res.status(400).json({ message: "Papel inválido." });
                    }

                    db.query(roleSql, roleValues, (err) => {
                        if (err) {
                            console.log(err);
                            // IMPORTANTE: Idealmente, aqui deveria haver um ROLLBACK do Utilizador criado
                            return res.status(500).json({ message: "Erro ao definir o papel do utilizador." });
                        }
                        res.status(201).json({ message: `Utilizador registado com sucesso como ${Papel}.` });
                    });
                }
            );
        });
    });
});

app.post("/login", (req, res) => {
    const { Username, Password } = req.body;

    // QUERY ATUALIZADA: Junta Utilizador com Gestor e Programador para definir o Papel
    const sql = `
        SELECT 
            U.*, 
            CASE 
                WHEN G.Id IS NOT NULL THEN 'Gestor' 
                WHEN P.Id IS NOT NULL THEN 'Programador'
                ELSE 'Indefinido'
            END AS Papel,
            P.IdGestor AS GeridoPorGestorId
        FROM Utilizador U
        LEFT JOIN Gestor G ON U.Id = G.Id
        LEFT JOIN Programador P ON U.Id = P.Id
        WHERE U.Username = ?
    `;

    db.query(sql, Username, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Erro interno do servidor.");
        }

        if (result.length > 0) {
            bcrypt.compare(Password, result[0].Password, (error, response) => {
                if (response) {
                    const user = result[0];
                    delete user.Password; 
                    req.session.user = user; 
                    
                    // Retorna o objeto completo (agora com a propriedade Papel)
                    return res.status(200).send(user); 
                } else {
                    return res.status(401).send({ message: "Username ou Password incorretos." });
                }
            });
        } else {
            return res.status(404).send({ message: "Utilizador não existente." });
        }
    });
});

app.get("/loginStatus", verificarAutenticacao, (req, res) => {
    const user = req.session.user;
    delete user.Password;
    res.send({ loggedIn: true, user: user });
});

// ===============================
// 🧩 ROTAS DAS TAREFAS (TASKS)
// ===============================

// ➕ Criar nova tarefa (Apenas Gestor)
// server.js (Modificação na rota GET /tarefas)

app.get("/tarefas", (req, res) => {
    // Usar LEFT JOINs para garantir que as tarefas são listadas,
    // mesmo que os nomes de Gestor/Programador estejam em falta.
    const sql = `
        SELECT T.*, 
               UP.Nome AS NomeProgramador, 
               UG.Nome AS NomeGestor, 
               TT.Nome AS Tipo
        FROM Tarefa T
        LEFT JOIN Utilizador UP ON T.IdProgramador = UP.Id
        LEFT JOIN Utilizador UG ON T.IdGestor = UG.Id
        LEFT JOIN TipoTarefa TT ON T.IdTipoTarefa = TT.Id
        ORDER BY T.OrdemExecucao ASC
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao listar tarefas:", err);
            // Devolve 500, mas com o erro, para debugging
            return res.status(500).json({ message: "Erro ao listar tarefas." }); 
        }
        // console.log("Dados da API:", result); // Descomente para verificar no console do servidor
        res.json(result);
    });
});

// 📋 Obter todas as tarefas (Query de JOIN corrigida para usar o modelo de herança)
app.get("/tarefas", (req, res) => {
    const sql = `
        SELECT T.*, 
               UP.Nome AS NomeProgramador, 
               UG.Nome AS NomeGestor, 
               TT.Nome AS Tipo
        FROM Tarefa T
        JOIN Utilizador UP ON T.IdProgramador = UP.Id
        JOIN Utilizador UG ON T.IdGestor = UG.Id
        JOIN TipoTarefa TT ON T.IdTipoTarefa = TT.Id
        ORDER BY T.OrdemExecucao ASC
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao listar tarefas:", err);
            return res.status(500).json({ message: "Erro ao listar tarefas." });
        }
        res.json(result);
    });
});


app.put("/tarefas/:id/estado", verificarAutenticacao, (req, res) => {
    const { id } = req.params;
    const { novoEstado } = req.body;

    // 1. Verificar o estado atual
    db.query("SELECT EstadoAtual FROM Tarefa WHERE Id = ?", [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro ao verificar tarefa." });
        }
        if (result.length === 0) return res.status(404).json({ message: "Tarefa não encontrada." });

        const estadoAtual = result[0].EstadoAtual;
        // Impedir alterações se já estiver Done (exceto se for para reafirmar Done)
        if (estadoAtual === "Done" && novoEstado !== "Done") {
            return res.status(400).json({ message: "Tarefas concluídas não podem ser alteradas." });
        }

        // 2. Atualizar o Estado
        db.query("UPDATE Tarefa SET EstadoAtual = ? WHERE Id = ?", [novoEstado, id], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Erro ao atualizar estado." });
            }

            // 3. Atualizar Data Real de Início/Fim (assíncrono)
            if (novoEstado === "Doing") {
                // Não precisa de callback aqui, pois o sucesso já foi reportado
                db.query("UPDATE Tarefa SET DataRealInicio = CURDATE() WHERE Id = ?", [id]);
            } else if (novoEstado === "Done") {
                // Não precisa de callback aqui
                db.query("UPDATE Tarefa SET DataRealFim = CURDATE() WHERE Id = ?", [id]);
            }

            // 4. Reportar sucesso
            res.json({ message: "Estado atualizado com sucesso." });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor à escuta na porta ${PORT}`);
});