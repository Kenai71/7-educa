import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

// Função auxiliar para calcular a idade
function calcularIdade(dataNasc) {
    if (!dataNasc) return 'Idade desconhecida';
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade > 0 ? `${idade} anos` : `${idade} ano`;
}

// 1. ROTA GET: EXIBIR A PÁGINA DE ARQUIVADOS
router.get('/', async (req, res) => {
    try {
        const { data: criancasArquivadas, error } = await supabase
            .from('cadastro_crianca') 
            .select(`
                *,
                responsavel ( nome, parentesco )
            `)
            .eq('ativo', false);

        if (error) {
            console.error("Erro Supabase:", error);
            throw error;
        }

        const dadosFormatados = criancasArquivadas ? criancasArquivadas.map(crianca => {
            const responsaveis = crianca.responsavel || []; 
            const responsavelPrincipal = responsaveis.find(r => r.parentesco === 'Mãe') || responsaveis[0];

            return {
                ...crianca,
                idadeFormatada: calcularIdade(crianca.i_nascimento),
                responsavelPrincipalNome: responsavelPrincipal ? responsavelPrincipal.nome : 'Não encontrado'
            };
        }) : [];

        // CORREÇÃO: Aponta para a pasta PERFIL dentro de views
        res.render('PERFIL/arquivados', { criancas: dadosFormatados });

    } catch (error) {
        console.error("Erro ao carregar rota arquivados:", error.message);
        // Tenta renderizar mesmo com erro
        res.render('PERFIL/arquivados', { criancas: [] });
    }
});

// 2. ROTA POST: DESARQUIVAR UMA CRIANÇA
router.post('/desarquivar/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('cadastro_crianca')
            .update({ ativo: true })
            .eq('id', id);

        if (error) throw error;

        res.redirect('/arquivados');
    } catch (error) {
        console.error("Erro ao desarquivar:", error);
        res.redirect('/arquivados');
    }
});

export default router;