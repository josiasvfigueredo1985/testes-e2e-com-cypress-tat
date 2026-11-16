import { faker } from '@faker-js/faker'

describe('Real-account notes and logout', { tags: '@authenticated' }, () => {
  let createdNoteId

  beforeEach(() => {
    createdNoteId = undefined
    cy.intercept('POST', '**/notes', request => {
      request.on('response', response => {
        if (response.statusCode === 200 || response.statusCode === 201) {
          expect(response.body.noteId, 'created note ID for cleanup').to.be.a('string').and.not.be.empty
          createdNoteId = response.body.noteId
        }
      })
    }).as('createNote')
    cy.login()
  })

  afterEach(() => {
    if (!createdNoteId) {
      return
    }

    // Only remove this test's note, including when an assertion failed mid-flow.
    cy.intercept('GET', '**/notes').as('cleanupNotes')
    cy.visit('/')
    cy.wait('@cleanupNotes').its('response.statusCode').should('eq', 200)
    cy.get('.list-group').then($list => {
      const link = `.list-group-item[href="/notes/${createdNoteId}"]`
      if ($list.find(link).length) {
        cy.get(link).click()
        cy.contains('button', 'Delete').click()
        cy.location('pathname').should('eq', '/')
        cy.contains('.list-group-item', 'Create a new note').should('be.visible')
        cy.get(link).should('not.exist')
      }
    })
  })

  it('persists note content and an attachment through create, read, update, and delete', () => {
    const noteDescription = `E2E ${faker.string.uuid()}\nOriginal second line`
    const updatedNoteDescription = `Updated ${faker.string.uuid()}\nUpdated second line`

    cy.createNote(noteDescription)
    cy.wait('@createNote').its('response.statusCode').should('be.oneOf', [200, 201])
    cy.reload()
    cy.contains('.list-group-item', noteDescription.split('\n')[0]).click()
    cy.get('#content').should('have.value', noteDescription)

    cy.visit('/')
    cy.editNote(noteDescription, updatedNoteDescription, true)
    cy.reload()
    cy.contains('.list-group-item', updatedNoteDescription.split('\n')[0]).click()
    cy.get('#content').should('have.value', updatedNoteDescription)
    cy.fixture('example.json').then(expectedAttachment => {
      cy.contains('a', 'example.json')
        .should('have.attr', 'href')
        .and('match', /^https:\/\//)
        .then(url => {
          cy.request({ url, log: false }).then(({ status, body }) => {
            expect(status).to.equal(200)
            expect(body).to.deep.equal(expectedAttachment)
          })
        })
    })

    cy.visit('/')
    cy.deleteNote(updatedNoteDescription)
    cy.reload()
    cy.contains('.list-group-item', 'Create a new note').should('be.visible')
    cy.contains('.list-group-item', updatedNoteDescription.split('\n')[0]).should('not.exist')
  })

  it('keeps a note after cancelling deletion', () => {
    const description = `Keep ${faker.string.uuid()}`
    cy.createNote(description)
    cy.contains('.list-group-item', description).click()
    cy.get('#content').should('have.value', description)
    cy.intercept('DELETE', '**/notes/*').as('deleteNote')
    cy.window().then(win => cy.stub(win, 'confirm').returns(false).as('deleteConfirmation'))
    cy.contains('button', 'Delete').click()

    cy.get('@deleteConfirmation').should('have.been.calledOnce')
    cy.get('@deleteNote.all').should('have.length', 0)
    cy.reload()
    cy.get('#content').should('have.value', description)
  })

  it('requires note content before creating a note', () => {
    cy.visit('/notes/new')
    cy.contains('button', 'Create').should('be.disabled')
    cy.get('#content').type('Draft note')
    cy.contains('button', 'Create').should('be.enabled')
    cy.get('#content').clear()
    cy.contains('button', 'Create').should('be.disabled')
    cy.get('@createNote.all').should('have.length', 0)
  })

  it('rejects attachments larger than the five-megabyte limit before saving', () => {
    cy.visit('/notes/new')
    cy.get('#content').type('Oversized attachment')
    cy.get('#file').selectFile({
      contents: Cypress.Buffer.alloc(5000001),
      fileName: 'oversized.txt',
      mimeType: 'text/plain'
    })
    cy.window().then(win => cy.stub(win, 'alert').as('attachmentError'))
    cy.contains('button', 'Create').click()

    cy.get('@attachmentError').should('have.been.calledWith', 'Please pick a file smaller than 5 MB.')
    cy.location('pathname').should('eq', '/notes/new')
    cy.get('#content').should('have.value', 'Oversized attachment')
    cy.get('@createNote.all').should('have.length', 0)
  })

  it('preserves unsaved input after a failed update (stubbed save)', () => {
    const original = `Original ${faker.string.uuid()}`
    const updated = `Unsaved ${faker.string.uuid()}`
    cy.createNote(original)
    cy.contains('.list-group-item', original).click()
    cy.get('#content').should('have.value', original)
    cy.intercept('PUT', '**/notes/*', {
      statusCode: 500,
      body: { message: 'Unable to save note' }
    }).as('failedSave')
    cy.window().then(win => cy.stub(win, 'alert').as('saveError'))
    cy.get('#content').clear()
    cy.get('#content').type(updated)
    cy.contains('button', 'Save').click()

    cy.wait('@failedSave').its('response.statusCode').should('eq', 500)
    cy.get('@saveError').should('have.been.calledOnce')
    cy.get('#content').should('have.value', updated)
    cy.contains('button', 'Save').should('be.enabled')
    cy.reload()
    cy.get('#content').should('have.value', original)
  })

  it('logs out and cannot reopen protected pages', () => {
    cy.openNavigation()
    cy.contains('.navbar a', 'Logout').should('be.visible').click()
    cy.location('pathname').should('eq', '/login')
    cy.get('#email').should('be.visible')

    for (const route of ['/notes/new', '/settings']) {
      cy.visit(route)
      cy.location('pathname').should('eq', '/login')
      cy.contains('h1', 'Your Notes').should('not.exist')
    }
  })
})
