# Desafio DevSecOps — ADA Tech

## Sobre o projeto

Projeto desenvolvido para o desafio do módulo de DevSecOps da ADA Tech.

O objetivo foi implementar uma pipeline de segurança no GitHub Actions, identificar vulnerabilidades, corrigir os problemas encontrados e publicar a aplicação no GitHub Pages.

O desafio utiliza o conceito de **Break the Build**, em que a pipeline é interrompida quando uma verificação de segurança encontra problemas.

## Status do desafio

- [x] Implementar Gitleaks para detectar secrets
- [x] Verificar e limpar o histórico Git
- [x] Configurar GitHub Actions Secrets
- [x] Implementar Semgrep para análise estática
- [x] Implementar Grype para análise de dependências
- [x] Corrigir as vulnerabilidades encontradas
- [x] Demonstrar o Break the Build
- [x] Implementar assinatura e verificação com Cosign
- [x] Publicar a aplicação no GitHub Pages
- [x] Testar a aplicação publicada

## Pipeline

O workflow está no arquivo `.github/workflows/pipeline.yml` e possui dois jobs:

**Build, Segurança e Assinatura:** prepara a aplicação, executa as ferramentas de segurança, gera o artefato e realiza sua assinatura digital.

**Verificação e Deploy:** verifica a assinatura do artefato antes de publicar a aplicação no GitHub Pages.

### 1. Gitleaks — Secrets Scanning

O Gitleaks identifica credenciais e informações sensíveis expostas no código ou no histórico Git. É importante para evitar que secrets sejam publicados no repositório.

Nos primeiros testes, encontrou duas ocorrências no arquivo `src/script.js` e bloqueou a pipeline.

Também foi configurada a análise do histórico completo:

```bash
gitleaks git . --redact --exit-code 1
```

Essa verificação encontrou três ocorrências em commits antigos.

**Correções realizadas:**

- Substituição das credenciais por marcadores no JavaScript.
- Configuração de valores fictícios no GitHub Actions Secrets.
- Substituição dos marcadores durante o build utilizando `env` e `sed`.
- Limpeza do histórico Git com `git-filter-repo`.

O GitHub Actions Secrets permite configurar valores sensíveis fora do código-fonte. Neste projeto, foram utilizados apenas valores fictícios, pois o JavaScript publicado no GitHub Pages pode ser visualizado por qualquer pessoa.

Comando utilizado para limpar o histórico:

```powershell
git filter-repo --replace-text ..\substituicoes.txt --force
```

Após as correções, as duas verificações do Gitleaks passaram.

### 2. Semgrep — SAST

O Semgrep realiza análise estática do código (SAST), identificando padrões inseguros sem precisar executar a aplicação. É importante para encontrar possíveis vulnerabilidades antes que o código seja publicado.

Foi configurado com o comando:

```bash
semgrep scan --config auto --config p/xss --error src/
```

**Problema encontrado:** uso de `eval()` com entrada do usuário no `src/script.js`, permitindo a execução de código fornecido pelo usuário.

Antes:

```javascript
eval('console.log("Tarefa adicionada: ' + input.value + '")');
```

Depois:

```javascript
console.log('Tarefa adicionada:', input.value);
```

A correção removeu a execução dinâmica de código.

Após a alteração, o Semgrep analisou quatro arquivos com 218 regras e retornou **0 findings**.

### 3. Grype — SCA

O Grype identifica vulnerabilidades conhecidas nas dependências do projeto. Essa verificação é importante porque bibliotecas externas também podem apresentar riscos de segurança.

Foi configurado para bloquear vulnerabilidades de severidade média ou superior:

```bash
grype dir:. --fail-on medium
```

**Problemas encontrados:** o primeiro teste identificou vulnerabilidades em `lodash`, `axios`, `express` e suas dependências.

As bibliotecas foram atualizadas, mantendo os pacotes utilizados no exercício:

```bash
npm install lodash@latest axios@latest express@latest --save-exact
```

Após essa correção, restou um alerta relacionado à action `actions/download-artifact@v4`.

A referência foi atualizada para `actions/download-artifact@v4.1.3`.

Na execução **#14**, o Grype passou e continuou aprovado nas execuções seguintes.

### 4. Correções adicionais no JavaScript

Durante a revisão manual do `src/script.js`, foram encontrados dois problemas que não haviam sido apontados pelo Semgrep.

**Uso de `innerHTML`:** a entrada digitada pelo usuário era inserida diretamente no HTML, podendo permitir XSS.

A correção foi utilizar `textContent` para tratar a entrada como texto:

```javascript
const li = document.createElement('li');
li.textContent = tarefa;
list.appendChild(li);
```

**Exposição de `err.stack`:** detalhes internos dos erros eram exibidos na página.

