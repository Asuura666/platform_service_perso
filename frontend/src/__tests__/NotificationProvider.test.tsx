import { act, render, screen } from '@testing-library/react'
import { NotificationProvider } from '@/providers/NotificationProvider'
import { notifySuccess } from '@/utils/notificationBus'

describe('NotificationProvider', () => {
  it('renders a toast when a notification is emitted', async () => {
    render(
      <NotificationProvider>
        <div>Test App</div>
      </NotificationProvider>
    )

    act(() => {
      notifySuccess('Operation terminee', { duration: 0 })
    })

    expect(await screen.findByText('Operation terminee')).toBeInTheDocument()
  })
})
