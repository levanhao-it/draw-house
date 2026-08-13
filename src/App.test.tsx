import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders VeCan Studio heading', () => {
    render(<App />)
    expect(screen.getByText('VeCan Studio')).toBeInTheDocument()
  })
})
