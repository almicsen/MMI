'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/contexts/ToastContext';

const pages = ['about', 'services'];

export default function PagesManager() {
  const toast = useToast();
  const [selectedPage, setSelectedPage] = useState('about');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your content here...',
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 text-gray-900 dark:text-gray-100',
      },
    },
  });

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'pages', selectedPage);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const content = docSnap.data().content || '';
          editor?.commands.setContent(content);
        } else {
          editor?.commands.setContent('');
        }
      } catch (error) {
        console.error('Error loading page:', error);
      } finally {
        setLoading(false);
      }
    };
    if (editor) {
      loadPage();
    }
  }, [selectedPage, editor]);

  const handleSave = async () => {
    if (!editor) return;
    
    setSaving(true);
    try {
      const content = editor.getHTML();
      await setDoc(doc(db, 'pages', selectedPage), {
        content,
        updatedAt: new Date(),
      });
      toast.showSuccess('Page saved successfully!');
    } catch (error) {
      console.error('Error saving page:', error);
      toast.showError('Error saving page');
    } finally {
      setSaving(false);
    }
  };

  if (!editor) {
    return <div className="animate-pulse">Loading editor...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Select Page
        </label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {pages.map((page) => (
            <option key={page} value={page}>
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-t-lg p-2 flex flex-wrap gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('bold')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('italic')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('strike')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <s>S</s>
            </button>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('heading', { level: 1 })
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('heading', { level: 3 })
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              H3
            </button>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('bulletList')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              •
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('orderedList')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              1.
            </button>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              ↶
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              ↷
            </button>
          </div>

          {/* Editor */}
          <div className="bg-white dark:bg-gray-800 border border-t-0 border-gray-300 dark:border-gray-700 rounded-b-lg">
            <EditorContent editor={editor} />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Page'}
          </button>
        </>
      )}
    </div>
  );
}

