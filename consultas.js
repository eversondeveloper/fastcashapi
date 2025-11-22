const { Pool } = require('pg');
const configuracao = require('./configuracaoBanco');

const pool = new Pool(configuracao);

const obterVendas = async () => {
    const consulta = 'SELECT * FROM vendas ORDER BY data_hora DESC';
    const resultado = await pool.query(consulta);
    return resultado.rows;
};

const obterDetalhesVenda = async (idVenda) => {
    const consultaVenda = 'SELECT * FROM vendas WHERE id_venda = $1';
    const resultadoVenda = await pool.query(consultaVenda, [idVenda]);
    const venda = resultadoVenda.rows[0];

    if (!venda) return null;

    const consultaItens = 'SELECT * FROM itens_vendidos WHERE venda_id = $1';
    const resultadoItens = await pool.query(consultaItens, [idVenda]);
    venda.itens = resultadoItens.rows;

    const consultaPagamentos = 'SELECT * FROM pagamentos WHERE venda_id = $1';
    const resultadoPagamentos = await pool.query(consultaPagamentos, [idVenda]);
    venda.pagamentos = resultadoPagamentos.rows;

    return venda;
};

const criarVenda = async (dadosVenda) => {
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        const consultaVenda = `
            INSERT INTO vendas (valor_total_bruto, valor_pago_total, valor_troco, status_venda) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id_venda
        `;
        const valoresVenda = [
            dadosVenda.valorTotalBruto,
            dadosVenda.valorPagoTotal,
            dadosVenda.valorTroco,
            dadosVenda.statusVenda || 'Finalizada'
        ];
        const resultadoVenda = await cliente.query(consultaVenda, valoresVenda);
        const idVenda = resultadoVenda.rows[0].id_venda;

        for (const pagamento of dadosVenda.pagamentos) {
            const consultaPagamento = `
                INSERT INTO pagamentos (venda_id, metodo, valor_pago, referencia_metodo) 
                VALUES ($1, $2, $3, $4)
            `;
            const valoresPagamento = [
                idVenda,
                pagamento.metodo,
                pagamento.valorPago,
                pagamento.referenciaMetodo
            ];
            await cliente.query(consultaPagamento, valoresPagamento);
        }

        for (const item of dadosVenda.itens) {
            const consultaItem = `
                INSERT INTO itens_vendidos (venda_id, categoria, descricao_item, preco_unitario, quantidade, subtotal) 
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            const valoresItem = [
                idVenda,
                item.categoria,
                item.descricaoItem,
                item.precoUnitario,
                item.quantidade,
                item.subtotal
            ];
            await cliente.query(consultaItem, valoresItem);
        }

        await cliente.query('COMMIT');
        return { idVenda, sucesso: true };

    } catch (erro) {
        await cliente.query('ROLLBACK');
        console.error('Erro ao criar venda:', erro);
        return { sucesso: false, erro: erro.message };
    } finally {
        cliente.release();
    }
};

const atualizarStatusVenda = async (idVenda, status) => {
    const consulta = 'UPDATE vendas SET status_venda = $1 WHERE id_venda = $2 RETURNING *';
    const resultado = await pool.query(consulta, [status, idVenda]);
    return resultado.rows[0];
};

const apagarVenda = async (idVenda) => {
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');
        
        await cliente.query('DELETE FROM pagamentos WHERE venda_id = $1', [idVenda]);
        await cliente.query('DELETE FROM itens_vendidos WHERE venda_id = $1', [idVenda]);
        
        const resultado = await cliente.query('DELETE FROM vendas WHERE id_venda = $1 RETURNING id_venda', [idVenda]);

        await cliente.query('COMMIT');
        return resultado.rows.length > 0;

    } catch (erro) {
        await cliente.query('ROLLBACK');
        console.error('Erro ao apagar venda:', erro);
        return false;
    } finally {
        cliente.release();
    }
};

const apagarVendasEmMassa = async (idsVendas) => {
    if (!idsVendas || idsVendas.length === 0) {
        return { sucesso: false, mensagem: 'Nenhum ID de venda fornecido.' };
    }

    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        const placeholders = idsVendas.map((_, i) => `$${i + 1}`).join(', ');

        await cliente.query(`DELETE FROM pagamentos WHERE venda_id IN (${placeholders})`, idsVendas);
        await cliente.query(`DELETE FROM itens_vendidos WHERE venda_id IN (${placeholders})`, idsVendas);

        const resultado = await cliente.query(`DELETE FROM vendas WHERE id_venda IN (${placeholders}) RETURNING id_venda`, idsVendas);

        await cliente.query('COMMIT');
        return { sucesso: true, deletadas: resultado.rows.length };

    } catch (erro) {
        await cliente.query('ROLLBACK');
        console.error('Erro ao apagar vendas em massa:', erro);
        return { sucesso: false, mensagem: erro.message };
    } finally {
        cliente.release();
    }
};


const obterProdutos = async () => {
    const consulta = 'SELECT * FROM produtos WHERE ativo = TRUE ORDER BY id_produto ASC';
    const resultado = await pool.query(consulta);
    return resultado.rows;
};

const obterProdutoPorId = async (idProduto) => {
    const consulta = 'SELECT * FROM produtos WHERE id_produto = $1';
    const resultado = await pool.query(consulta, [idProduto]);
    return resultado.rows[0];
};

const criarProduto = async (dadosProduto) => {
    const consulta = `
        INSERT INTO produtos (categoria, descricao, preco, tipo_item, custo_unitario, estoque_atual, codigo_barra) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *
    `;
    const valores = [
        dadosProduto.categoria,
        dadosProduto.descricao,
        dadosProduto.preco,
        dadosProduto.tipoItem || 'Serviço',
        dadosProduto.custoUnitario || 0.00,
        dadosProduto.estoqueAtual || 0,
        dadosProduto.codigoBarra
    ];
    const resultado = await pool.query(consulta, valores);
    return resultado.rows[0];
};

const atualizarProduto = async (idProduto, dadosProduto) => {
    const consulta = `
        UPDATE produtos 
        SET 
            categoria = COALESCE($1, categoria),
            descricao = COALESCE($2, descricao),
            preco = COALESCE($3, preco),
            tipo_item = COALESCE($4, tipo_item),
            custo_unitario = COALESCE($5, custo_unitario),
            estoque_atual = COALESCE($6, estoque_atual),
            codigo_barra = COALESCE($7, codigo_barra)
        WHERE id_produto = $8
        RETURNING *
    `;
    const valores = [
        dadosProduto.categoria,
        dadosProduto.descricao,
        dadosProduto.preco,
        dadosProduto.tipoItem,
        dadosProduto.custoUnitario,
        dadosProduto.estoqueAtual,
        dadosProduto.codigoBarra,
        idProduto
    ];
    const resultado = await pool.query(consulta, valores);
    return resultado.rows[0];
};

const desativarProduto = async (idProduto) => {
    const consulta = 'UPDATE produtos SET ativo = FALSE WHERE id_produto = $1 RETURNING *';
    const resultado = await pool.query(consulta, [idProduto]);
    return resultado.rows[0];
};


// Funções CRUD para a tabela EMPRESAS
const obterEmpresas = async () => {
    const consulta = 'SELECT * FROM empresas ORDER BY id_empresa ASC';
    const resultado = await pool.query(consulta);
    return resultado.rows;
};

const obterEmpresaPorId = async (idEmpresa) => {
    const consulta = 'SELECT * FROM empresas WHERE id_empresa = $1';
    const resultado = await pool.query(consulta, [idEmpresa]);
    return resultado.rows[0];
};

const criarEmpresa = async (dadosEmpresa) => {
    const consulta = `
        INSERT INTO empresas (razao_social, nome_fantasia, cnpj, inscricao_estadual, endereco, cidade, estado, cep, telefone, email) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
    `;
    const valores = [
        dadosEmpresa.razaoSocial,
        dadosEmpresa.nomeFantasia,
        dadosEmpresa.cnpj,
        dadosEmpresa.inscricaoEstadual,
        dadosEmpresa.endereco,
        dadosEmpresa.cidade,
        dadosEmpresa.estado,
        dadosEmpresa.cep,
        dadosEmpresa.telefone,
        dadosEmpresa.email
    ];
    const resultado = await pool.query(consulta, valores);
    return resultado.rows[0];
};

const atualizarEmpresa = async (idEmpresa, dadosEmpresa) => {
    const consulta = `
        UPDATE empresas 
        SET 
            razao_social = COALESCE($1, razao_social),
            nome_fantasia = COALESCE($2, nome_fantasia),
            cnpj = COALESCE($3, cnpj),
            inscricao_estadual = COALESCE($4, inscricao_estadual),
            endereco = COALESCE($5, endereco),
            cidade = COALESCE($6, cidade),
            estado = COALESCE($7, estado),
            cep = COALESCE($8, cep),
            telefone = COALESCE($9, telefone),
            email = COALESCE($10, email)
        WHERE id_empresa = $11
        RETURNING *
    `;
    const valores = [
        dadosEmpresa.razaoSocial,
        dadosEmpresa.nomeFantasia,
        dadosEmpresa.cnpj,
        dadosEmpresa.inscricaoEstadual,
        dadosEmpresa.endereco,
        dadosEmpresa.cidade,
        dadosEmpresa.estado,
        dadosEmpresa.cep,
        dadosEmpresa.telefone,
        dadosEmpresa.email,
        idEmpresa
    ];
    const resultado = await pool.query(consulta, valores);
    return resultado.rows[0];
};

const apagarEmpresa = async (idEmpresa) => {
    const consulta = 'DELETE FROM empresas WHERE id_empresa = $1 RETURNING id_empresa';
    const resultado = await pool.query(consulta, [idEmpresa]);
    return resultado.rows.length > 0;
};


module.exports = {
    obterVendas,
    obterDetalhesVenda,
    criarVenda,
    atualizarStatusVenda,
    apagarVenda,
    apagarVendasEmMassa,
    obterProdutos,
    obterProdutoPorId,
    criarProduto,
    atualizarProduto,
    desativarProduto,
    obterEmpresas,
    obterEmpresaPorId,
    criarEmpresa,
    atualizarEmpresa,
    apagarEmpresa 
};