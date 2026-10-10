# Desafio DevSecOps — Gerenciador de Tarefas

## Sobre o Projeto
Este repositório faz parte do desafio prático do módulo de DevSecOps da ADA Tech.
Você receberá este projeto com vulnerabilidades propositais e uma pipeline incompleta.
Seu objetivo é **implementar a pipeline de segurança** e **corrigir as vulnerabilidades**.

## Estado atual
Os scanners de segurança (Gitleaks, Semgrep e Grype) foram implementados e testados. A correção das vulnerabilidades, a assinatura com Cosign e o deploy ainda estão pendentes.

## Sua missão
1. Implementar os steps de segurança no `pipeline.yml`
2. Fazer a pipeline **quebrar** ao detectar os problemas
3. Corrigir as vulnerabilidades encontradas
4. Fazer a pipeline **passar** com tudo verde ✅
5. Documentar o funcionamento da pipeline neste README

## O que implementar
- [X] Secrets Scanning com **Gitleaks**
- [X] SAST com **Semgrep**
- [X] SCA com **Grype**
- [ ] Assinatura do artefato com cosign
- [ ] Deploy com **GitHub Pages**

## Como a pipeline funciona

A pipeline DevSecOps foi implementada utilizando o **GitHub Actions**, com o objetivo de automatizar as verificações de segurança antes da publicação da aplicação.

O processo segue o conceito de **Break the Build**, ou seja, quando uma vulnerabilidade é detectada, a execução é interrompida e o deploy não é realizado.

### Step 1 — Checkout do Código

Utiliza a action `actions/checkout@v4` para obter o código do repositório.

A configuração `fetch-depth: 0` disponibiliza o histórico completo do Git para as ferramentas de análise.

### Step 2 — Build

Realiza uma verificação básica da existência dos arquivos da aplicação na pasta `src/`.

Essa etapa confirma a presença dos arquivos esperados, mas não realiza uma compilação ou testes automatizados.

### Step 3 — Secrets Scanning com Gitleaks

O **Gitleaks** verifica a presença de informações sensíveis expostas no repositório, como tokens, senhas e chaves de API.

Foi utilizada a action `gitleaks/gitleaks-action@v2`.

**Resultado dos testes:**
- Inicialmente, a ferramenta não encontrou segredos porque analisava apenas as alterações do último commit.
- Foi realizado um teste com commits contendo credenciais de exemplo.
- O Gitleaks identificou duas ocorrências pela regra `generic-api-key`, no arquivo `src/script.js`.
- A pipeline falhou e impediu a execução do job de deploy.

Esse teste demonstrou que o Gitleaks consegue bloquear a pipeline quando detecta credenciais expostas.

### Step 4 — SAST com Semgrep

O **Semgrep** realiza uma análise estática do código-fonte para identificar padrões de programação inseguros.

A ferramenta foi configurada para analisar a pasta `src/`, utilizando regras automáticas e regras específicas para XSS.

**Resultado dos testes:**
- Foram analisados 4 arquivos.
- Foram executadas 218 regras.
- Foi identificada uma vulnerabilidade relacionada ao uso de `eval()` no arquivo `src/script.js`.
- A análise retornou código de saída 1, demonstrando o bloqueio da pipeline.

A utilização de `eval()` com conteúdo fornecido pelo usuário pode permitir a execução de código JavaScript não autorizado.

### Step 5 — SCA com Grype

O **Grype** realiza uma análise das dependências do projeto em busca de vulnerabilidades conhecidas (CVEs).

Foi configurado com o parâmetro `--fail-on medium`, que faz a execução falhar ao encontrar vulnerabilidades de severidade média, alta ou crítica.

**Resultado dos testes:**
- Foram identificadas vulnerabilidades em dependências desatualizadas.
- Entre os pacotes analisados estavam Axios, Lodash e outras dependências transitivas.
- A ferramenta retornou código de saída 1, bloqueando a pipeline.

Essa etapa ajuda a evitar que bibliotecas com vulnerabilidades conhecidas sejam utilizadas na aplicação.

### Evidências de execução da pipeline

Para comprovar o funcionamento dos controles de segurança, foram registrados os commits e as execuções do GitHub Actions.

**Gitleaks — Detecção de segredos**

- Commit: [`9aafa96bcfd33258690e3e0e2db628f18b182c11`](https://github.com/Mariars11/projeto-devsecop-desafio/commit/9aafa96bcfd33258690e3e0e2db628f18b182c11)
- Execução: [GitHub Actions — Gitleaks detectou segredos](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38061554071)
- Resultado: duas ocorrências da regra `generic-api-key` no arquivo `src/script.js`. O job de segurança falhou e o deploy foi bloqueado.

**Semgrep — Análise estática de segurança**

- Commit: [452d2f1725c20b062cd929611122a622f0374336](https://github.com/Mariars11/projeto-devsecop-desafio/commit/452d2f1725c20b062cd929611122a622f0374336)
- Execução: [GitHub Actions - SemGrep](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38060426096).
- Resultado: identificação do uso inseguro de `eval()` no arquivo `src/script.js`, causando falha na pipeline.

**Grype — Análise de dependências**

- Commit: [3788e57d038f6f0309e3ba9b3faf6854e4d1c4b6](https://github.com/Mariars11/projeto-devsecop-desafio/commit/3788e57d038f6f0309e3ba9b3faf6854e4d1c4b6)
- Execução: [GitHub Actions — Grype](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38060743966)
- Resultado: identificação de vulnerabilidades em dependências do projeto, com bloqueio por severidade média ou superior.

Essas evidências demonstram o funcionamento do conceito de **Break the Build**, impedindo a publicação quando as verificações de segurança encontram problemas.

### Step 6 — Assinatura com Cosign

*Documentação a completar após implementar e validar a assinatura real do artefato.*

### Step 7 — Verificação e Deploy com GitHub Pages

*Documentação a completar após validar a assinatura e publicar a aplicação.*

## URL de Produção
> Adicione aqui o link do GitHub Pages após o deploy.