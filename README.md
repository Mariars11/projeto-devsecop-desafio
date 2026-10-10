# 🔐 Desafio DevSecOps — Gerenciador de Tarefas

## Sobre o Projeto

Este repositório faz parte do desafio prático do módulo de **DevSecOps da ADA Tech**.

O projeto consiste em uma aplicação simples de gerenciamento de tarefas, disponibilizada inicialmente com vulnerabilidades propositais e uma pipeline de CI/CD incompleta.

O objetivo do desafio é implementar controles de segurança no GitHub Actions, identificar as vulnerabilidades existentes, demonstrar o conceito de **Break the Build**, corrigir os problemas encontrados e publicar a aplicação somente após a aprovação das verificações de segurança.

## Estado atual

Os scanners de segurança **Gitleaks, Semgrep e Grype** foram implementados e testados, demonstrando que a pipeline pode ser interrompida ao identificar problemas de segurança.

Também foi implementado o gerenciamento de secrets com **GitHub Actions Secrets**, variáveis de ambiente e substituição de marcadores com `sed`.

As credenciais anteriormente presentes no código-fonte foram substituídas por referências a variáveis configuradas no repositório. Para a demonstração, são utilizados apenas valores fictícios, pois o JavaScript da aplicação será público após o deploy no GitHub Pages.

Ainda estão pendentes:

- A validação da execução do gerenciamento de secrets.
- A correção das vulnerabilidades identificadas pelo Semgrep e pelo Grype.
- O tratamento dos segredos encontrados no histórico Git.
- A implementação da assinatura real do artefato com Cosign.
- A verificação da assinatura e a validação do deploy no GitHub Pages.

## Sua missão

1. Implementar os steps de segurança no `pipeline.yml`.
2. Fazer a pipeline **quebrar** ao detectar vulnerabilidades.
3. Corrigir as vulnerabilidades encontradas.
4. Fazer a pipeline **passar** com todas as verificações aprovadas.
5. Documentar o funcionamento da pipeline e as evidências neste README.

## O que implementar

- [x] Secrets Scanning com **Gitleaks**
- [x] Verificação complementar do histórico Git com **Gitleaks**
- [x] SAST com **Semgrep**
- [x] SCA com **Grype**
- [x] Gerenciamento de secrets com **GitHub Actions Secrets e sed**
- [ ] Validar a execução do gerenciamento de secrets
- [ ] Corrigir as vulnerabilidades identificadas
- [ ] Tratar os segredos presentes no histórico Git
- [ ] Assinatura real do artefato com **Cosign**
- [ ] Verificação da assinatura do artefato
- [ ] Validar o deploy com **GitHub Pages**

## Como a pipeline funciona

A pipeline DevSecOps utiliza o **GitHub Actions** para automatizar as verificações de segurança antes da publicação da aplicação.

O processo segue o conceito de **Break the Build**: quando uma ferramenta identifica um problema configurado para bloquear a execução, o job de build falha e o job de deploy não é iniciado.

O workflow está organizado em dois jobs:

- **Build, Segurança e Assinatura:** realiza o checkout, prepara o código, executa as análises de segurança, empacota o site e prepara o artefato.
- **Verificação e Deploy:** recebe o artefato gerado e contém as etapas de verificação da assinatura e publicação no GitHub Pages.

A assinatura e a verificação criptográfica ainda estão em implementação. Atualmente, o workflow contém uma assinatura simulada, que deverá ser substituída pela assinatura real com Cosign.

### Step 1 — Checkout do Código

Utiliza a action `actions/checkout@v4` para obter o código do repositório.

A configuração `fetch-depth: 0` disponibiliza o histórico completo do Git, permitindo que a etapa complementar do Gitleaks analise os commits anteriores.

### Step 2 — Gerenciamento de Secrets com GitHub Actions

O arquivo `src/script.js` continha credenciais diretamente no código-fonte.

Para seguir as instruções do desafio, essas credenciais foram substituídas pelos marcadores:

```javascript
const API_KEY = "__API_KEY__";
const DB_PASSWORD = "__DB_PASSWORD__";
```

Foram configurados dois secrets no GitHub Actions:

- `API_KEY`
- `DB_PASSWORD`

Durante a execução da pipeline, o step **Inserir Secrets no JavaScript** utiliza `env` para acessar os valores configurados e o comando `sed` para substituir os marcadores no arquivo.

Também foi adicionada uma verificação para interromper a execução caso algum dos secrets esteja vazio ou não tenha sido configurado.

**Medidas implementadas:**

- Remoção das credenciais diretamente do código-fonte atual.
- Armazenamento dos valores de demonstração nos GitHub Actions Secrets.
- Utilização de variáveis de ambiente no workflow.
- Substituição automática dos marcadores por meio do comando `sed`.
- Validação da existência dos valores antes da substituição.

**Resultado:** o mecanismo de gerenciamento de secrets foi implementado. A evidência de sua execução será registrada após a validação no GitHub Actions.

