'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mail, 
  ListChecks, 
  User, 
  Settings, 
  CreditCard, 
  LogOut,
  Search,
  FileText,
  BarChart3,
  History,
  Key,
  FolderOpen
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command'
import { Kbd } from './ui/kbd'
import { createClient } from '../lib/supabase/client'

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const supabase = createClient()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setOpen(false)
  }

  const navigate = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-[12px] border border-input px-1 py- text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Kbd className="hidden sm:inline-flex ml-auto">
          <span className="text-xs">⌘</span>K
        </Kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigate('/')}>
              <Mail className="mr-2 h-4 w-4" />
              <span>Verification</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/lists')}>
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>Smart Lists</span>
              <Kbd className="ml-auto text-xs">GL</Kbd>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/history')}>
              <History className="mr-2 h-4 w-4" />
              <span>Verification History</span>
              <Kbd className="ml-auto text-xs">GH</Kbd>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Usage Analytics</span>
              <Kbd className="ml-auto text-xs">GA</Kbd>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/api-keys')}>
              <Key className="mr-2 h-4 w-4" />
              <span>API Keys</span>
              <Kbd className="ml-auto text-xs">GK</Kbd>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Account">
            <CommandItem onSelect={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <Kbd className="ml-auto text-xs">GS</Kbd>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/subscription')}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Manage Subscription</span>
              <Kbd className="ml-auto text-xs">GP</Kbd>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem onSelect={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
