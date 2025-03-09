import React, { useState, useEffect } from 'react';
import { Box, Typography, Theme } from '@mui/material';
// Dynamically import ReactMarkdown to ensure it's included in production builds
import ReactMarkdown from 'react-markdown';
// Add remarkGfm for GitHub Flavored Markdown (tables, strikethrough, etc.)
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  sx?: any;
  debug?: boolean;
  disableParaTags?: boolean;
}

// Utility function to detect if a string contains markdown
const containsMarkdown = (text: string): boolean => {
  const markdownPatterns = [
    /^#+\s/, // headers
    /\*\*.*\*\*/, // bold
    /\*.*\*/, // italic
    /\[.*\]\(.*\)/, // links
    /!\[.*\]\(.*\)/, // images
    /^\s*[\*\-\+]\s/, // unordered lists
    /^\s*\d+\.\s/, // ordered lists
    /^\s*>\s/, // blockquotes
    /`.*`/, // inline code
    /```[\s\S]*```/, // code blocks
    /\|.*\|.*\|/, // tables
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
};

// Simple markdown renderer without dependencies
const SimpleMarkdownRenderer: React.FC<{content: string}> = ({ content }) => {
  // Convert content to HTML using simple regex replacements
  const processMarkdown = (text: string): string => {
    let processed = text;
    
    // Headers
    processed = processed.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    processed = processed.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    processed = processed.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    
    // Bold and italic
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists (simple approach)
    processed = processed.replace(/^\* (.*)$/gm, '<li>$1</li>');
    
    // Line breaks
    processed = processed.replace(/\n/g, '<br />');
    
    return processed;
  };
  
  const htmlContent = processMarkdown(content);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, sx, debug = false, disableParaTags = false }) => {
  const [error, setError] = useState<boolean>(false);
  const [markdownDetected, setMarkdownDetected] = useState<boolean>(false);
  const [useSimpleRenderer, setUseSimpleRenderer] = useState<boolean>(false);

  useEffect(() => {
    // Check if ReactMarkdown is available
    if (typeof ReactMarkdown !== 'function') {
      console.error('ReactMarkdown is not available');
      setError(true);
      setUseSimpleRenderer(true);
    }

    // Check if content appears to contain markdown
    setMarkdownDetected(containsMarkdown(content));
  }, [content]);

  // Add debugging info if requested
  if (debug) {
    console.log('MarkdownContent debug:', {
      content: content?.substring(0, 100) + '...',
      markdownDetected,
      reactMarkdownAvailable: typeof ReactMarkdown === 'function',
      reactMarkdownType: typeof ReactMarkdown,
      window: window.ReactMarkdownLoaded ? 'ReactMarkdown is loaded globally' : 'No global ReactMarkdown',
    });
  }

  // Use our simple renderer if ReactMarkdown is unavailable
  if (useSimpleRenderer) {
    return (
      <Box sx={sx}>
        <SimpleMarkdownRenderer content={content} />
      </Box>
    );
  }

  if (error) {
    // Fallback to plain text with line breaks if the markdown component fails
    return (
      <Typography sx={{ whiteSpace: 'pre-wrap', ...sx }}>
        {content}
      </Typography>
    );
  }

  // For cases where this component will be nested in a <p> tag (like in ListItemText),
  // use a simplified plain text approach to avoid DOM nesting errors
  if (disableParaTags) {
    // Just render the content as plain text with minimal formatting
    return (
      <span style={{ whiteSpace: 'normal' }}>
        {content.replace(/\n/g, ' ').replace(/\s+/g, ' ')}
      </span>
    );
  }

  // Safely render markdown with a try-catch
  try {
    return (
      <Box 
        sx={{
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            fontWeight: 'bold',
            mt: 2,
            mb: 1,
          },
          '& h1': { fontSize: '1.8rem' },
          '& h2': { fontSize: '1.6rem' },
          '& h3': { fontSize: '1.4rem' },
          '& h4': { fontSize: '1.2rem' },
          '& h5': { fontSize: '1.1rem' },
          '& h6': { fontSize: '1rem' },
          '& p': { 
            mb: 1.5,
            lineHeight: 1.6,
          },
          '& ul, & ol': { 
            pl: 3,
            mb: 1.5,
          },
          '& li': {
            mb: 0.5,
          },
          '& a': {
            color: (theme: Theme) => theme.palette.primary.main,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'grey.300',
            pl: 2,
            py: 1,
            my: 2,
            bgcolor: 'grey.50',
            fontStyle: 'italic',
          },
          '& code': {
            fontFamily: 'monospace',
            bgcolor: 'grey.100',
            p: 0.5,
            borderRadius: 1,
          },
          '& pre': {
            fontFamily: 'monospace',
            bgcolor: 'grey.900',
            color: 'white',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            mb: 2,
          },
          '& th, & td': {
            border: '1px solid',
            borderColor: 'grey.300',
            p: 1,
          },
          '& th': {
            bgcolor: 'grey.100',
            fontWeight: 'bold',
          },
          ...sx,
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </Box>
    );
  } catch (err) {
    console.error('Failed to render markdown:', err);
    // Fall back to the simple renderer
    return (
      <Box sx={sx}>
        <SimpleMarkdownRenderer content={content} />
      </Box>
    );
  }
};

export default MarkdownContent; 