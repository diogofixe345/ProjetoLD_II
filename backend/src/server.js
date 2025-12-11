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
    const { Nome, Username, Password, Papel, NivelExperiencia, Departamento } = req.body;
    
    const utilizadorLogado = req.session.user;

    if (Papel === 'Programador') {
        if (!utilizadorLogado || utilizadorLogado.Papel !== 'Gestor') {
            return res.status(403).json({ message: "Apenas Gestores podem registar Programadores." });
        }
        if (!NivelExperiencia) {
            return res.status(400).json({ message: "O campo Nível de Experiência é obrigatório para programadores." });
        }
    } 
    else if (Papel === 'Gestor') {
        if (!Departamento) {
            return res.status(400).json({ message: "O campo Departamento é obrigatório para gestores." });
        }
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: "Erro de transação." });

        db.query("SELECT * FROM Utilizador WHERE Username = ?", [Username], (err, result) => {
            if (err) return db.rollback(() => res.status(500).json({ message: "Erro no servidor." }));
            if (result.length > 0) return db.rollback(() => res.status(400).json({ message: "Username já registado." }));

            bcrypt.hash(Password, saltRounds, (err, hash) => {
                if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao encriptar senha." }));

                db.query(
                    "INSERT INTO Utilizador (Nome, Username, Password) VALUES (?,?,?)",
                    [Nome, Username, hash],
                    (err, userResult) => {
                        if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao criar utilizador." }));
                        
                        const newUserId = userResult.insertId;

                        if (Papel === 'Gestor') {
                            db.query(
                                "INSERT INTO Gestor (Id, GereUtilizadores, Departamento) VALUES (?, 0, ?)", 
                                [newUserId, Departamento], 
                                (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao criar Gestor." }));
                                    
                                    db.commit(err => {
                                        if (err) return db.rollback(() => res.status(500).json({ message: "Erro no commit." }));
                                        res.status(201).json({ message: "Gestor registado com sucesso." });
                                    });
                                }
                            );

                        } else if (Papel === 'Programador') {
                            const idGestorCriador = utilizadorLogado.Id;
                            
                            db.query(
                                "INSERT INTO Programador (Id, IdGestor, NivelExperiencia) VALUES (?, ?, ?)", 
                                [newUserId, idGestorCriador, NivelExperiencia], 
                                (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao criar Programador." }));

                                    db.query(
                                        "UPDATE Gestor SET GereUtilizadores = GereUtilizadores + 1 WHERE Id = ?",
                                        [idGestorCriador],
                                        (err) => {
                                            if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao atualizar contador." }));

                                            db.commit(err => {
                                                if (err) return db.rollback(() => res.status(500).json({ message: "Erro no commit." }));
                                                res.status(201).json({ message: "Programador criado e afiliado com sucesso." });
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            });
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
    const { 
        IdProgramador, 
        OrdemExecucao, 
        Descricao, 
        DataPrevistaInicio, 
        DataPrevistaFim, 
        DataRealInicio, 
        DataRealFim,    
        IdTipoTarefa, 
        StoryPoints 
    } = req.body;
    
    const gestorIdDaSessao = req.session.user.Id;
    const sqlCheck = "SELECT Id FROM Tarefa WHERE IdProgramador = ? AND OrdemExecucao = ?";

    db.query(sqlCheck, [IdProgramador, OrdemExecucao], (err, result) => {
        if (err) {
            console.error("Erro ao verificar ordem:", err);
            return res.status(500).json({ message: "Erro interno ao validar dados." });
        }

        if (result.length > 0) {
            return res.status(400).json({ 
                message: `O programador já tem uma tarefa definida para a Ordem de Execução ${OrdemExecucao}. Escolha outra ordem.` 
            });
        }

        const sqlInsert = `
            INSERT INTO Tarefa (
                IdGestor, 
                IdProgramador, 
                OrdemExecucao, 
                Descricao, 
                DataPrevistaInicio, 
                DataPrevistaFim, 
                DataRealInicio, 
                DataRealFim, 
                IdTipoTarefa, 
                StoryPoints, 
                EstadoAtual
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ToDo')
        `;

        db.query(sqlInsert, [
            gestorIdDaSessao, 
            IdProgramador, 
            OrdemExecucao, 
            Descricao, 
            DataPrevistaInicio, 
            DataPrevistaFim, 
            DataRealInicio || null, 
            DataRealFim || null,    
            IdTipoTarefa, 
            StoryPoints
        ], (err, resultInsert) => {
            if (err) {
                console.error("Erro ao criar tarefa:", err);
                return res.status(500).json({ message: "Erro ao criar tarefa." });
            }
            res.status(201).json({ message: "Tarefa criada com sucesso.", id: resultInsert.insertId });
        });
    });
});

app.get("/tarefas", verificarAutenticacao, (req, res) => {
    const user = req.session.user;

    let sql = `
        SELECT T.*, 
               UP.Nome AS NomeProgramador, 
               UG.Nome AS NomeGestor, 
               TT.Nome AS Tipo
        FROM Tarefa T
        LEFT JOIN Utilizador UP ON T.IdProgramador = UP.Id
        LEFT JOIN Utilizador UG ON T.IdGestor = UG.Id
        LEFT JOIN TipoTarefa TT ON T.IdTipoTarefa = TT.Id
    `;

    const params = [];

    if (user.Papel === 'Gestor') {

        sql += " WHERE T.IdGestor = ?";
        params.push(user.Id);
    } else if (user.Papel === 'Programador') {

        sql += " WHERE T.IdGestor = (SELECT IdGestor FROM Programador WHERE Id = ?)";
        params.push(user.Id);
    }
    
    sql += " ORDER BY T.OrdemExecucao ASC";

    db.query(sql, params, (err, result) => {
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

    if (!['ToDo', 'Doing', 'Done'].includes(novoEstado)) {
        return res.status(400).json({ message: "Estado inválido." });
    }

    db.query("SELECT * FROM Tarefa WHERE Id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Erro ao verificar tarefa." });
        if (result.length === 0) return res.status(404).json({ message: "Tarefa não encontrada." });

        const tarefa = result[0];


        if (novoEstado === 'Doing') {

            const sqlCount = "SELECT COUNT(*) AS total FROM Tarefa WHERE IdProgramador = ? AND EstadoAtual = 'Doing' AND Id != ?";
            
            db.query(sqlCount, [tarefa.IdProgramador, id], (err, countResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Erro ao verificar limite de tarefas." });
                }

                if (countResult[0].total >= 2) {
                    return res.status(400).json({ 
                        message: "O programador já tem 2 tarefas em curso. Termine uma antes de iniciar outra." 
                    });
                }

                const checkSql = `
                    SELECT Id, OrdemExecucao FROM Tarefa 
                    WHERE IdProgramador = ? 
                    AND OrdemExecucao < ? 
                    AND EstadoAtual != 'Done'
                `;
                
                db.query(checkSql, [tarefa.IdProgramador, tarefa.OrdemExecucao], (err, tarefasPendentes) => {
                    if (err) return res.status(500).json({ message: "Erro ao validar prioridades." });
                    
                    if (tarefasPendentes.length > 0) {
                        const ordemPendente = Math.min(...tarefasPendentes.map(t => t.OrdemExecucao));
                        return res.status(400).json({ 
                            message: `Não pode iniciar esta tarefa (Ordem ${tarefa.OrdemExecucao}). Termine primeiro a tarefa de ordem ${ordemPendente}.` 
                        });
                    }
                    
                    executarUpdate();
                });
            });

        } else {
            executarUpdate();
        }

        function executarUpdate() {
            let sql = "UPDATE Tarefa SET EstadoAtual = ?";
            let params = [novoEstado];

            if (novoEstado === "ToDo") {
                sql += ", DataRealInicio = NULL, DataRealFim = NULL";
            } 
            else if (novoEstado === "Doing") {
                sql += ", DataRealInicio = IFNULL(DataRealInicio, CURDATE()), DataRealFim = NULL";
            } 
            else if (novoEstado === "Done") {

                sql += ", DataRealFim = CURDATE()";
            }

            sql += " WHERE Id = ?";
            params.push(id);

            db.query(sql, params, (err) => {
                if (err) {
                    console.error("Erro no Update:", err);
                    return res.status(500).json({ message: "Erro ao atualizar estado." });
                }
                res.json({ message: "Estado atualizado com sucesso." });
            });
        }
    });
});

app.delete("/tarefas/:id", verificarAutenticacao, verificarGestor, (req, res) => {
    const { id } = req.params;

    db.query("SELECT EstadoAtual FROM Tarefa WHERE Id = ?", [id], (err, result) => {
        if (err) {
            console.error("Erro ao verificar tarefa:", err);
            return res.status(500).json({ message: "Erro interno." });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }

        if (result[0].EstadoAtual !== 'Done') {
            return res.status(400).json({ message: "Apenas tarefas concluídas (Done) podem ser eliminadas." });
        }

        const sql = "DELETE FROM Tarefa WHERE Id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("Erro ao eliminar tarefa:", err);
                return res.status(500).json({ message: "Erro ao eliminar tarefa." });
            }
            res.json({ message: "Tarefa eliminada com sucesso." });
        });
    });
});


app.get("/tarefas/:id", verificarAutenticacao, (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT T.*, 
               UP.Nome AS NomeProgramador, 
               UG.Nome AS NomeGestor, 
               TT.Nome AS Tipo
        FROM Tarefa T
        LEFT JOIN Utilizador UP ON T.IdProgramador = UP.Id
        LEFT JOIN Utilizador UG ON T.IdGestor = UG.Id
        LEFT JOIN TipoTarefa TT ON T.IdTipoTarefa = TT.Id
        WHERE T.Id = ?
    `;
    
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

app.get("/meus-programadores", verificarAutenticacao, verificarGestor, (req, res) => {
    const gestorId = req.session.user.Id;

    const sql = `
        SELECT U.Id, U.Nome 
        FROM Programador P
        JOIN Utilizador U ON P.Id = U.Id
        WHERE P.IdGestor = ?
    `;

    db.query(sql, [gestorId], (err, result) => {
        if (err) {
            console.error("Erro ao buscar programadores:", err);
            return res.status(500).json({ message: "Erro ao buscar programadores." });
        }
        res.json(result);
    });
});


app.get("/gerir-programadores", verificarAutenticacao, verificarGestor, (req, res) => {
    const gestorId = req.session.user.Id;
    
    const sql = `
        SELECT U.Id, U.Nome, U.Username, P.NivelExperiencia 
        FROM Programador P
        JOIN Utilizador U ON P.Id = U.Id
        WHERE P.IdGestor = ?
    `;

    db.query(sql, [gestorId], (err, result) => {
        if (err) {
            console.error("Erro SQL:", err);
            return res.status(500).json({ message: "Erro ao carregar a equipa." });
        }
        res.json(result);
    });
});

app.put("/programadores/:id", verificarAutenticacao, verificarGestor, (req, res) => {
    const { id } = req.params;
    const { Nome, NivelExperiencia } = req.body;
    const gestorId = req.session.user.Id;

    db.query("SELECT Id FROM Programador WHERE Id = ? AND IdGestor = ?", [id, gestorId], (err, result) => {
        if (err) return res.status(500).json({ message: "Erro no servidor." });
        if (result.length === 0) return res.status(403).json({ message: "Não tem permissão para editar este utilizador." });

        db.beginTransaction(err => {
            if (err) return res.status(500).send(err);

            db.query("UPDATE Programador SET NivelExperiencia = ? WHERE Id = ?", [NivelExperiencia, id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao atualizar nível." }));

                db.query("UPDATE Utilizador SET Nome = ? WHERE Id = ?", [Nome, id], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao atualizar nome." }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).send(err));
                        res.json({ message: "Programador atualizado com sucesso!" });
                    });
                });
            });
        });
    });
});

app.delete("/programadores/:id", verificarAutenticacao, verificarGestor, (req, res) => {
    const { id } = req.params;
    const gestorId = req.session.user.Id;

    db.query("SELECT Id FROM Programador WHERE Id = ? AND IdGestor = ?", [id, gestorId], (err, result) => {
        if (err) return res.status(500).json({ message: "Erro interno." });
        if (result.length === 0) return res.status(403).json({ message: "Não tem permissão ou utilizador não encontrado." });

        db.beginTransaction(err => {
            if (err) return res.status(500).send(err);

            db.query("DELETE FROM Tarefa WHERE IdProgramador = ?", [id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao eliminar tarefas do programador." }));

                db.query("DELETE FROM Programador WHERE Id = ?", [id], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao eliminar dados de programador." }));

                    db.query("DELETE FROM Utilizador WHERE Id = ?", [id], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao eliminar utilizador." }));

                        db.query("UPDATE Gestor SET GereUtilizadores = GereUtilizadores - 1 WHERE Id = ?", [gestorId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ message: "Erro ao atualizar contador." }));

                            db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).send(err));
                                res.json({ message: "Programador e todos os dados associados eliminados com sucesso." });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get("/tarefas-concluidas", verificarAutenticacao, (req, res) => {
    const userId = req.session.user.Id;

    const sql = `
        SELECT T.*, 
               TT.Nome AS Tipo,
               DATEDIFF(T.DataRealFim, T.DataRealInicio) AS DuracaoDias
        FROM Tarefa T
        LEFT JOIN TipoTarefa TT ON T.IdTipoTarefa = TT.Id
        WHERE T.IdProgramador = ? 
        AND T.EstadoAtual = 'Done'
        ORDER BY T.DataRealFim DESC
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Erro ao buscar histórico:", err);
            return res.status(500).json({ message: "Erro ao carregar histórico." });
        }
        res.json(result);
    });
});

app.get("/gestor/tarefas-concluidas", verificarAutenticacao, verificarGestor, (req, res) => {
    const gestorId = req.session.user.Id;

    const sql = `
        SELECT T.*, 
               U.Nome AS NomeProgramador,
               TT.Nome AS Tipo,
               DATEDIFF(T.DataRealFim, T.DataRealInicio) AS DuracaoReal,
               DATEDIFF(T.DataPrevistaFim, T.DataPrevistaInicio) AS DuracaoPrevista
        FROM Tarefa T
        LEFT JOIN Utilizador U ON T.IdProgramador = U.Id
        LEFT JOIN TipoTarefa TT ON T.IdTipoTarefa = TT.Id
        WHERE T.IdGestor = ? 
        AND T.EstadoAtual = 'Done'
        ORDER BY T.DataRealFim DESC
    `;

    db.query(sql, [gestorId], (err, result) => {
        if (err) {
            console.error("Erro ao buscar histórico do gestor:", err);
            return res.status(500).json({ message: "Erro ao carregar histórico." });
        }
        res.json(result);
    });
});

app.get("/gestor/tarefas-em-curso", verificarAutenticacao, verificarGestor, (req, res) => {
    const gestorId = req.session.user.Id;

    const sql = `
        SELECT T.*, 
               U.Nome AS NomeProgramador,
               TT.Nome AS Tipo,
               DATEDIFF(T.DataPrevistaFim, CURDATE()) AS DiasDiferenca
        FROM Tarefa T
        LEFT JOIN Utilizador U ON T.IdProgramador = U.Id
        LEFT JOIN TipoTarefa TT ON T.IdTipoTarefa = TT.Id
        WHERE T.IdGestor = ? 
        AND T.EstadoAtual != 'Done'
        ORDER BY 
            CASE T.EstadoAtual
                WHEN 'Doing' THEN 1
                WHEN 'ToDo' THEN 2
                ELSE 3
            END,
            T.DataPrevistaFim ASC
    `;

    db.query(sql, [gestorId], (err, result) => {
        if (err) {
            console.error("Erro ao buscar tarefas em curso:", err);
            return res.status(500).json({ message: "Erro ao carregar tarefas." });
        }
        res.json(result);
    });
});

app.get("/gestor/previsao-todo", verificarAutenticacao, verificarGestor, (req, res) => {
    const gestorId = req.session.user.Id;

    const sqlHistory = `
        SELECT StoryPoints, 
               DATEDIFF(DataRealFim, DataRealInicio) AS Duracao
        FROM Tarefa
        WHERE IdGestor = ? 
        AND EstadoAtual = 'Done' 
        AND DataRealFim IS NOT NULL 
        AND DataRealInicio IS NOT NULL
    `;

    db.query(sqlHistory, [gestorId], (err, history) => {
        if (err) {
            console.error("Erro histórico:", err);
            return res.status(500).json({ message: "Erro ao calcular histórico." });
        }

        const sumMap = {};
        const countMap = {};

        history.forEach(t => {
            const sp = t.StoryPoints || 0; 
            const dias = t.Duracao < 0 ? 0 : t.Duracao; 
            
            if (!sumMap[sp]) { sumMap[sp] = 0; countMap[sp] = 0; }
            sumMap[sp] += dias;
            countMap[sp]++;
        });

        const averages = {}; 
        const availableSPs = []; 
        
        Object.keys(sumMap).forEach(sp => {
            const spInt = parseInt(sp);
            if (!isNaN(spInt)) {
                averages[spInt] = sumMap[sp] / countMap[sp];
                availableSPs.push(spInt);
            }
        });

        availableSPs.sort((a, b) => a - b);

        const sqlTodo = `
            SELECT T.Id, T.Descricao, T.StoryPoints, U.Nome AS NomeProgramador 
            FROM Tarefa T
            LEFT JOIN Utilizador U ON T.IdProgramador = U.Id
            WHERE T.IdGestor = ? AND T.EstadoAtual = 'ToDo'
        `;

        db.query(sqlTodo, [gestorId], (err, todos) => {
            if (err) {
                console.error("Erro SQL Todo:", err); 
                return res.status(500).json({ message: "Erro ao buscar tarefas pendentes." });
            }

            let totalPrevisto = 0;
            const previsoesDetalhadas = todos.map(t => {
                let estimativa = 0;
                let metodo = "N/A";
                const taskSP = t.StoryPoints || 0;

                if (availableSPs.length === 0) {
                    estimativa = 0;
                    metodo = "Sem Histórico";
                } else if (averages[taskSP] !== undefined) {
                    estimativa = averages[taskSP];
                    metodo = "Média Direta";
                } else {
                    const closestSP = availableSPs.reduce((prev, curr) => {
                        return (Math.abs(curr - taskSP) < Math.abs(prev - taskSP) ? curr : prev);
                    });
                    estimativa = averages[closestSP];
                    metodo = `Aprox. (SP ${closestSP})`;
                }

                totalPrevisto += estimativa;

                return {
                    ...t,
                    EstimativaDias: estimativa.toFixed(1),
                    Metodo: metodo
                };
            });

            res.json({
                totalPrevisto: totalPrevisto.toFixed(1),
                detalhes: previsoesDetalhadas,
                mediasBase: averages
            });
        });
    });
});

app.get("/gestor/exportar-tarefas-csv", verificarAutenticacao, verificarGestor, (req, res) => {
    const gestorId = req.session.user.Id;

    const sql = `
        SELECT T.Descricao, T.DataPrevistaInicio, T.DataPrevistaFim, T.DataRealInicio, T.DataRealFim,
               U.Nome AS NomeProgramador,
               TT.Nome AS Tipo
        FROM Tarefa T
        LEFT JOIN Utilizador U ON T.IdProgramador = U.Id
        LEFT JOIN TipoTarefa TT ON T.IdTipoTarefa = TT.Id
        WHERE T.IdGestor = ? 
        AND T.EstadoAtual = 'Done'
        ORDER BY T.DataRealFim DESC
    `;

    db.query(sql, [gestorId], (err, results) => {
        if (err) {
            console.error("Erro ao exportar CSV:", err);
            return res.status(500).send("Erro ao gerar ficheiro.");
        }

        const formatDate = (date) => {
            if (!date) return "";
            return new Date(date).toISOString().split('T')[0];
        };

        const clean = (text) => {
            if (!text) return "";
            return text.toString().replace(/;/g, ",").replace(/(\r\n|\n|\r)/g, " ");
        };

        let csvContent = "Programador;Descricao;DataPrevistaInicio;DataPrevista;TipoTarefa;DataRealInicio;DataRealFim\n";

        results.forEach(row => {
            csvContent += [
                clean(row.NomeProgramador),
                clean(row.Descricao),
                formatDate(row.DataPrevistaInicio),
                formatDate(row.DataPrevistaFim),
                clean(row.Tipo),
                formatDate(row.DataRealInicio),
                formatDate(row.DataRealFim)
            ].join(";") + "\n";
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="tarefas_concluidas.csv"');
        res.send(csvContent);
    });
});


app.get("/tipos-tarefa", verificarAutenticacao, (req, res) => {
    db.query("SELECT * FROM TipoTarefa ORDER BY Id ASC", (err, result) => {
        if (err) return res.status(500).json({ message: "Erro ao carregar tipos." });
        res.json(result);
    });
});

app.post("/tipos-tarefa", verificarAutenticacao, verificarGestor, (req, res) => {
    const { Nome } = req.body;
    if (!Nome) return res.status(400).json({ message: "O nome é obrigatório." });

    db.query("INSERT INTO TipoTarefa (Nome) VALUES (?)", [Nome], (err, result) => {
        if (err) return res.status(500).json({ message: "Erro ao criar tipo." });
        res.status(201).json({ message: "Tipo criado com sucesso.", Id: result.insertId });
    });
});

app.put("/tipos-tarefa/:id", verificarAutenticacao, verificarGestor, (req, res) => {
    const { id } = req.params;
    const { Nome } = req.body;

    db.query("UPDATE TipoTarefa SET Nome = ? WHERE Id = ?", [Nome, id], (err) => {
        if (err) return res.status(500).json({ message: "Erro ao atualizar." });
        res.json({ message: "Tipo atualizado com sucesso." });
    });
});

app.delete("/tipos-tarefa/:id", verificarAutenticacao, verificarGestor, (req, res) => {
    const { id } = req.params;

    db.query("SELECT Id FROM Tarefa WHERE IdTipoTarefa = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Erro ao verificar dependências." });
        
        if (result.length > 0) {
            return res.status(400).json({ 
                message: "Não é possível eliminar este tipo pois existem tarefas associadas a ele." 
            });
        }

        db.query("DELETE FROM TipoTarefa WHERE Id = ?", [id], (err) => {
            if (err) return res.status(500).json({ message: "Erro ao eliminar." });
            res.json({ message: "Tipo eliminado com sucesso." });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor à escuta na porta ${PORT}`);
});