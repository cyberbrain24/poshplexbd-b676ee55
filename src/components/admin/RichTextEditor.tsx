import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1,
  Heading2, Heading3, Quote, Code, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Pilcrow,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write your blog post...", className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "text-primary underline" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-md max-w-full my-4" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none min-h-[400px] focus:outline-none px-4 py-3",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const Btn = ({ active, onClick, children, title }: any) => (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "ghost"}
      className="h-8 w-8 p-0"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1 bg-muted/40">
        <Btn title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")}><Pilcrow className="h-4 w-4" /></Btn>
        <Btn title="H1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></Btn>
        <Btn title="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Btn>
        <Btn title="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Btn>
        <Btn title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Btn>
        <Btn title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Btn>
        <Btn title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Btn>
        <Btn title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Btn>
        <Btn title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}><Code className="h-4 w-4" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn title="Link" onClick={setLink} active={editor.isActive("link")}><LinkIcon className="h-4 w-4" /></Btn>
        <Btn title="Image" onClick={addImage}><ImageIcon className="h-4 w-4" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Btn>
        <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
