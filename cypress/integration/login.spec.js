describe('Login form', { tags: '@public' }, () => {
  beforeEach(() => cy.visit('/login'))

  it('requires both email and password before enabling submission', () => {
    cy.contains('button', 'Login').should('be.disabled')
    cy.get('#email').type('reader@example.com')
    cy.contains('button', 'Login').should('be.disabled')

    cy.get('#email').clear()
    cy.get('#password').type('Example-password-123!')
    cy.contains('button', 'Login').should('be.disabled')

    cy.get('#email').type('reader@example.com')
    cy.contains('button', 'Login').should('be.enabled')
  })

  it('does not send an authentication request for an invalid email', () => {
    cy.intercept('POST', 'https://cognito-idp.*.amazonaws.com/**').as('authenticate')
    cy.get('#email').type('not-an-email')
    cy.get('#password').type('Example-password-123!')
    cy.contains('button', 'Login').click()

    cy.get('#email').should($email => {
      expect($email[0].validity.typeMismatch).to.equal(true)
    })
    cy.get('@authenticate.all').should('have.length', 0)
    cy.location('pathname').should('eq', '/login')
  })

  it('shows a rejected login and allows another attempt (stubbed authentication)', () => {
    cy.intercept('POST', 'https://cognito-idp.*.amazonaws.com/**', {
      statusCode: 400,
      body: {
        __type: 'NotAuthorizedException',
        message: 'Incorrect username or password.'
      }
    }).as('rejectedLogin')
    cy.window().then(win => cy.stub(win, 'alert').as('loginError'))

    cy.get('#email').type('reader@example.com')
    cy.get('#password').type('Incorrect-password-123!')
    cy.contains('button', 'Login').click()

    cy.wait('@rejectedLogin').its('response.statusCode').should('eq', 400)
    cy.get('@loginError').should('have.been.calledWith', 'Incorrect username or password.')
    cy.contains('button', 'Login').should('be.enabled')
    cy.location('pathname').should('eq', '/login')

    cy.get('#password').clear()
    cy.get('#password').type('Another-password-123!')
    cy.contains('button', 'Login').click()
    cy.get('@loginError').should('have.been.calledTwice')
    cy.visit('/settings')
    cy.location('pathname').should('eq', '/login')
  })
})

describe('Real-account login', { tags: '@authenticated' }, () => {
  it('successfully logs in without a cached session', () => {
    cy.login(undefined, undefined, { cacheSession: false })
    cy.reload()
    cy.contains('h1', 'Your Notes').should('be.visible')
    cy.openNavigation()
    cy.contains('.navbar a', 'Logout').should('be.visible')
  })
})