**Observação de segurança:** o GitHub Secrets protege os valores enquanto estão armazenados e são acessados pelo workflow. Entretanto, valores inseridos em um arquivo JavaScript publicado no GitHub Pages ficam acessíveis aos visitantes. Por isso, nesta atividade são utilizados exclusivamente valores fictícios, sem informações sensíveis reais.

### Step 3 — Build

Realiza uma verificação básica dos arquivos da aplicação na pasta `src/`.

O step lista os arquivos disponíveis e confirma a execução da etapa de preparação.

Essa verificação não realiza compilação nem testes automatizados, pois a aplicação é composta por arquivos estáticos.

### Step 4 — Secrets Scanning com Gitleaks

O **Gitleaks** identifica possíveis informações sensíveis expostas no repositório, como tokens, senhas e chaves de API.

Foi utilizada a action oficial:

`gitleaks/gitleaks-action@v2`

O objetivo é impedir que credenciais expostas sejam introduzidas no projeto.

**Resultado dos testes:**

- Inicialmente, a ferramenta não encontrou segredos em uma execução que analisava apenas as alterações do último commit.
- Foi realizado um teste com commits contendo credenciais de exemplo.
- O Gitleaks identificou duas ocorrências pela regra `generic-api-key`, no arquivo `src/script.js`.
- A pipeline falhou e impediu a execução do job de deploy.

Esse teste demonstrou o funcionamento do bloqueio automático ao detectar credenciais expostas.

#### Verificação complementar do histórico Git

Além da action oficial, foi implementada uma etapa adicional para analisar o histórico completo do repositório.

O comando utilizado foi:

```bash
gitleaks git . --redact --exit-code 1
```

O parâmetro `--redact` oculta os valores sensíveis nos resultados, enquanto `--exit-code 1` faz a etapa retornar erro quando encontra segredos.

Essa verificação complementar foi necessária porque uma credencial removida do arquivo atual ainda pode permanecer registrada em commits antigos.

**Resultado do teste:**

- Foram analisados 22 commits.
- Foram encontradas 3 ocorrências de segredos.
- A execução retornou código de saída 1.
- O job de deploy não foi executado.

O teste confirmou que a remoção de credenciais do código atual não elimina automaticamente sua exposição no histórico Git.

### Step 5 — SAST com Semgrep

O **Semgrep** realiza uma análise estática do código-fonte para identificar padrões de programação inseguros.

A ferramenta foi configurada para analisar a pasta `src/`, utilizando regras automáticas e regras específicas para XSS.

Comando utilizado:

```bash
semgrep scan --config auto --config p/xss --error src/
```

O parâmetro `--error` faz a execução falhar quando são encontrados problemas reportados pelas regras.

**Resultado dos testes:**

- Foram analisados 4 arquivos.
- Foram executadas 218 regras.
- Foi identificada uma vulnerabilidade relacionada ao uso de `eval()` no arquivo `src/script.js`.
- A ferramenta retornou código de saída 1, demonstrando o bloqueio da pipeline.

O uso de `eval()` com conteúdo fornecido pelo usuário pode permitir a execução de código JavaScript não autorizado.

A correção dessa vulnerabilidade ainda será realizada e validada.

### Step 6 — SCA com Grype

O **Grype** realiza uma análise das dependências do projeto em busca de vulnerabilidades conhecidas, identificadas por registros como CVEs.

Foi configurado com o parâmetro:

```bash
grype dir:. --fail-on medium
```

Esse parâmetro faz a execução falhar quando são encontradas vulnerabilidades de severidade **média, alta ou crítica**.

Antes da análise, a pipeline gera o arquivo de registro das dependências com:

```bash
npm install --package-lock-only --no-audit --no-fund
```

**Resultado dos testes:**

- Foram identificadas vulnerabilidades em dependências desatualizadas.
- Entre os pacotes analisados estavam Axios, Lodash e dependências transitivas.
- A ferramenta retornou código de saída 1.
- A pipeline foi bloqueada devido às vulnerabilidades encontradas.

Essa etapa demonstra a importância de verificar as bibliotecas utilizadas pelo projeto, além do código-fonte desenvolvido.

A atualização ou remoção das dependências vulneráveis ainda será realizada e validada.

### Step 7 — Empacotamento e Hash do Artefato

Após as verificações de segurança, a pipeline contém uma etapa responsável por empacotar os arquivos da aplicação em um artefato chamado `artifact.tar`.

Também é calculado o hash SHA256 do arquivo, registrado em `artifact.tar.sha256`.

O hash permite identificar alterações no conteúdo do artefato, mas não substitui a verificação de autenticidade fornecida por uma assinatura digital.

Esses arquivos serão utilizados nas etapas de assinatura e verificação com Cosign.

### Step 8 — Assinatura do Artefato com Cosign

O **Cosign** será utilizado para assinar digitalmente o artefato gerado pela pipeline.

