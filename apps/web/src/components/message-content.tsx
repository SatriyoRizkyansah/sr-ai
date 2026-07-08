"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
          // Headings
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-white" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white" {...props} />,
          
          // Paragraphs
          p: ({ node, ...props }) => <p className="mb-4 text-gray-800 dark:text-gray-200 leading-7" {...props} />,
          
          // Lists
          ul: ({ node, ...props }) => <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-800 dark:text-gray-200" {...props} />,
          ol: ({ node, ...props }) => <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-800 dark:text-gray-200" {...props} />,
          li: ({ node, ...props }) => <li className="leading-7" {...props} />,
          
          // Code
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`block p-4 rounded-lg bg-gray-900 dark:bg-gray-950 text-gray-100 overflow-x-auto font-mono text-sm ${className || ""}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => <pre className="mb-4 rounded-lg overflow-hidden" {...props} />,
          
          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          
          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic text-gray-700 dark:text-gray-300 my-4"
              {...props}
            />
          ),
          
          // Strong/Bold
          strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />,
          
          // Em/Italic
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          
          // Tables
          table: ({ node, ...props }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200" {...props} />
          ),
          
          // Horizontal Rule
          hr: ({ node, ...props }) => <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />,
        }}
    >
      {content}
    </ReactMarkdown>
  );
}
