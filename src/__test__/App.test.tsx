import { render, screen } from '@testing-library/react'
import App from '@renderer/App'

describe('App', () => {
  it('renders counter button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /count is/i })).toBeInTheDocument()
  })
})
