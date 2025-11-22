const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const consultas = require('./consultas');

const aplicativo = express();
const porta = 3000;

aplicativo.use(cors());
aplicativo.use(bodyParser.json());
aplicativo.use(bodyParser.urlencoded({ extended: true }));

aplicativo.get('/vendas', async (requisicao, resposta) => {
    try {
        const vendas = await consultas.obterVendas();
        resposta.status(200).json(vendas);
    } catch (erro) {
        resposta.status(500).send('Erro ao obter vendas');
    }
});

aplicativo.get('/vendas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const detalhes = await consultas.obterDetalhesVenda(id);
        if (detalhes) {
            resposta.status(200).json(detalhes);
        } else {
            resposta.status(404).send('Venda não encontrada');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao obter detalhes da venda');
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
        resposta.status(500).send('Erro interno do servidor ao processar a venda');
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
            resposta.status(404).send('Venda não encontrada');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao atualizar o status da venda');
    }
});

aplicativo.delete('/vendas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const sucesso = await consultas.apagarVenda(id);
        if (sucesso) {
            resposta.status(200).json({ mensagem: `Venda ${id} e seus detalhes apagados com sucesso.` });
        } else {
            resposta.status(404).send('Venda não encontrada ou erro ao apagar');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao apagar a venda');
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
        resposta.status(500).send('Erro interno do servidor ao processar exclusão em massa.');
    }
});


// Rotas para PRODUTOS (Catálogo)
aplicativo.get('/produtos', async (requisicao, resposta) => {
    try {
        const produtos = await consultas.obterProdutos();
        resposta.status(200).json(produtos);
    } catch (erro) {
        resposta.status(500).send('Erro ao obter produtos');
    }
});

aplicativo.get('/produtos/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const produto = await consultas.obterProdutoPorId(id);
        if (produto) {
            resposta.status(200).json(produto);
        } else {
            resposta.status(404).send('Produto não encontrado');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao obter produto');
    }
});

aplicativo.post('/produtos', async (requisicao, resposta) => {
    try {
        const novoProduto = await consultas.criarProduto(requisicao.body);
        resposta.status(201).json(novoProduto);
    } catch (erro) {
        resposta.status(500).send('Erro ao criar produto');
    }
});

aplicativo.patch('/produtos/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const produtoAtualizado = await consultas.atualizarProduto(id, requisicao.body);
        if (produtoAtualizado) {
            resposta.status(200).json(produtoAtualizado);
        } else {
            resposta.status(404).send('Produto não encontrado para atualização');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao atualizar produto');
    }
});

aplicativo.delete('/produtos/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const produtoDesativado = await consultas.desativarProduto(id);
        if (produtoDesativado) {
            resposta.status(200).json({ mensagem: 'Produto desativado com sucesso', idProduto: id });
        } else {
            resposta.status(404).send('Produto não encontrado para desativação');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao desativar produto');
    }
});


// Rotas para EMPRESAS
aplicativo.get('/empresas', async (requisicao, resposta) => {
    try {
        const empresas = await consultas.obterEmpresas();
        resposta.status(200).json(empresas);
    } catch (erro) {
        resposta.status(500).send('Erro ao obter dados da empresa');
    }
});

aplicativo.get('/empresas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const empresa = await consultas.obterEmpresaPorId(id);
        if (empresa) {
            resposta.status(200).json(empresa);
        } else {
            resposta.status(404).send('Empresa não encontrada');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao obter detalhes da empresa');
    }
});

aplicativo.post('/empresas', async (requisicao, resposta) => {
    try {
        const novaEmpresa = await consultas.criarEmpresa(requisicao.body);
        resposta.status(201).json(novaEmpresa);
    } catch (erro) {
        resposta.status(500).send('Erro ao cadastrar empresa');
    }
});

aplicativo.patch('/empresas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const empresaAtualizada = await consultas.atualizarEmpresa(id, requisicao.body);
        if (empresaAtualizada) {
            resposta.status(200).json(empresaAtualizada);
        } else {
            resposta.status(404).send('Empresa não encontrada para atualização');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao atualizar dados da empresa');
    }
});

aplicativo.delete('/empresas/:id', async (requisicao, resposta) => {
    const id = parseInt(requisicao.params.id);
    try {
        const sucesso = await consultas.apagarEmpresa(id);
        if (sucesso) {
            resposta.status(200).json({ mensagem: `Empresa ${id} apagada com sucesso.` });
        } else {
            resposta.status(404).send('Empresa não encontrada ou erro ao apagar');
        }
    } catch (erro) {
        resposta.status(500).send('Erro ao apagar empresa');
    }
});


aplicativo.listen(porta, () => {
    console.log(`API rodando na porta ${porta}.`);
});