import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ArtifactCodeViewProps {
  language: string
  content: string
}

export function ArtifactCodeView({ language, content }: ArtifactCodeViewProps) {
  return (
    <div className="h-full overflow-auto">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '13px',
          lineHeight: '1.5',
          borderRadius: 0,
          minHeight: '100%',
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  )
}
