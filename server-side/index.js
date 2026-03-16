const express = require('express');
const pool = require('./db/connection');

const PORT = 7000;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(cors({
    origin : '*',
    methods:['POST' , 'PUT' , 'DELETE' , 'PATCH' , 'GET'],
    allowedHeaders: ['Content-Type', 'Authorization'] 
}))



const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_farmacia');
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Sessão expirada ou inválida.' });
    }
};

const eAdmin = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT role_id FROM admin WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0 || result.rows[0].role_id !== 1) {
            return res.status(403).json({ message: 'Acesso restrito a Administradores Root.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Erro ao verificar privilégios.' });
    }
};


app.post('/signup', async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        if (!nome || !email || !password) {
            return res.status(400).json({ message: 'Preencha todos os campos!' });
        }

        const checkUser = await pool.query('SELECT * FROM admin WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: 'Este email já está cadastrado.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = 'INSERT INTO admin (nome, email, password) VALUES ($1, $2, $3) RETURNING id, nome, email';
        const newUser = await pool.query(sql, [nome, email, hashedPassword]);

        res.status(201).json({
            message: 'Administrador criado com sucesso!',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar conta', details: err.message });
    }
});


app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Credenciais incompletas' });
        }

        const sql = `SELECT * FROM admin WHERE email = $1`;
        const result = await pool.query(sql, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        const admin = result.rows[0];


        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Senha inválida!' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email , role_id: admin.role_id}, 
            process.env.JWT_SECRET || 'chave_secreta_farmacia',
            { expiresIn: '1d' }
        );

        return res.json({ 
            token, 
            message: 'Login efectuado com sucesso!' 
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro interno no servidor' });
    }
});


// Gestão de fornecedores
app.get('/fornecedores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fornecedores ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar fornecedores' });
    }
});

