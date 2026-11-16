import { faker } from '@faker-js/faker'

describe('Signup form', { tags: '@public' }, () => {
  beforeEach(() => cy.visit('/signup'))

  it('requires an email and matching, nonempty passwords', () => {
    cy.contains('button', 'Signup').should('be.disabled')
    cy.get('#email').type('reader@example.com')
    cy.get('#password').type('Example-password-123!')
    cy.contains('button', 'Signup').should('be.disabled')

    cy.get('#confirmPassword').type('Different-password-123!')
    cy.contains('button', 'Signup').should('be.disabled')

    cy.get('#confirmPassword').clear()
    cy.get('#confirmPassword').type('Example-password-123!')
    cy.contains('button', 'Signup').should('be.enabled')

    cy.get('#email').clear()
    cy.contains('button', 'Signup').should('be.disabled')
  })

  it('does not send a signup request for an invalid email', () => {
    cy.intercept('POST', 'https://cognito-idp.*.amazonaws.com/**').as('signup')
    cy.get('#email').type('not-an-email')
    cy.get('#password').type('Example-password-123!')
    cy.get('#confirmPassword').type('Example-password-123!')
    cy.contains('button', 'Signup').click()

    cy.get('#email').should($email => {
      expect($email[0].validity.typeMismatch).to.equal(true)
    })
    cy.get('@signup.all').should('have.length', 0)
    cy.get('#confirmationCode').should('not.exist')
  })

  it('shows password policy errors without entering confirmation (stubbed signup)', () => {
    cy.intercept('POST', 'https://cognito-idp.*.amazonaws.com/**', {
      statusCode: 400,
      body: {
        __type: 'InvalidPasswordException',
        message: 'Password does not conform to policy.'
      }
    }).as('rejectedSignup')
    cy.window().then(win => cy.stub(win, 'alert').as('signupError'))
    cy.get('#email').type('reader@example.com')
    cy.get('#password').type('short')
    cy.get('#confirmPassword').type('short')
    cy.contains('button', 'Signup').click()

    cy.wait('@rejectedSignup')
    cy.get('@signupError').should('have.been.calledWith', 'Password does not conform to policy.')
    cy.contains('button', 'Signup').should('be.enabled')
    cy.get('#email').should('have.value', 'reader@example.com')
    cy.get('#confirmationCode').should('not.exist')
  })

  it('allows retrying a rejected confirmation code (stubbed signup)', () => {
    cy.intercept('POST', 'https://cognito-idp.*.amazonaws.com/**', request => {
      if (request.headers['x-amz-target'].endsWith('.SignUp')) {
        request.reply({
          statusCode: 200,
          body: {
            UserConfirmed: false,
            UserSub: '11111111-1111-4111-8111-111111111111',
            CodeDeliveryDetails: {
              Destination: 'r***@example.com',
              DeliveryMedium: 'EMAIL',
              AttributeName: 'email'
            }
          }
        })
      } else {
        request.reply({
          statusCode: 400,
          body: { __type: 'CodeMismatchException', message: 'Invalid verification code provided.' }
        })
      }
    }).as('signupRequest')

    cy.fillSignupFormAndSubmit('reader@example.com', 'Example-password-123!')
    cy.window().then(win => cy.stub(win, 'alert').as('confirmationError'))
    cy.contains('button', 'Verify').should('be.disabled')
    cy.get('#confirmationCode').type('000000')
    cy.contains('button', 'Verify').click()
    cy.get('@confirmationError').should('have.been.calledWith', 'Invalid verification code provided.')
    cy.get('#confirmationCode').should('be.visible')
    cy.contains('button', 'Verify').should('be.enabled')

    cy.get('#confirmationCode').clear()
    cy.get('#confirmationCode').type('111111')
    cy.contains('button', 'Verify').click()
    cy.get('@confirmationError').should('have.been.calledTwice')
    cy.contains('h1', 'Your Notes').should('not.exist')
  })
})

describe('Email-confirmed signup', { tags: '@signup' }, () => {
  it('successfully signs up using a confirmation code sent via email', () => {
    cy.env(['MAILOSAUR_SERVER_ID', 'MAILOSAUR_API_KEY', 'USER_PASSWORD'], { log: false })
      .then(({ MAILOSAUR_SERVER_ID, MAILOSAUR_API_KEY, USER_PASSWORD }) => {
        expect(typeof MAILOSAUR_SERVER_ID === 'string' && MAILOSAUR_SERVER_ID.length > 0, 'Set MAILOSAUR_SERVER_ID').to.equal(true)
        expect(typeof MAILOSAUR_API_KEY === 'string' && MAILOSAUR_API_KEY.length > 0, 'Set MAILOSAUR_API_KEY').to.equal(true)
        expect(typeof USER_PASSWORD === 'string' && USER_PASSWORD.length > 0, 'Set USER_PASSWORD').to.equal(true)

        const emailAddress = `${faker.string.uuid()}@${MAILOSAUR_SERVER_ID}.mailosaur.net`
        const receivedAfter = new Date(Date.now() - 5000)
        cy.intercept('GET', '**/notes').as('getNotes')
        cy.fillSignupFormAndSubmit(emailAddress, USER_PASSWORD)

        cy.mailosaurGetMessage(MAILOSAUR_SERVER_ID, { sentTo: emailAddress }, { receivedAfter })
          .then(message => {
            expect(message.html.body, 'confirmation email HTML').to.be.a('string')
            const confirmationCode = message.html.body.match(/\b\d{6}\b/)
            expect(confirmationCode, 'six-digit confirmation code').not.to.equal(null)
            cy.get('#confirmationCode').type(confirmationCode[0], { log: false })
            cy.contains('button', 'Verify').click()

            cy.wait('@getNotes').its('response.statusCode').should('eq', 200)
            cy.contains('h1', 'Your Notes').should('be.visible')
            cy.reload()
            cy.contains('h1', 'Your Notes').should('be.visible')
            cy.mailosaurDeleteMessage(message.id)
          })
      })
  })
})