import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'; 
import './Editor.css';
import StarterKit from '@tiptap/starter-kit';

const extensions = [
  StarterKit.configure({}),
];

const Editor = () => {
  return (
    <div className="editor-wrapper">
      <SimpleEditor />
    </div>
  );
};

export default Editor;
