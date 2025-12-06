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
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
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

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "", 
    database: "itasks",
});

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


app.post("/register", (req, res) => {
    const { Nome, Username, Password, Papel } = req.body;

    db.query("SELECT * FROM Utilizador WHERE Username = ?", [Username], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Erro interno do servidor." });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: "Username já registado." });
        }

        bcrypt.hash(Password, saltRounds, (err, hash) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Erro interno do servidor." });
            }

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

                    if (Papel === 'Gestor') {
                        roleSql = "INSERT INTO Gestor (Id) VALUES (?)";
                    } else if (Papel === 'Programador') {
                        roleSql = "INSERT INTO Programador (Id) VALUES (?)";
                    } else {
                        return res.status(400).json({ message: "Papel inválido." });
                    }

                    db.query(roleSql, roleValues, (err) => {
                        if (err) {
                            console.log(err);
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


app.post("/tarefas", verificarAutenticacao, verificarGestor, (req, res) => {

    const { IdProgramador, OrdemExecucao, Descricao, DataPrevistaInicio, DataPrevistaFim, IdTipoTarefa, StoryPoints } = req.body;
    const gestorIdDaSessao = req.session.user.Id;

    const sql = `
        INSERT INTO Tarefa (IdGestor, IdProgramador, OrdemExecucao, Descricao, DataPrevistaInicio, DataPrevistaFim, IdTipoTarefa, StoryPoints, EstadoAtual)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ToDo')
    `;
    db.query(sql, [gestorIdDaSessao, IdProgramador, OrdemExecucao, Descricao, DataPrevistaInicio, DataPrevistaFim, IdTipoTarefa, StoryPoints], (err, result) => {
        if (err) {
            console.error("Erro ao criar tarefa:", err);
            return res.status(500).json({ message: "Erro ao criar tarefa." });
        }
        res.status(201).json({ message: "Tarefa criada com sucesso.", id: result.insertId });
    });
});

app.get("/tarefas", (req, res) => {
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
            return res.status(500).json({ message: "Erro ao listar tarefas." }); 
        }
        res.json(result);
    });
});


app.put("/tarefas/:id/estado", verificarAutenticacao, (req, res) => {
    const { id } = req.params;
    const { novoEstado } = req.body;

    db.query("SELECT EstadoAtual FROM Tarefa WHERE Id = ?", [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro ao verificar tarefa." });
        }
        if (result.length === 0) return res.status(404).json({ message: "Tarefa não encontrada." });

        const estadoAtual = result[0].EstadoAtual;
        if (estadoAtual === "Done" && novoEstado !== "Done") {
            return res.status(400).json({ message: "Tarefas concluídas não podem ser alteradas." });
        }

        db.query("UPDATE Tarefa SET EstadoAtual = ? WHERE Id = ?", [novoEstado, id], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Erro ao atualizar estado." });
            }

            if (novoEstado === "Doing") {
                db.query("UPDATE Tarefa SET DataRealInicio = CURDATE() WHERE Id = ?", [id]);
            } else if (novoEstado === "Done") {
                db.query("UPDATE Tarefa SET DataRealFim = CURDATE() WHERE Id = ?", [id]);
            }

            res.json({ message: "Estado atualizado com sucesso." });
        });
    });
});

app.delete("/tarefas/:id", verificarAutenticacao, verificarGestor, (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM Tarefa WHERE Id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao eliminar tarefa:", err);
            return res.status(500).json({ message: "Erro ao eliminar tarefa." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }
        res.json({ message: "Tarefa eliminada com sucesso." });
    });
});


// 1. Rota para obter uma tarefa específica pelo ID (para preencher o formulário de edição)
app.get("/tarefas/:id", verificarAutenticacao, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM Tarefa WHERE Id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao obter tarefa:", err);
            return res.status(500).json({ message: "Erro ao obter tarefa." });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }
        res.json(result[0]);
    });
});

// 2. Rota para atualizar os dados da tarefa (PUT)
app.put("/tarefas/:id", verificarAutenticacao, verificarGestor, (req, res) => {
    const { id } = req.params;
    const { Descricao, IdProgramador, OrdemExecucao, DataPrevistaInicio, DataPrevistaFim, IdTipoTarefa, StoryPoints } = req.body;

    const sql = `
        UPDATE Tarefa 
        SET Descricao = ?, 
            IdProgramador = ?, 
            OrdemExecucao = ?, 
            DataPrevistaInicio = ?, 
            DataPrevistaFim = ?, 
            IdTipoTarefa = ?, 
            StoryPoints = ?
        WHERE Id = ?
    `;

    const values = [Descricao, IdProgramador, OrdemExecucao, DataPrevistaInicio, DataPrevistaFim, IdTipoTarefa, StoryPoints, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Erro ao atualizar tarefa:", err);
            return res.status(500).json({ message: "Erro ao atualizar tarefa." });
        }
        res.json({ message: "Tarefa atualizada com sucesso." });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor à escuta na porta ${PORT}`);
});