Cypress.Commands.add('fillSignupFormAndSubmit', (email, password) => {
  cy.visit('/signup')
  cy.get('#email').type(email)
  cy.get('#password').type(password, { log: false })
  cy.get('#confirmPassword').type(password, { log: false })
  cy.contains('button', 'Signup').click()
  cy.get('#confirmationCode').should('be.visible')
})

Cypress.Commands.add('login', (
  username,
  password,
  { cacheSession = true } = {}
) => {
  return cy.env(['USER_EMAIL', 'USER_PASSWORD'], { log: false }).then(credentials => {
    const email = username ?? credentials.USER_EMAIL
    const userPassword = password ?? credentials.USER_PASSWORD

    expect(typeof email === 'string' && email.length > 0, 'Set USER_EMAIL for real-account tests').to.equal(true)
    expect(typeof userPassword === 'string' && userPassword.length > 0, 'Set USER_PASSWORD for real-account tests').to.equal(true)

    const login = () => {
      cy.visit('/login')
      cy.get('#email').type(email, { log: false })
      cy.get('#password').type(userPassword, { log: false })
      cy.contains('button', 'Login').click()
      cy.contains('h1', 'Your Notes').should('be.visible')
    }

    if (cacheSession) {
      cy.session(['notes-user', email], login, {
        validate() {
          cy.visit('/')
          cy.contains('h1', 'Your Notes').should('be.visible')
        }
      })
    } else {
      login()
    }

    // Restoring a session restores storage, not the current page.
    cy.visit('/')
    cy.contains('h1', 'Your Notes').should('be.visible')
    cy.contains('.list-group-item', 'Create a new note').should('be.visible')
  })
})

Cypress.Commands.add('openNavigation', () => {
  if (Cypress.config('viewportWidth') < Cypress.expose('viewportWidthBreakpoint')) {
    cy.get('.navbar-toggle').should('be.visible').click()
  }
})

const attachFileHandler = () => cy.get('#file').selectFile('cypress/fixtures/example.json')
const noteTitle = note => note.split('\n')[0]

Cypress.Commands.add('createNote', (note, attachFile = false) => {
  cy.visit('/notes/new')
  cy.get('#content').type(note)

  if (attachFile) {
    attachFileHandler()
  }

  cy.contains('button', 'Create').click()

  cy.contains('.list-group-item', noteTitle(note)).should('be.visible')
})

Cypress.Commands.add('editNote', (note, newValue, attachFile = false) => {
  cy.intercept('GET', '**/notes/**').as('getNote')

  cy.contains('.list-group-item', noteTitle(note)).click()
  cy.wait('@getNote')

  cy.get('#content').clear()
  cy.get('#content').type(newValue)

  if (attachFile) {
    attachFileHandler()
  }

  cy.contains('button', 'Save').click()

  cy.contains('.list-group-item', noteTitle(note)).should('not.exist')
  cy.contains('.list-group-item', noteTitle(newValue)).should('be.visible')
})

Cypress.Commands.add('deleteNote', note => {
  cy.contains('.list-group-item', noteTitle(note)).click()
  cy.contains('button', 'Delete').click()

  cy.location('pathname').should('eq', '/')
  cy.contains('.list-group-item', 'Create a new note').should('be.visible')
  cy.contains('.list-group-item', noteTitle(note)).should('not.exist')
})

Cypress.Commands.add('fillSettingsFormAndSubmit', () => {
  const expirationYear = String(new Date().getFullYear() + 2).slice(-2)

  cy.visit('/settings')
  cy.get('#storage').type('1')
  cy.get('#name').type('Mary Doe')
  cy.iframe('.card-field iframe')
    .as('iframe')
    .find('[name="cardnumber"]')
    .type('4242424242424242')
  cy.get('@iframe')
    .find('[name="exp-date"]')
    .type(`12${expirationYear}`)
  cy.get('@iframe')
    .find('[name="cvc"]')
    .type('123')
  cy.get('@iframe')
    .find('[name="postal"]')
    .type('12345')
  cy.contains('button', 'Purchase').click()
})