app.post('/fornecedores/add', async (req, res) => {
    const { nome, contato , endereco } = req.body;
    
    if (!nome) {
        return res.status(400).json({ message: "Nome é um campo obrigatórios." });
    }

    const sql = 'INSERT INTO fornecedores (nome,contato, endereco) VALUES ($1, $2, $3)';
    
    try {
        const result = await pool.query(sql, [nome, contato , endereco]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao cadastrar fornecedor' });
    }
});

app.patch('/fornecedores/editar/:id', async (req, res) => {
    const { id } = req.params;
    const campos = req.body; 

    if (Object.keys(campos).length === 0) {
        return res.status(400).json({ message: "Nenhum campo enviado para atualização." });
    }

    const colunas = [];
    const valores = [];
    let contador = 1;

    for (let campo in campos) {
        colunas.push(`${campo} = $${contador}`);
        valores.push(campos[campo]);
        contador++;
    }

    valores.push(id);
    const sql = `UPDATE fornecedores SET ${colunas.join(', ')} WHERE id = $${contador}`;

    try {
        pool.query(sql, valores, (err, result) => {
            if (err) {
                if (err.code === '42703') {
                    return res.status(400).json({ error: 'Um ou mais campos enviados não existem no banco de dados.' });
                }
                return res.status(500).json({ error: 'Erro ao atualizar', details: err.message });
            }

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Fornecedor não encontrado.' });
            }

            res.json({ message: 'Fornecedor atualizado parcialmente com sucesso!' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});


app.delete('/fornecedores/excluir/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM fornecedores WHERE id = $1';

    try {
        pool.query(sql, [id], (err, result) => {
            if (err) {
                if (err.code === '23503') {
                    return res.status(400).json({ 
                        message: 'Não é possível excluir este fornecedor pois existem produtos vinculados a ele no estoque.' 
                    });
                }
                return res.status(500).json({ error: 'Erro ao tentar excluir', details: err.message });
            }
            
            if (result.rowCount === 0) return res.status(404).json({ message: 'Fornecedor não encontrado.' });

            res.json({ message: 'Fornecedor removido com sucesso!' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

app.get('/fornecedores/:id/historico', async (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT f.nome as fornecedor, p.nome as produto, p.preco, p.quantidade, p.create_time
        FROM produtos p
        JOIN fornecedores f ON p.fornecedor_id = f.id
        WHERE f.id = $1
    `;

    try {
        pool.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Erro ao buscar histórico', details: err.message });
            
            if (result.rows.length === 0) {
                return res.json({ message: 'Este fornecedor ainda não possui produtos cadastrados.' });
            }

            res.json({ 
                fornecedor: result.rows[0].fornecedor,
                total_itens: result.rows.length,
                historico: result.rows 
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});



// Gestão de Produtos
app.post('/produtos/add', async (req, res) => {
    const { nome, preco, quantidade, fornecedor_id , data_expiracao} = req.body;

    if (!nome || !preco || !quantidade || !fornecedor_id || !data_expiracao) {
        return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
    }

    const sql = `
    INSERT INTO produtos (nome, preco, quantidade, fornecedor_id , data_expiracao)
    VALUES ($1, $2, $3, $4 , $5)
    `;

    try {
        await pool.query(sql, [nome, preco, quantidade, fornecedor_id , data_expiracao]);
        res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar produto', details: error.message });
    }
});


app.get('/produtos/listar', async (req, res) => {
  const sql = 'SELECT * FROM produtos ORDER BY id ASC';

    try {
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar produtos', details: error.message });
    }
});


app.patch('/produtos/editar/:id', async (req, res) => {
    const { id } = req.params;
    const campos = req.body;

    if (Object.keys(campos).length === 0) {
        return res.status(400).json({ message: "Nenhum campo enviado para atualização." });
    }

    const colunas = [];
    const valores = [];
    let contador = 1;

    for (let campo in campos) {
        colunas.push(`${campo} = $${contador}`);
        valores.push(campos[campo]);
        contador++;
    }

    valores.push(id);

    const sql = `UPDATE produtos SET ${colunas.join(', ')} WHERE id = $${contador}`;

    try {
        const result = await pool.query(sql, valores);

        if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        if (error.code === '42703') {
        return res.status(400).json({ error: 'Um ou mais campos enviados não existem no banco de dados.' });
        }

        res.status(500).json({ error: 'Erro ao atualizar produto', details: error.message });
    }
});


app.delete('/produtos/excluir/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM produtos WHERE id = $1';

    try {
        const result = await pool.query(sql, [id]);

        if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.json({ message: 'Produto excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir produto', details: error.message });
    }
});



// --- CONTROLE DE STOCK ---
app.post('/stock/movimentar', async (req, res) => {
    const { produto_id, quantidade, tipo, motivo } = req.body; 

    if (!['entrada', 'saida'].includes(tipo)) {
        return res.status(400).json({ error: "O tipo deve ser 'entrada' ou 'saida'." });
    }

    try {
        await pool.query('BEGIN');

        const pResult = await pool.query('SELECT quantidade, nome FROM produtos WHERE id = $1', [produto_id]);
        if (pResult.rowCount === 0) throw new Error('Produto não encontrado.');

        const stockAtual = pResult.rows[0].quantidade;
        const nomeProduto = pResult.rows[0].nome;
        let novaQuantidade;

        if (tipo === 'entrada') {
            novaQuantidade = stockAtual + quantidade;
        } else {
            if (stockAtual < quantidade) throw new Error(`Stock insuficiente para ${nomeProduto}.`);
            novaQuantidade = stockAtual - parseInt(quantidade);
        }

        await pool.query('UPDATE produtos SET quantidade = $1 WHERE id = $2', [novaQuantidade, produto_id]);

        const sqlHist = `INSERT INTO historico_stock (produto_id, tipo, quantidade, data_mov) VALUES ($1, $2, $3, NOW())`;
        await pool.query(sqlHist, [produto_id, tipo, quantidade]);

        await pool.query('COMMIT');

        let alerta = null;
        if (novaQuantidade <= 5) {
            alerta = `ATENÇÃO: O produto ${nomeProduto} está com stock crítico (${novaQuantidade} unidades)!`;
        }

        res.json({ 
            message: `Movimentação de ${tipo} realizada com sucesso.`,
            novo_stock: novaQuantidade,
            alerta: alerta
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    }
});

app.get('/stock/alertas', async (req, res) => {
    const LIMITE_CRITICO = 3; 

    const sql = `
        SELECT id, nome, quantidade 
        FROM produtos 
        WHERE quantidade <= $1 
        ORDER BY quantidade ASC
    `;

    try {
        const result = await pool.query(sql, [LIMITE_CRITICO]);
        
        if (result.rows.length === 0) {
            return res.json({ message: "Tudo em ordem! Nenhum produto em falta." });
        }

        res.json({
            total_criticos: result.rows.length,
            produtos: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar alertas', details: error.message });
    }
});



// --- RELATÓRIOS ---
app.get('/relatorios/estoque', async (req, res) => {
    const sql = `
        SELECT 
            nome, 
            quantidade, 
            preco,
            (quantidade * preco) AS valor_total
        FROM produtos
        ORDER BY valor_total DESC -- Os produtos mais valiosos primeiro
        LIMIT 10 -- Para o gráfico não ficar muito poluído
    `;

    try {
        const result = await pool.query(sql);
        
        const totalItens = result.rows.reduce((acc, item) => acc + item.quantidade, 0);
        const patrimonioTotal = result.rows.reduce((acc, item) => acc + parseFloat(item.valor_total), 0);

        res.json({
            total_itens: totalItens,
            valor_total_patrimonio: patrimonioTotal,
            dados_grafico: result.rows 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar dados', details: error.message });
    }
});

// 2. Relatório de Vendas (Total vendido por período)
app.get('/relatorios/vendas', async (req, res) => {
    const { inicio, fim } = req.query; 

    const sql = `
        SELECT 
        p.nome, 
        SUM(v.quantidade)::INT as total_unidades, 
        SUM(v.valor_total)::FLOAT as receita_total
    FROM vendas v
    JOIN produtos p ON v.produto_id = p.id
    WHERE v.data_venda BETWEEN $1 AND $2
    GROUP BY p.nome
    ORDER BY receita_total DESC
    `;

    try {
        const result = await pool.query(sql, [inicio || '1900-01-01', fim || '2100-01-01']);
        res.json({
            periodo: { inicio, fim },
            dados: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar relatório de vendas', details: error.message });
    }
});

// 3. Relatório de Compras/Gastos com Fornecedores
app.get('/relatorios/compras', async (req, res) => {
    const sql = `
        SELECT 
            f.nome as fornecedor, 
            COUNT(c.id) as total_pedidos,
            SUM(c.custo_total) as total_gasto
        FROM compras c
        JOIN fornecedores f ON c.fornecedor_id = f.id
        GROUP BY f.nome
        ORDER BY total_gasto DESC
    `;

    try {
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar relatório de compras', details: error.message });
    }
});

// 4. Gera pdf com o relatório
app.get('/relatorios/estoque/pdf', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT nome, quantidade, preco, (quantidade * preco) as valor_total 
            FROM produtos 
            ORDER BY quantidade ASC
        `);

        const doc = new PDFDocument({ margin: 30 });

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio_estoque.pdf');

        doc.pipe(res); 

        doc.fontSize(20).text('Relatório de Estoque - Farmácia Maya', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        doc.fontSize(12).fillColor('gray').text('Produto', 50, 150);
        doc.text('Qtd', 250, 150);
        doc.text('Preço Unit.', 350, 150);
        doc.text('Total', 450, 150);
        
        doc.moveTo(50, 165).lineTo(550, 165).stroke(); 

        let y = 180;
        doc.fillColor('black');
        
        result.rows.forEach(item => {
            
            if (y > 700) { 
                doc.addPage();
                y = 50; 
            }

            doc.fontSize(10).text(item.nome, 50, y);
            doc.text(item.quantidade.toString(), 250, y);
            doc.text(`Kz ${item.preco}`, 350, y);
            doc.text(`Kz ${item.valor_total}`, 450, y);
            
            y += 20;
        });

        doc.end(); 

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar PDF' });
    }
});

// Rota para buscar o histórico de movimentações
app.get('/stock/historico', async (req, res) => {
    const sql = `
        SELECT h.id, p.nome as produto_nome, h.tipo, h.quantidade, h.data_mov 
        FROM historico_stock h
        JOIN produtos p ON h.produto_id = p.id
        ORDER BY h.data_mov DESC 
        LIMIT 20
    `;
    try {
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico', details: error.message });
    }
});




// Listar todos
app.get('/admin/utilizadores', verificarToken, eAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT a.id, a.nome, a.email, r.nome_cargo as role, a.role_id
            FROM admin a
            LEFT JOIN roles r ON a.role_id = r.id
            ORDER BY a.id ASC
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar utilizadores' });
    }
});

// Adicionar Staff
app.post('/admin/utilizadores/add', verificarToken, eAdmin, async (req, res) => {
    const { nome, email, password, role_id } = req.body;
    try {
        if (parseInt(role_id) === 1) return res.status(400).json({ message: "Não podes criar outro Root." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO admin (nome, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id, nome';
        const result = await pool.query(sql, [nome, email, hashedPassword, role_id]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar staff' });
    }
});

// Editar Staff/Roles
app.patch('/admin/utilizadores/editar/:id', verificarToken, eAdmin, async (req, res) => {
    const { id } = req.params;
    const { nome, email, role_id } = req.body;
    try {
        if (parseInt(id) === 1 && parseInt(role_id) !== 1) {
            return res.status(400).json({ message: "O Root não pode mudar de cargo." });
        }
        const sql = 'UPDATE admin SET nome = $1, email = $2, role_id = $3 WHERE id = $4';
        await pool.query(sql, [nome, email, role_id, id]);
        res.json({ message: 'Atualizado!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao editar' });
    }
});

// Excluir Staff
app.delete('/admin/utilizadores/excluir/:id', verificarToken, eAdmin, async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ message: "Não podes apagar a ti próprio." });
        }
        await pool.query('DELETE FROM admin WHERE id = $1', [req.params.id]);
        res.json({ message: 'Removido!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir' });
    }
});

app.listen(PORT, () => {
    console.log(`Server rodando em http://localhost:${PORT}`);
});