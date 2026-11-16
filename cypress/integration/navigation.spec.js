describe('Public navigation and route protection', { tags: '@public' }, () => {
  it('navigates between home, signup, and login at the configured viewport', () => {
    cy.visit('/')
    cy.contains('h1', 'Scratch').should('be.visible')
    cy.contains('.lander a', 'Signup').click()
    cy.location('pathname').should('eq', '/signup')
    cy.get('#confirmPassword').should('be.visible')

    cy.openNavigation()
    cy.contains('.navbar a', 'Login').should('be.visible').click()
    cy.location('pathname').should('eq', '/login')
    cy.get('#password').should('be.visible')

    cy.contains('.navbar-brand', 'Scratch').click()
    cy.contains('h1', 'Scratch').should('be.visible')
  })

  for (const route of ['/notes/new', '/notes/nonexistent-note', '/settings']) {
    it(`requires authentication for ${route} and preserves the destination`, () => {
      cy.visit(route)
      cy.location('pathname').should('eq', '/login')
      cy.location('search').should('eq', `?redirect=${route}`)
      cy.get('#email').should('be.visible')
      cy.get('#content').should('not.exist')
      cy.get('#storage').should('not.exist')
      cy.contains('h1', 'Your Notes').should('not.exist')
    })
  }

  it('shows an unknown-route message and allows returning home', () => {
    cy.visit('/nonexistent-page')
    cy.contains('h3', 'Sorry, page not found!').should('be.visible')
    cy.contains('.navbar-brand', 'Scratch').click()
    cy.location('pathname').should('eq', '/')
    cy.contains('h1', 'Scratch').should('be.visible')
  })
})
