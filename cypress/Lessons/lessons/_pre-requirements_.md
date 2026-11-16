# Pré-requisitos

Estes pré-requisitos correspondem à versão atual deste fork, com Cypress 16 e
ESLint 10. As demais aulas preservam exemplos históricos do curso e podem citar
versões e comandos antigos; para executar o projeto, siga esta página e o
[README atualizado](../../../README.md).

## Ferramentas necessárias

- [Git](https://git-scm.com/), em uma versão estável atual, para clonar o repositório.
- [Node.js **26.x**](https://nodejs.org/en/), conforme
  [.node-version](../../../.node-version), o campo `engines`
  do [package.json](../../../package.json) e o
  [workflow de CI](../../../.github/workflows/ci.yml). Não utilize as versões
  antigas de Node.js citadas nas aulas.
- **npm**, incluído na instalação do Node.js 26.
- [Google Chrome](https://www.google.com/intl/pt_br/chrome/), em uma versão estável
  atual, para executar os testes com `--browser chrome`, como no CI. Sem essa
  opção, o Cypress utiliza o Electron incluído, atualmente depreciado pelo Cypress.
- [Visual Studio Code](https://code.visualstudio.com/) ou outro editor de sua
  preferência.
- Sistema operacional compatível com os
  [requisitos do Cypress](https://docs.cypress.io/app/get-started/install-cypress#System-requirements).

Após instalar ou atualizar o Node.js, reinicie o terminal do VS Code e confira
as versões. O comando `node --version` deve indicar `v26.x.x`.

Se utiliza **fnm** e já tem o Node 26 instalado, execute `fnm use` na raiz
do projeto para selecionar a versão de [.node-version](../../../.node-version)
antes de conferir:

```powershell
git --version
node --version
npm --version
```

## Instalar as dependências do projeto

Na raiz do repositório, execute:

```powershell
npm ci
npm run lint
npm run test:public -- --browser chrome
npm run test:tablet -- --browser chrome
```

O comando `npm ci` instala as versões registradas no
[package-lock.json](../../../package-lock.json), incluindo Cypress, ESLint,
`@cypress/grep`, `@faker-js/faker` e os plugins utilizados pelos testes.
Não é necessário instalar essas ferramentas globalmente nem reinstalar as
versões antigas apresentadas nas aulas.

A instalação exige acesso à internet para baixar os pacotes e o binário do
Cypress. Os testes acessam a aplicação externa
[Scratch](https://notes-serverless-app.com), que precisa estar disponível.

## Credenciais e serviços opcionais

- **Suíte pública:** não exige conta, Mailosaur, Docker ou Cypress Cloud.
- **Testes autenticados e de cobrança:** exigem uma conta de teste existente,
  com `USER_EMAIL` e `USER_PASSWORD`. Execute cobranças somente na aplicação
  de demonstração com Stripe em modo de teste.
- **Cadastro com confirmação por e-mail:** exige `USER_PASSWORD`,
  `MAILOSAUR_SERVER_ID` e `MAILOSAUR_API_KEY`.
- **Cypress Cloud:** opcional; não é necessário para executar os testes ou o CI.

Para configurar os valores locais, copie
[cypress.env.example.json](../../../cypress.env.example.json) para
`cypress.env.json` na raiz e siga a seção de
[credenciais no README](../../../README.md#configurar-credenciais-locais).
Nunca envie esse arquivo com segredos ao Git.

> `npm test -- --browser chrome` executa todas as suítes e exige todas as
> credenciais. Para começar sem configurar serviços adicionais, utilize
> `npm run test:public -- --browser chrome`.

___

Com os pré-requisitos prontos, consulte a
[apresentação da aplicação](./_the-app_.md).
