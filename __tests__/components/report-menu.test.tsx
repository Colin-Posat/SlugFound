import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportMenu from '@/app/components/report-menu'

// Mock the server action so it isn't actually invoked (which would hit Supabase).
// jest.mock paths don't run through the "@/" alias the way imports do, so we use
// the relative path here — it resolves to the same module the component imports.
jest.mock('../../app/actions/reports', () => ({
  reportItem: jest.fn(async () => ({ success: true })),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

import { reportItem } from '@/app/actions/reports'

describe('ReportMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the overflow menu trigger', () => {
    render(<ReportMenu itemId="item-1" />)
    expect(screen.getByRole('button', { name: /more options/i })).toBeInTheDocument()
  })

  it('opens the Report modal from the overflow menu', async () => {
    const user = userEvent.setup()
    render(<ReportMenu itemId="item-1" />)

    await user.click(screen.getByRole('button', { name: /more options/i }))
    await user.click(screen.getByRole('menuitem', { name: /report/i }))

    expect(screen.getByText(/report this listing/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument()
  })

  it('submits a report with the chosen reason', async () => {
    const user = userEvent.setup()
    render(<ReportMenu itemId="item-1" />)

    await user.click(screen.getByRole('button', { name: /more options/i }))
    await user.click(screen.getByRole('menuitem', { name: /report/i }))
    await user.selectOptions(screen.getByLabelText(/reason/i), 'offensive')
    await user.click(screen.getByRole('button', { name: /submit report/i }))

    expect(reportItem).toHaveBeenCalledWith({
      itemId: 'item-1',
      reason: 'offensive',
      notes: '',
    })
  })
})
