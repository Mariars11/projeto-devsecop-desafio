// Referencias substituidas pelo GitHub Actions durante o build.
// Utilizar somente valores ficticios, pois este JS sera publico.
const API_KEY = "__API_KEY__";
const DB_PASSWORD = "__DB_PASSWORD__";

// Busca tarefas do "banco de dados"
fetch('db.json')
    .then(response => response.json())
    .then(data => {
        document.getElementById('db-status').innerText = data.status;

        const list = document.getElementById('task-list');
        data.itens.forEach(item => {
            let li = document.createElement('li');
            li.innerText = item.task;
            list.appendChild(li);
        });
    })
   .catch(err => {
        // Registra o erro para depuracao sem exibir detalhes na pagina.
        console.error('Erro ao carregar tarefas:', err);

        document.getElementById('db-status').innerText =
            'Nao foi possivel carregar as tarefas.';
    });

// Adiciona nova tarefa na tela
function addTask() {
    const input = document.getElementById('new-task');
    const output = document.getElementById('output');

    // Evita XSS: trata a entrada do usuario como texto, nao como HTML.
    const li = document.createElement('li');
    li.textContent = input.value;
    output.replaceChildren(li);

    // CORRECAO SAST — Remove o uso inseguro de eval()
    // Registra a tarefa sem executar codigo fornecido pelo usuario.
    console.log('Tarefa adicionada:', input.value);

    input.value = '';
}
