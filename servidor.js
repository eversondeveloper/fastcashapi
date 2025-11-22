const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const consultas = require('./consultas');

const aplicativo = express();
const porta = process.env.PORT || 3000;

aplicativo.use(cors());
aplicativo.use(bodyParser.json());
aplicativo.use(bodyParser.urlencoded({ extended: true }));

aplicativo.get('/', (requisicao, resposta) => {
    resposta.status(200).json({ 
        mensagem: 'API EversCash PDV Online',
        versao: '1.0.0'
    });
});

aplicativo.get('/health', (requisicao, resposta) => {
    resposta.status(200).json({ 
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

aplicativo.get('/vendas', async (requisicao, resposta) => {
    try {
        const vendas = await consultas.obterVendas();
        resposta.status(200).json(vendas);
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao obter vendas' });
    }
});

aplicativo.get('/vendas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const detalhes = await consultas.obterDetalhesVenda(id);
        if (detalhes) {
            resposta.status(200).json(detalhes);
        } else {
            resposta.status(404).json({ erro: 'Venda não encontrada' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao obter detalhes da venda' });
    }
});

aplicativo.post('/vendas', async (requisicao, resposta) => {
    try {
        const resultado = await consultas.criarVenda(requisicao.body);
        if (resultado.sucesso) {
            resposta.status(201).json({ 
                mensagem: 'Venda criada com sucesso', 
                idVenda: resultado.idVenda 
            });
        } else {
            resposta.status(400).json({ mensagem: 'Falha ao criar venda', erro: resultado.erro });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro interno do servidor ao processar a venda' });
    }
});

aplicativo.patch('/vendas/:id/status', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    const { status } = requisicao.body;
    try {
        const vendaAtualizada = await consultas.atualizarStatusVenda(id, status);
        if (vendaAtualizada) {
            resposta.status(200).json({ mensagem: `Status da venda ${id} atualizado para ${status}` });
        } else {
            resposta.status(404).json({ erro: 'Venda não encontrada' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao atualizar o status da venda' });
    }
});

aplicativo.delete('/vendas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const sucesso = await consultas.apagarVenda(id);
        if (sucesso) {
            resposta.status(200).json({ mensagem: `Venda ${id} e seus detalhes apagados com sucesso.` });
        } else {
            resposta.status(404).json({ erro: 'Venda não encontrada ou erro ao apagar' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao apagar a venda' });
    }
});

aplicativo.post('/vendas/deletar-periodo', async (requisicao, resposta) => {
    const { idsVendas } = requisicao.body;
    try {
        const resultado = await consultas.apagarVendasEmMassa(idsVendas);
        if (resultado.sucesso) {
            resposta.status(200).json({ mensagem: `${resultado.deletadas} vendas apagadas.`, deletadas: resultado.deletadas });
        } else {
            resposta.status(400).json({ mensagem: 'Falha na exclusão em massa.', erro: resultado.mensagem });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro interno do servidor ao processar exclusão em massa.' });
    }
});

aplicativo.get('/produtos', async (requisicao, resposta) => {
    try {
        const produtos = await consultas.obterProdutos();
        resposta.status(200).json(produtos);
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao obter produtos' });
    }
});

aplicativo.get('/produtos/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const produto = await consultas.obterProdutoPorId(id);
        if (produto) {
            resposta.status(200).json(produto);
        } else {
            resposta.status(404).json({ erro: 'Produto não encontrado' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao obter produto' });
    }
});

aplicativo.post('/produtos', async (requisicao, resposta) => {
    try {
        const novoProduto = await consultas.criarProduto(requisicao.body);
        resposta.status(201).json(novoProduto);
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao criar produto' });
    }
});

aplicativo.patch('/produtos/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const produtoAtualizado = await consultas.atualizarProduto(id, requisicao.body);
        if (produtoAtualizado) {
            resposta.status(200).json(produtoAtualizado);
        } else {
            resposta.status(404).json({ erro: 'Produto não encontrado para atualização' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao atualizar produto' });
    }
});

aplicativo.delete('/produtos/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const produtoDesativado = await consultas.desativarProduto(id);
        if (produtoDesativado) {
            resposta.status(200).json({ mensagem: 'Produto desativado com sucesso', idProduto: id });
        } else {
            resposta.status(404).json({ erro: 'Produto não encontrado para desativação' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao desativar produto' });
    }
});

aplicativo.get('/empresas', async (requisicao, resposta) => {
    try {
        const empresas = await consultas.obterEmpresas();
        resposta.status(200).json(empresas);
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao obter dados da empresa' });
    }
});

aplicativo.get('/empresas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const empresa = await consultas.obterEmpresaPorId(id);
        if (empresa) {
            resposta.status(200).json(empresa);
        } else {
            resposta.status(404).json({ erro: 'Empresa não encontrada' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao obter detalhes da empresa' });
    }
});

aplicativo.post('/empresas', async (requisicao, resposta) => {
    try {
        const novaEmpresa = await consultas.criarEmpresa(requisicao.body);
        resposta.status(201).json(novaEmpresa);
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao cadastrar empresa' });
    }
});

aplicativo.patch('/empresas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const empresaAtualizada = await consultas.atualizarEmpresa(id, requisicao.body);
        if (empresaAtualizada) {
            resposta.status(200).json(empresaAtualizada);
        } else {
            resposta.status(404).json({ erro: 'Empresa não encontrada para atualização' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao atualizar dados da empresa' });
    }
});

aplicativo.delete('/empresas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const sucesso = await consultas.apagarEmpresa(id);
        if (sucesso) {
            resposta.status(200).json({ mensagem: `Empresa ${id} apagada com sucesso.` });
        } else {
            resposta.status(404).json({ erro: 'Empresa não encontrada ou erro ao apagar' });
        }
    } catch (erro) {
        resposta.status(500).json({ erro: 'Erro ao apagar empresa' });
    }
});

aplicativo.listen(porta, '0.0.0.0', () => {
    console.log(`API rodando na porta ${porta}`);
});