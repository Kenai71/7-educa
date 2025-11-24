import 'dotenv/config';
import express from 'express';
import session from 'express-session'; 
import supabase from './supabase.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Imports das Rotas
import turmasRouter from './routes/turmas.routes.js';
import matriculasRouter from './routes/matricula.routes.js';
import professoresRoutes from './routes/professores.routes.js';
import cadastroRouter from './routes/cadastro.routes.js';
import loginRouter from './routes/login.routes.js';
import mensalidadeRouter from './routes/mensalidades.routes.js';
import arquivadosRouter from './routes/arquivados.routes.js';
import alunoAcessarRouter from './routes/aluno-acessar.routes.js';
import senhaRouter from './routes/senha.routes.js';
import perfilRouter from './routes/perfil.routes.js';
import financeiroRoutes from './routes/financeiro.routes.js';
import privateRoute from './routes/private.route.js'; 

const app = express();
const PORT = process.env.PORT || 3020;

// Middleware para evitar cache
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Configurações Gerais
app.set("view engine", "ejs");

// --- CORREÇÃO AQUI: Caminho absoluto para as views ---
app.set("views", path.join(__dirname, 'views'));
// ----------------------------------------------------

// --- CORREÇÃO IMPORTANTE: Caminho absoluto para arquivos estáticos ---
app.use(express.static(path.join(__dirname, 'public'))); 
// -------------------------------------------------------------------

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuração de Sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'chave-secreta-padrao',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { 
        secure: false, 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    } 
}));

// --- ROTAS PRINCIPAIS ---

// Rota Inicial (Home do site)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/inicio', (req, res) => {
    res.redirect('/home'); // Manda o usuário para o Dashboard principal
});

// Rota do Contrato
app.get('/contrato', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contrato.html'));
});

// --- ROTAS DO SISTEMA ---
app.use('/login', loginRouter);
app.use('/cadastro', cadastroRouter);
app.get("/cadastro-aluno", privateRoute, (req, res) => { 
  res.render("ALUNO/cadastro-aluno");
});
app.get("/cadastro-responsavel", privateRoute, (req, res) => { 
  res.render("ALUNO/cadastro1");
});
app.use("/acessar-aluno", privateRoute, alunoAcessarRouter); 

app.use('/meuperfil', privateRoute, perfilRouter);
app.use('/api/perfil', privateRoute, perfilRouter);
app.use('/mensalidade', privateRoute, mensalidadeRouter); 
app.use('/arquivados', privateRoute, arquivadosRouter); 

app.get('/financeiro', privateRoute, (req, res) => { 
  res.render('FINANCEIRO/financeiro');
});
app.use('/api', privateRoute, financeiroRoutes); 

app.get("/home", privateRoute, async (req, res) => {
    try {
        let { data: profData } = await supabase.from('professor').select('ativo');
        let profFinal = profData ? profData.filter(p => String(p.ativo).toLowerCase() === 'true').length : 0;

        let { count: alunoCount } = await supabase.from('aluno').select('*', { count: 'exact', head: true });

        let { data: turmasData } = await supabase.from('turma').select('ativo');
        let turmaFinal = turmasData ? turmasData.filter(t => String(t.ativo).toLowerCase() === 'true').length : 0;

        let { data: todasMatriculas } = await supabase.from('matricula').select('ativo');
        let matriculaFinal = todasMatriculas ? todasMatriculas.filter(m => String(m.ativo).toLowerCase() === 'true').length : 0;

        res.render("HOME/home", {
            message: "Como podemos te ajudar hoje?",
            daycareName: "Minha Creche",
            professores: profFinal, 
            alunos: alunoCount || 0,
            turmas: turmaFinal,
            turma: turmaFinal,
            matriculas: matriculaFinal,
            matricula: matriculaFinal,
            debugMatricula: matriculaFinal 
        });

    } catch (error) {
        console.error("Erro na home:", error.message);
        res.render("HOME/home", {
            message: "Erro ao carregar dados.",
            daycareName: "Erro",
            professores: '!', alunos: '!', turmas: '!', matriculas: '!'
        });
    }
});

app.use('/senha', senhaRouter);
app.use('/turmas', privateRoute, turmasRouter); 
app.use('/matriculas', privateRoute, matriculasRouter); 
app.use('/professores', privateRoute, professoresRoutes); 

app.get('/termossete', (req, res) => {
    res.render('TERMOS/termossete', { title: 'Termos de Uso - Sete Educacional' });
});

app.get('/testar-banco', async (req, res) => {
  try{
        const { error, count } = await supabase.from('professor').select('*', { count: 'exact', head: true });
        if (error) throw error;
        res.status(200).json({ status: 'success', details: `Banco conectado. Registros: ${count}` });
  }catch(error){
    res.status(500).json({ status: 'error', error: error.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

export default app;