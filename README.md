# Testes _end-to-end_ com Cypress

Fork do curso de testes com Cypress da [Escola TAT](https://udemy.com/user/walmyr/),
com configuração modernizada e cobertura adicional para a aplicação Scratch.

## Conteúdo original do curso

Os tópicos abaixo descrevem o material original; recursos e nomes de serviços,
como Cypress Studio e Dashboard, podem diferir da versão atual.

- Como otimizar ainda mais o _setup_ de um projeto Cypress
- Como analisar estaticamente o código de teste para garantir o uso de convenções definidas pela comunidade
- Como criar testes e2e para diferentes funcionalidades de uma aplicação web, tais como _Sign up_, _Login_, CRUD, etc.
- Como testar recebimento de _e-mails_
- Como testar _upload_ de arquivos
- Como interagir com componentes renderizados dentro de iFrames
- Como interceptar requisições para tornar os testes mais robustos
- Como proteger dados sensíveis
- Como criar testes sem precisar codificar utilizando o _Cypress Studio_
- Como testar a responsividade da aplicação simulando seu uso em um dispositivo móvel
- Como armazenar a sessão do usuário no cache para otimizar o processo de autenticação
- Como criar e documentar comandos customizados
- Como configurar um _pipeline_ de integração contínua com múltiplas fases e paralelização
- Como integrar os testes com o Dashboard do Cypress
- Como categorizar os testes e executá-los por suas _tags_
- Como documentar um projeto de testes e2e
- Como alterar o tema do _Test Runner_ 🥸

## Executar a versão atual

Este fork mantém o material do curso em [cypress/Lessons](./cypress/Lessons/lessons/),
com os [pré-requisitos atualizados](./cypress/Lessons/lessons/_pre-requirements_.md).
Os exemplos das demais aulas são históricos (Cypress 8); os comandos abaixo
correspondem ao projeto atualizado para Cypress 16 e ESLint 10.

### Pré-requisitos

- Node.js **26.x** e npm, conforme [.node-version](./.node-version).
- Acesso à aplicação de demonstração em <https://notes-serverless-app.com>.
- Chrome instalado para usar `--browser chrome` (como no CI). Sem essa opção,
  o Cypress utiliza o Electron incluído, atualmente depreciado pelo Cypress.
- Não é necessário Docker nem uma assinatura do Cypress Cloud.

Se utiliza **fnm** e já tem o Node 26 instalado, execute na raiz do projeto:

```powershell
fnm use
```

O fnm lê [.node-version](./.node-version). Confira que `node --version` retorna
`v26.x.x` antes de instalar as dependências e executar os testes:

```powershell
node --version
npm --version
npm ci
npm run lint
npm run test:public -- --browser chrome
npm run test:tablet -- --browser chrome
```

### Suítes e cobertura

| Comando | Cobertura | Credenciais |
| --- | --- | --- |
| `npm run test:public -- --browser chrome` | [Login](./cypress/integration/login.spec.js), [cadastro](./cypress/integration/signup.spec.js) e [navegação/rotas protegidas](./cypress/integration/navigation.spec.js), incluindo falhas simuladas | Nenhuma |
| `npm run test:tablet -- --browser chrome` | Mesma suíte pública em 767 × 480 | Nenhuma |
| `npm run test:authenticated -- --browser chrome` | [Login real](./cypress/integration/login.spec.js) e [notas/anexos, cancelamento de exclusão, validação, falha de atualização e logout](./cypress/integration/authenticatedScenarios.spec.js) | Conta de teste |
| `npm run test:signup -- --browser chrome` | [Cadastro real com confirmação por e-mail](./cypress/integration/signup.spec.js) | Mailosaur e senha |
| `npm run test:billing -- --browser chrome` | [Compra com cartão de teste do Stripe e falha simulada da API de cobrança](./cypress/integration/billing.spec.js) | Conta de teste |
| `npm test -- --browser chrome` | Todas as suítes acima | Todas |

As tags `@public`, `@authenticated`, `@signup` e `@billing` são processadas por
[`@cypress/grep`](https://github.com/cypress-io/cypress/tree/develop/npm/grep).
Os comandos estão definidos em [package.json](./package.json).
Por exemplo, para executar a suíte autenticada em tablet:

```powershell
npm run test:authenticated -- --browser chrome --config viewportWidth=767,viewportHeight=480
```

Para executar somente as validações públicas de cadastro, sem Mailosaur:

```powershell
npm run test:public -- --browser chrome --spec "cypress\integration\signup.spec.js"
```

Esse comando filtra os testes pela tag `@public`. Já
`npm run test:signup -- --browser chrome` seleciona apenas o cadastro real
com confirmação por e-mail e exige as credenciais abaixo; trocar o navegador
não configura o Mailosaur.

Os testes públicos usam a interface real da aplicação. As respostas de rejeição
de login, cadastro e confirmação são interceptadas: não criam contas e não
comprovam o funcionamento do Cognito. As suítes de conta e e-mail exercitam os
serviços reais. A falha de atualização e a falha de cobrança também são simuladas.

Os testes de notas usam identificadores únicos e tentam excluir somente a nota
criada pelo próprio teste, mesmo após falhas. Uma interrupção do processo ou
indisponibilidade da aplicação pode impedir essa limpeza. O cadastro real cria
uma conta por execução; a mensagem do Mailosaur é removida após sucesso, mas a
conta permanece, pois a aplicação não oferece exclusão de contas.

Use uma conta e um servidor Mailosaur dedicados a testes. Execute a suíte de
cobrança somente na aplicação de demonstração com Stripe em modo de teste;
ela envia uma compra real à API usando um cartão de teste.

### Configurar credenciais locais

Copie [cypress.env.example.json](./cypress.env.example.json) para `cypress.env.json`
e substitua os exemplos pelos valores reais. Esse arquivo já está no `.gitignore`;
nunca envie credenciais ao Git.

- Conta existente: `USER_EMAIL` e `USER_PASSWORD`.
- Cadastro por e-mail: `USER_PASSWORD`, `MAILOSAUR_SERVER_ID` e `MAILOSAUR_API_KEY`.

Os segredos são acessados com `cy.env()`. Configurações públicas, como o breakpoint
da navegação e os filtros de tags, utilizam `Cypress.expose()`.

### Referências de configuração

- [.node-version](./.node-version): versão principal do Node utilizada pelo fnm
  e pelo GitHub Actions.
- [cypress.config.js](./cypress.config.js): URL da aplicação, viewports,
  descoberta dos testes, arquivo de suporte e filtros.
- [eslint.config.js](./eslint.config.js): configuração flat do ESLint 10.
- [Comandos customizados](./cypress/support/commands.js): login/sessão, navegação,
  notas, upload nativo com `selectFile()` e formulário de cobrança.
- [Arquivo de suporte](./cypress/support/index.js): registro dos plugins e comandos.
- [Migração do Cypress](https://docs.cypress.io/app/references/migration-guide) e
  [migração do ESLint](https://eslint.org/docs/latest/use/configure/migration-guide).

Os antigos `cypress.json`, `cypress/plugins/index.js` e `.eslintrc.json` foram
substituídos pelas configurações acima. O Faker agora é importado de
`@faker-js/faker`, e `cypress-grep` foi substituído por `@cypress/grep`.

### GitHub Actions

O [workflow de CI](./.github/workflows/ci.yml) executa lint e a suíte pública em
Chrome, nos viewports desktop (1280 × 720) e tablet (767 × 480), em pushes para
`main` e pull requests. Utiliza Node 26, definido em [.node-version](./.node-version),
`npm ci` e não precisa de segredos nem gravações no Cypress Cloud, inclusive em
pull requests de forks.

Em **Actions → ci → Run workflow**, habilite opcionalmente:

- `run_authenticated`: exige os secrets `CYPRESS_USER_EMAIL` e `CYPRESS_USER_PASSWORD`.
- `run_signup`: exige `CYPRESS_USER_PASSWORD`, `CYPRESS_MAILOSAUR_SERVER_ID` e
  `CYPRESS_MAILOSAUR_API_KEY`.

A suíte de cobrança não é executada automaticamente. Falta de secrets em uma
suíte solicitada causa erro explícito, não sucesso com testes ignorados.
Vídeos e screenshots disponíveis são publicados como artifacts por sete dias.
Os testes ainda dependem da disponibilidade da aplicação externa.

A gravação no Cypress Cloud é opcional: configure seu próprio project ID e
`CYPRESS_RECORD_KEY` antes de acrescentar `--record` ao comando escolhido.

O override de `minimatch` em [package.json](./package.json) é restrito ao
`@typescript-eslint/typescript-estree` para corrigir
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
Ele deve ser reavaliado quando o parser adotar uma versão corrigida nativamente.

## Aulas do curso

Comece pelos [pré-requisitos atualizados](./cypress/Lessons/lessons/_pre-requirements_.md).
Para estudar o material original, consulte a
[apresentação da aplicação](./cypress/Lessons/lessons/_the-app_.md) e a
[aula de integração contínua](./cypress/Lessons/lessons/7.md).
Para executar este fork, use as instruções atuais deste README, não os comandos
e versões antigos apresentados nas aulas.