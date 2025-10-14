import { render, screen } from '@testing-library/react'
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary'
import { NotificationProvider } from '@/providers/NotificationProvider'

describe('GlobalErrorBoundary', () => {
  const consoleError = console.error

  beforeAll(() => {
    console.error = () => undefined
  })

  afterAll(() => {
    console.error = consoleError
  })

  it('displays the fallback UI when a child throws', () => {
    const Problematic = () => {
      throw new Error('Unexpected failure')
    }

    render(
      <NotificationProvider>
        <GlobalErrorBoundary>
          <Problematic />
        </GlobalErrorBoundary>
      </NotificationProvider>
    )

    expect(
      screen.getByText(/une erreur inattendue est survenue/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recharger la page/i })).toBeInTheDocument()
  })
})
