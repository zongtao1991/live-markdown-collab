import { marked } from 'marked';

const MarkdownPreview = ({ content }) => {
  const htmlContent = marked.parse(content || '', {
    breaks: true,
    gfm: true
  });

  return (
    <div 
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownPreview;
