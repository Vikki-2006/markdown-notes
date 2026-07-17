import React from 'react';
import ReactMarkdown from 'react-markdown';

interface PreviewPanelProps {
  content: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ content }) => {
  return (
    <div className="flex-1 h-full overflow-y-auto px-8 py-6 markdown-preview select-text">
      {content.trim() ? (
        <ReactMarkdown>{content}</ReactMarkdown>
      ) : (
        <div className="h-full flex items-center justify-center text-zinc-500 italic text-sm">
          No content to preview. Type something in the editor to see it here!
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
