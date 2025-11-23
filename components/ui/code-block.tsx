'use client'

import { useState } from 'react'
import { Button } from './button'
import { Check, Copy } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
}

export function CodeBlock({ code, language = 'bash', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      {title && (
        <div className="flex items-center justify-between bg-[#f5f5f5] border border-b-0 border-[#e5e5e5] text-[#383a42] px-4 py-2 rounded-t-lg text-xs font-semibold">
          <span>{title}</span>
          <span className="text-[#9ca0a4] uppercase text-[10px]">{language}</span>
        </div>
      )}
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={oneLight}
          customStyle={{
            margin: 0,
            borderRadius: title ? '0 0 8px 8px' : '8px',
            fontSize: '12px',
            padding: '16px',
            border: '1px solid #e5e5e5',
            borderTop: title ? 'none' : '1px solid #e5e5e5',
          }}
          showLineNumbers={false}
        >
          {code}
        </SyntaxHighlighter>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-[#f5f5f5] text-[#383a42] border border-[#e5e5e5]"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
