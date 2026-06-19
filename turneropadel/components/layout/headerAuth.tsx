'use client'

import { Show, UserButton } from '@clerk/nextjs'
import { User } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function HeaderAuth() {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  if (!mounted) return <div className="h-10 w-10 md:w-28" aria-hidden="true" />

  return (
    <div className="flex min-h-10 min-w-10 items-center justify-end">
      <Show when="signed-out">
      </Show>
      <Show when="signed-in">
        {/* Mobile: solo avatar */}
        <span className="md:hidden">
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link
                label="Mi perfil"
                labelIcon={<User size={14} />}
                href="/perfil"
              />
            </UserButton.MenuItems>
          </UserButton>
        </span>
        {/* Desktop: avatar + nombre */}
        <span className="hidden md:block">
          <UserButton showName>
            <UserButton.MenuItems>
              <UserButton.Link
                label="Mi perfil"
                labelIcon={<User size={14} />}
                href="/perfil"
              />
            </UserButton.MenuItems>
          </UserButton>
        </span>
      </Show>
    </div>
  )
}