A correção foi registrar o erro no console e mostrar uma mensagem simples ao usuário:

```javascript
console.error('Erro ao carregar tarefas:', err);

document.getElementById('db-status').innerText =
    'Nao foi possivel carregar as tarefas.';
```

Também foi corrigida a função `addTask()` para adicionar novas tarefas à lista correta, sem apagar as anteriores.

### 5. Artefato e Cosign

Após as verificações de segurança, a pipeline gera o arquivo `artifact.tar` e seu hash SHA256.

O Cosign realiza a assinatura digital do artefato, permitindo verificar sua origem e integridade. Essa etapa é importante para impedir que um artefato alterado ou não autorizado seja publicado.

A assinatura utiliza a identidade do GitHub Actions (OIDC):

```bash
cosign sign-blob artifact.tar \
  --bundle artifact.sigstore.json \
  --yes
```

No segundo job, a assinatura é verificada antes do deploy:

```bash
cosign verify-blob artifact.tar \
  --bundle artifact.sigstore.json \
  --certificate-identity-regexp "^https://github.com/${{ github.repository }}/.github/workflows/.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
```

Se a verificação falhar, a pipeline é interrompida e o deploy não acontece.

Na execução **#17**, a assinatura e a verificação passaram com sucesso.

### 6. GitHub Pages

O GitHub Pages foi utilizado para publicar a aplicação diretamente pelo GitHub Actions. Essa etapa permite disponibilizar o resultado da pipeline e validar o funcionamento da aplicação em produção.

Inicialmente, o deploy falhou porque o GitHub Pages não estava habilitado corretamente no repositório.

Após ajustar a configuração em **Settings → Pages → GitHub Actions**, o deploy passou a funcionar.

Na execução **#17**, os dois jobs foram concluídos com sucesso.

## Evidências dos erros e correções

Os links abaixo registram as execuções em que a pipeline encontrou problemas e interrompeu o processo.

### Gitleaks

**Detecção de secrets no código:** [Execução com erro](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38061554071)

Commit do teste: [9aafa96](https://github.com/Mariars11/projeto-devsecop-desafio/commit/9aafa96bcfd33258690e3e0e2db628f18b182c11)

![Gitleaks detectando secrets](evidencias/gitleaks-deteccao.png)

**Detecção de secrets no histórico Git:** [Execução com erro](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38062953936)

![Gitleaks bloqueando a pipeline](evidencias/gitleaks-historico-bloqueio.png)

### Semgrep

**Erro encontrado:** uso inseguro de `eval()`.

[Execução com erro — Semgrep](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38066141418/job/114254065420)

Commit do teste: [1f6483a](https://github.com/Mariars11/projeto-devsecop-desafio/commit/1f6483a309d60e6e44449496d44954779a66abb6)

**Correção:** substituição do `eval()` por `console.log()`.

### Grype

**Erro encontrado:** dependências vulneráveis identificadas na análise SCA.

[Execução com erro — Grype](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38068389630/job/114260605010)

Commit do teste: [ecc28ac](https://github.com/Mariars11/projeto-devsecop-desafio/commit/ecc28ac3039cb1d3d4a28ab51c89ad5cf01b963c)

**Correção:** atualização das dependências e da action `actions/download-artifact`.

### Gerenciamento de Secrets

[Execução com bloqueio pelo histórico Git](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38063731291/job/114247041441)

O step de substituição dos marcadores funcionou, mas o histórico ainda continha secrets. Após a limpeza com `git-filter-repo`, o Gitleaks passou.

### Cosign e Deploy

[Execução #17 — Pipeline aprovada](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38069937340)

**Resultado:** verificações de segurança, assinatura digital, verificação do artefato e deploy aprovados.

**Observação:** alguns links de commits antigos podem não funcionar após a reescrita do histórico Git. Foram mantidos como referência dos testes realizados.

## Testes da aplicação

Após a publicação no GitHub Pages, foram realizados testes na aplicação:

- Adição de novas tarefas: funcionando.
- Inclusão na lista correta, sem apagar tarefas anteriores: funcionando.
- Teste de XSS: o HTML digitado foi exibido como texto, sem execução.
- Console do navegador: nenhum erro identificado durante os testes.

As tarefas adicionadas permanecem na página enquanto ela está aberta, mas não são armazenadas após uma atualização.

## Resultado final

O conceito de **Break the Build** foi demonstrado durante os testes, quando Gitleaks, Semgrep e Grype identificaram problemas e bloquearam a pipeline.

Após as correções, a execução **#17** foi concluída com sucesso, incluindo a assinatura com Cosign e o deploy no GitHub Pages.

## URL de produção

[Gerenciador de Tarefas — GitHub Pages](https://mariars11.github.io/projeto-devsecop-desafio/)