A ferramenta já possui uma etapa de instalação no workflow.

Entretanto, a assinatura real ainda não foi implementada. Atualmente, o step de assinatura gera um arquivo de demonstração que não representa uma assinatura criptográfica válida.

O próximo objetivo é substituir essa simulação por uma assinatura real, utilizando o Cosign, e armazenar o bundle de assinatura junto ao artefato.

**Status:** pendente de implementação e validação.

### Step 9 — Verificação e Deploy com GitHub Pages

O segundo job da pipeline é responsável por receber o artefato gerado no primeiro job.

O workflow contém as etapas de:

- Download do artefato.
- Instalação do Cosign.
- Verificação da assinatura, ainda comentada.
- Extração dos arquivos do site.
- Configuração do GitHub Pages.
- Upload do site.
- Deploy em produção.

A verificação da assinatura deverá ser ativada após a implementação da assinatura real com Cosign.

O objetivo final é garantir que o deploy ocorra somente após a aprovação das verificações de segurança e a validação da autenticidade do artefato.

**Status:** estrutura implementada, mas validação final pendente.

## Evidências de execução da pipeline

Para comprovar o funcionamento dos controles de segurança, foram registrados commits e execuções do GitHub Actions.

As evidências abaixo representam os testes de detecção realizados antes da conclusão das correções.

### Gitleaks — Detecção de segredos

**Commit:** [9aafa96bcfd33258690e3e0e2db628f18b182c11](https://github.com/Mariars11/projeto-devsecop-desafio/commit/9aafa96bcfd33258690e3e0e2db628f18b182c11)

**Execução:** [GitHub Actions — Gitleaks detectou segredos](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38061554071)

**Resultado:** duas ocorrências da regra `generic-api-key` no arquivo `src/script.js`. O job de segurança falhou e o deploy foi bloqueado.

### Gitleaks — Verificação do histórico completo

**Execução:** [GitHub Actions — Gitleaks Histórico Completo](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38062953936)

**Resultado:** análise de 22 commits, com identificação de 3 ocorrências de segredos. A execução retornou erro e bloqueou o deploy.

### Semgrep — Análise estática de segurança

**Commit:** [452d2f1725c20b062cd929611122a622f0374336](https://github.com/Mariars11/projeto-devsecop-desafio/commit/452d2f1725c20b062cd929611122a622f0374336)

**Execução:** [GitHub Actions — Semgrep](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38060426096)

**Resultado:** identificação do uso inseguro de `eval()` no arquivo `src/script.js`, causando falha na pipeline.

### Grype — Análise de dependências

**Commit:** [3788e57d038f6f0309e3ba9b3faf6854e4d1c4b6](https://github.com/Mariars11/projeto-devsecop-desafio/commit/3788e57d038f6f0309e3ba9b3faf6854e4d1c4b6)

**Execução:** [GitHub Actions — Grype](https://github.com/Mariars11/projeto-devsecop-desafio/actions/runs/38060743966)

**Resultado:** identificação de vulnerabilidades em dependências do projeto, com bloqueio por severidade média ou superior.

### Gerenciamento de Secrets — GitHub Actions

**Implementação:** substituição das credenciais presentes no código-fonte por marcadores, configuração de GitHub Actions Secrets e utilização de `env` e `sed` no workflow.

**Evidência de execução:** pendente de validação.

## Correções de vulnerabilidades

As verificações de segurança identificaram problemas que deverão ser corrigidos para permitir a aprovação da pipeline.

| Problema identificado | Ferramenta | Situação |
|---|---|---|
| Credenciais expostas no código-fonte | Gitleaks | Substituição por marcadores implementada; validação pendente |
| Segredos presentes em commits antigos | Gitleaks | Pendente |
| Uso inseguro de `eval()` | Semgrep | Pendente |
| Uso de `innerHTML` com entrada do usuário | Revisão do código | Pendente |
| Exposição de detalhes internos de erros | Revisão do código | Pendente |
| Dependências com vulnerabilidades conhecidas | Grype | Pendente |

As correções serão documentadas conforme forem implementadas e validadas, preservando as evidências dos testes anteriores.

## Resultado esperado

Ao concluir o desafio, a pipeline deverá:

1. Preparar os arquivos da aplicação.
2. Executar as verificações de segurança com Gitleaks, Semgrep e Grype.
3. Interromper a execução quando encontrar vulnerabilidades que violem os critérios configurados.
4. Gerar o artefato do site após a aprovação das verificações.
5. Assinar digitalmente o artefato com Cosign.
6. Verificar a assinatura antes da publicação.
7. Publicar a aplicação no GitHub Pages somente após a aprovação de todas as etapas.

O objetivo é demonstrar a aplicação de práticas de **DevSecOps**, integrando segurança ao processo de desenvolvimento e entrega contínua.

## URL de Produção

O link do GitHub Pages será adicionado após a conclusão e validação do deploy.