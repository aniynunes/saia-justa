const SUPABASE_URL = "https://dsdoxpcdmfqlqvvzcetj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZG94cGNkbWZxbHF2dnpjZXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTYwNDEsImV4cCI6MjA4NzM5MjA0MX0.SF3zz1shG2jssjeHskSU_tO65SfbcKM3MBY4NM-VdZs";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", function() 
{
    const loading = document.getElementById("loading"); //section de loading
    const login = document.getElementById("login"); //section de login
    const botao = document.getElementById("btncomecar"); //botão de começar
    const botoesLogin = document.querySelectorAll(".grid-nomes button"); //todos os botões de login
    const votacao = document.getElementById("votacao"); //título da seção de votação
    const cardsContainer = document.getElementById("cards-container"); //container dos cards de votação
    const btnContinuar = document.getElementById("btn-continuar"); //botão de continuar da votação
    const btnResultados = document.getElementById("btnResultados");
    const jaVotou = document.getElementById("ja-votou");
    const btnIrResultados = document.getElementById("btnIrResultados");


    //lista fixa dos participantes
    const participantes = [ 
        {nome: "Anielen", foto: "img/Anielen.svg"},
        {nome: "Gabrielli", foto: "img/Gabrielli.svg"},
        {nome: "Giovana", foto: "img/Giovana.svg"},
        {nome: "Guilherme", foto: "img/Guilherme.svg"},
        {nome: "Joao V.", foto: "img/Joao.svg"},
        {nome: "Lara", foto: "img/Lara.svg"}
    ]

    let usuarioAtual = null; //guarda quem ta logado no momento
    let votos = {}; //vai armazenar votos futuramente

    function vereficarSePodeContinuar()
    {
        const totalNecessario = participantes.length - 1; //total de votos necessários (todos menos o usuário atual)
        const totalVotados = Object.keys(votos).length; //quantidade de votos já feitos

        if (totalVotados === totalNecessario) {
            btnContinuar.disabled = false; //habilita o botão de continuar
        } else {
            btnContinuar.disabled = true; //desabilita o botão de continuar
        }
    }

    //função para configurar os cliques nos botões de emoji
    function configurarCliques()
    {
        const botoesEmoji = document.querySelectorAll(".emoji-btn"); //todos os botões de emoji

        botoesEmoji.forEach(botao => {
            botao.addEventListener("click", function() {
                const emojiEscolhido = this.dataset.emoji;
                const containerEMojis = this.closest(".emojis");
                const pessoa = containerEMojis.dataset.pessoa;

                votos[pessoa] = emojiEscolhido; //armazena o voto para a pessoa correspondente

                containerEMojis.querySelectorAll(".emoji-btn").forEach(btn => {
                    btn.classList.remove("selecionado"); //remove a classe de selecionado de todos os botões
                });

                this.classList.add("selecionado"); //adiciona a classe de selecionado ao botão clicado

                vereficarSePodeContinuar(); //verifica se pode habilitar o botão de continuar
            });
        });
    }

    //função para iniciar a votação, criando os cards dinamicamente
    function iniciarVotacao() 
    {
        votos = {}; 
        btnContinuar.disabled = true; //desabilita o botão de continuar no início da votação
        cardsContainer.innerHTML = ""; //limpa os cards antes de criar novos

        const titulo = document.getElementById("titulo-votacao");
        titulo.textContent = `${usuarioAtual}, atribua um emoji para cada participante. Os votos são anônimos!`; //atualiza o título com o nome do usuário

        participantes.forEach(pessoa => {
            if (pessoa.nome === usuarioAtual) return; //pula o participante que é o usuário atual

            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <img src="${pessoa.foto}" class="foto">
                <div class="info">
                    <h3>${pessoa.nome}</h3>

                    <div class="emojis" data-pessoa="${pessoa.nome}">
                        <button class="emoji-btn" data-emoji="cobra">
                            <img src="img/cobra.svg">
                        </button>

                        <button class="emoji-btn" data-emoji="partido">
                            <img src="img/partido.svg">
                        </button>

                        <button class="emoji-btn" data-emoji="coracao">
                            <img src="img/coracao.svg">
                        </button>

                        <button class="emoji-btn" data-emoji="planta">
                            <img src="img/planta.svg">
                        </button>

                        <button class="emoji-btn" data-emoji="mira">
                            <img src="img/mira.svg">
                        </button>

                        <button class="emoji-btn" data-emoji="biscoito">
                            <img src="img/biscoito.svg">
                        </button>

                        <button class="emoji-btn" data-emoji="mala">
                            <img src="img/mala.svg">
                        </button>
                    </div>
                </div>
            `;

            cardsContainer.appendChild(card);
        });

        configurarCliques();
    }

    async function salvarVotos()
    {
        btnContinuar.disabled = true; //desabilita o botão para evitar múltiplos cliques
        
        const hoje = new Date().toISOString().split('T')[0]; //data atual no formato YYYY-MM-DD

        if(localStorage.getItem("votouHoje") === hoje) {
            document.getElementById("votacao").style.display = "none";
            document.getElementById("ja-votou").style.display = "flex";
            return;
        }

        for (let participante in votos) {
            const { error } = await db
                .from("Votacoes")
                .insert([
                    {
                        usuario: usuarioAtual,
                        participante: participante,
                        emoji: votos[participante]
                    }
                ]);

            if (error) {
                console.error("Erro ao salvar voto:", error);
                alert("Ocorreu um erro ao enviar seu voto. Por favor, tente novamente.");
                btnContinuar.disabled = false; //reabilita o botão para tentar novamente
                return;
            }
        }

        localStorage.setItem("votouHoje", hoje); //marca que o usuário votou hoje

        votacao.style.display = "none"; //esconde a seção de votação
        document.getElementById("resultados").style.display = "block"; //mostra a seção de resultados
        carregarResultados(); //carrega os resultados atualizados
    }

    btnResultados.addEventListener("click", async function() {

        loading.style.display = "none";
        login.style.display = "none";
        votacao.style.display = "none";

        document.getElementById("resultados").style.display = "block";

        await carregarResultados();
    });

    btnContinuar.addEventListener("click", salvarVotos);

    //depois de 5 segundos, mostra o botão de começar
    setTimeout(() => { 
        botao.style.display = "block";
        btnResultados.style.display = "block";
    }, 5000);

    //quando clicar no botão de começar, esconde o loading e mostra o login
    botao.addEventListener("click", function() {
        loading.style.display = "none";
        login.style.display = "flex";
    });

    //quando clicar no botão de ir para resultados, esconde a mensagem de já ter votado e mostra os resultados
    btnIrResultados.addEventListener("click", async function() {
        jaVotou.style.display = "none";
        document.getElementById("resultados").style.display = "block";
        await carregarResultados();
    });

    //adiciona evento de clique para cada botão de login
    botoesLogin.forEach(button => {
        button.addEventListener("click", function() {
            usuarioAtual = button.textContent; //pega o nome do botão clicado
            
            login.style.display = "none"; //esconde o login
            votacao.style.display = "block"; //mostra a seção de votação

            iniciarVotacao(); //inicia a votação
        });
    });

    async function carregarResultados() 
    {
        console.log("CARREGAR RESULTADOS FOI CHAMADA");

        const resultadoContainer = document.getElementById("resultado-container");
        resultadoContainer.innerHTML = ""; //limpa os resultados antes de carregar novos

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const dataFormatada = hoje.toISOString();

        const { data, error } = await db
            .from("Votacoes")
            .select("*")
            .gte("created_at", dataFormatada); //filtra os votos apenas do dia atual

        console.log(data);
        
        if (error) {
            console.error(error);
            return;
        }

        //estrutura para contar votos
        const contagem = {};

        participantes.forEach(p => {
            contagem[p.nome] = {
                cobra: 0,
                partido: 0,
                coracao: 0,
                planta: 0,
                mira: 0,
                biscoito: 0,
                mala: 0
            };
        });

        //conta os votos
        data.forEach(voto => {
            if (contagem[voto.participante]) {
                contagem[voto.participante][voto.emoji]++;
            }

            console.log("Voto vindo do banco:", voto);
        });

        participantes.forEach(pessoa => {
            const card = document.createElement("div");
            card.classList.add("card-resultado");

            card.innerHTML = `
                <h3>${pessoa.nome}</h3>
                <img src="${pessoa.foto}">
                <div class="lista-emojis">
                    ${Object.entries(contagem[pessoa.nome]).map(([emoji, qtd]) => `
                        <div class="item-emoji">
                            <img src="img/${emoji}.svg">
                            <span>${qtd}</span>
                        </div>
                    `).join("")}
                </div>
            `;

            resultadoContainer.appendChild(card);
        });
    }

});
