import { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="bubble"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="bg-background"
      />
      <style>{`
        .rich-text-editor .ql-container {
          border-radius: 0.5rem;
          font-size: 0.875rem;
          border: 1px solid hsl(var(--input));
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
        }
        .rich-text-editor .ql-tooltip {
          z-index: 50 !important;
        }
        .rich-text-editor .ql-bubble .ql-tooltip {
          z-index: 50 !important;
        }
      `}</style>
    </div>
  );
}

