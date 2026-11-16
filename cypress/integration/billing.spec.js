describe('Billing with Stripe test-mode card details', { tags: '@billing' }, () => {
  beforeEach(() => cy.login())

  it('confirms a successful purchase in the API response and the UI', () => {
    cy.intercept('POST', '**/billing').as('payment')
    cy.on('window:alert', cy.stub().as('paymentMessage'))
    cy.fillSettingsFormAndSubmit()

    cy.wait('@payment').then(({ request, response }) => {
      expect(response.statusCode).to.equal(200)
      expect(response.body).to.deep.equal({ status: true })
      expect(request.body.storage).to.equal('1')
      expect(request.body.source).to.be.a('string').and.not.be.empty
    })
    cy.get('@paymentMessage').should('have.been.calledWith', 'Your card has been charged successfully!')
    cy.location('pathname').should('eq', '/')
    cy.contains('h1', 'Your Notes').should('be.visible')
  })

  it('shows a failed purchase without navigating away (stubbed billing API)', () => {
    cy.intercept('POST', '**/billing', {
      statusCode: 402,
      body: { message: 'Payment declined' }
    }).as('declinedPayment')
    cy.on('window:alert', cy.stub().as('paymentMessage'))
    cy.fillSettingsFormAndSubmit()

    cy.wait('@declinedPayment').its('response.statusCode').should('eq', 402)
    cy.get('@paymentMessage').should('have.been.calledOnce')
    cy.get('@paymentMessage').should('not.have.been.calledWith', 'Your card has been charged successfully!')
    cy.location('pathname').should('eq', '/settings')
    cy.get('#name').should('have.value', 'Mary Doe')
    cy.get('#storage').should('have.value', '1')
    cy.contains('button', 'Purchase').should('be.enabled')
  })
})
