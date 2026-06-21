import { useEffect, useRef } from 'react'
import grapesjs, { Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'
// @ts-ignore — no types for this plugin
import gjsNewsletter from 'grapesjs-preset-newsletter'

interface Props {
  html?: string
  onChange?: (html: string, css: string) => void
  height?: string
}

export function EmailEditor({ html = '', onChange, height = '100%' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef    = useRef<Editor | null>(null)

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return

    const editor = grapesjs.init({
      container:      containerRef.current,
      height,
      plugins:        [gjsNewsletter],
      pluginsOpts:    { [gjsNewsletter as unknown as string]: { inlineCss: true } },
      storageManager: false,
      fromElement:    false,
      components:     html,
      style:          '',
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Mobile',  width: '375px', widthMedia: '480px' },
        ],
      },
      panels: { defaults: [] }, // we render our own save button
    })

    // Dark-mode skin override so it blends with ERA Hub's dark theme
    const frame = containerRef.current.querySelector('iframe') as HTMLIFrameElement | null
    if (frame) {
      frame.addEventListener('load', () => {
        if (frame.contentDocument) {
          const s = frame.contentDocument.createElement('style')
          s.textContent = 'body { background: #1a1624; }'
          frame.contentDocument.head.appendChild(s)
        }
      })
    }

    editor.on('update', () => {
      onChange?.(editor.getHtml(), editor.getCss() ?? '')
    })

    editorRef.current = editor

    return () => {
      editor.destroy()
      editorRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync html prop when it changes (loading a saved template)
  useEffect(() => {
    if (editorRef.current && html) {
      editorRef.current.setComponents(html)
    }
  }, [html])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, minHeight: 480 }}
      className="rounded-xl overflow-hidden"
    />
  )
}
