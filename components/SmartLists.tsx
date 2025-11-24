'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderOpen, Mail, Trash2, Edit2, Download } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import AppBreadcrumb from './AppBreadcrumb'

interface List {
  id: string
  name: string
  description: string | null
  color: string
  email_count: number
  created_at: string
}

interface ListEmail {
  id: string
  email_address: string
  verification_status: string | null
  verification_result: any
  added_at: string
}

export default function SmartLists() {
  const router = useRouter()
  const [lists, setLists] = useState<List[]>([])
  const [selectedList, setSelectedList] = useState<List | null>(null)
  const [emails, setEmails] = useState<ListEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Form states
  const [listName, setListName] = useState('')
  const [listDescription, setListDescription] = useState('')
  const [listColor, setListColor] = useState('#3b82f6')

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      const data = await response.json()
      if (data.lists) {
        setLists(data.lists)
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    }
  }

  const fetchListEmails = async (listId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lists/${listId}/emails`)
      const data = await response.json()
      if (data.emails) {
        setEmails(data.emails)
      }
    } catch (error) {
      console.error('Error fetching list emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const createList = async () => {
    if (!listName.trim()) return

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName,
          description: listDescription,
          color: listColor
        })
      })

      const data = await response.json()
      if (data.list) {
        setLists([data.list, ...lists])
        setListName('')
        setListDescription('')
        setListColor('#3b82f6')
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  const updateList = async () => {
    if (!selectedList || !listName.trim()) return

    try {
      const response = await fetch(`/api/lists/${selectedList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName,
          description: listDescription,
          color: listColor
        })
      })

      const data = await response.json()
      if (data.list) {
        setLists(lists.map(l => l.id === data.list.id ? data.list : l))
        setSelectedList(data.list)
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error('Error updating list:', error)
    }
  }

  const deleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All emails in this list will be removed.')) {
      return
    }

    try {
      await fetch(`/api/lists/${listId}`, { method: 'DELETE' })
      setLists(lists.filter(l => l.id !== listId))
      if (selectedList?.id === listId) {
        setSelectedList(null)
        setEmails([])
      }
    } catch (error) {
      console.error('Error deleting list:', error)
    }
  }

  const selectList = (list: List) => {
    setSelectedList(list)
    fetchListEmails(list.id)
  }

  const openEditDialog = (list: List) => {
    setSelectedList(list)
    setListName(list.name)
    setListDescription(list.description || '')
    setListColor(list.color)
    setIsEditDialogOpen(true)
  }

  const exportList = () => {
    if (!emails.length) return

    const csv = [
      ['Email', 'Status', 'Added At'].join(','),
      ...emails.map(e => [
        e.email_address,
        e.verification_status || 'unknown',
        new Date(e.added_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedList?.name || 'list'}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b-[0.5px] bg-[#fafafa]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-dark.svg" alt="FKbounce" className="h-7 w-auto" />
            </button>
            <div className="ml-1">
              <AppBreadcrumb />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-[#fafafa] py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#020202] font-[family-name:var(--font-geist)]">
                Smart Lists
              </h1>
              <p className="text-[#5C5855] mt-2 font-mono text-sm">
                Organize and manage your verified email lists efficiently
              </p>
            </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Organize your emails into custom lists for better management
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">List Name</Label>
                <Input
                  id="name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g., Valid Customers, High Priority, etc."
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  placeholder="Add notes about this list..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setListColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${listColor === color ? 'border-black' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={createList} className="w-full">
                Create List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lists Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your Lists ({lists.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {lists.length === 0 ? (
                <div className="text-center py-8 text-[#5C5855]">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No lists yet</p>
                  <p className="text-xs mt-1">Create your first list to get started</p>
                </div>
              ) : (
                lists.map(list => (
                  <div
                    key={list.id}
                    onClick={() => selectList(list)}
                    className={`p-3 rounded-[12px] border cursor-pointer transition-colors ${
                      selectedList?.id === list.id
                        ? 'border-black bg-[#fafafa]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: list.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-semibold truncate">{list.name}</p>
                          {list.description && (
                            <p className="text-xs text-[#5C5855] mt-1 line-clamp-2">{list.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Mail className="h-3 w-3 mr-1" />
                              {list.email_count}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(list)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteList(list.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* List Content */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedList ? selectedList.name : 'Select a List'}
                  </CardTitle>
                  {selectedList?.description && (
                    <CardDescription className="mt-1">{selectedList.description}</CardDescription>
                  )}
                </div>
                {selectedList && emails.length > 0 && (
                  <Button onClick={exportList} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedList ? (
                <div className="text-center py-12 text-[#5C5855]">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a list from the sidebar to view its contents</p>
                </div>
              ) : loading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse text-[#5C5855]">Loading emails...</div>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-12 text-[#5C5855]">
                  <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>This list is empty</p>
                  <p className="text-xs mt-1">Add emails from your verification results</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {emails.map(email => (
                    <div
                      key={email.id}
                      className="p-3 rounded-[12px] border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-mono text-sm">{email.email_address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {email.verification_status && (
                              <Badge
                                variant={
                                  email.verification_status === 'valid' ? 'default' :
                                  email.verification_status === 'invalid' ? 'destructive' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {email.verification_status}
                              </Badge>
                            )}
                            <span className="text-xs text-[#5C5855]">
                              Added {new Date(email.added_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>
              Update your list details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-name">List Name</Label>
              <Input
                id="edit-name"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={listDescription}
                onChange={(e) => setListDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    onClick={() => setListColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${listColor === color ? 'border-black' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={updateList} className="w-full">
              Update List
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </main>
  )
}
