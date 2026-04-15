"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { Placeholder } from "@tiptap/extension-placeholder"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { VideoUploadNode } from "@/components/tiptap-node/video-upload-node/video-upload-node-extension"
import { AudioUploadNode } from "@/components/tiptap-node/audio-upload-node/audio-upload-node-extension"
import { DocumentUploadNode } from "@/components/tiptap-node/document-upload-node/document-upload-node-extension"
import { VideoNode } from "@/components/tiptap-node/video-node/video-node-extension"
import { AudioNode } from "@/components/tiptap-node/audio-node/audio-node-extension"
import { DocumentNode } from "@/components/tiptap-node/document-node/document-node-extension"
import { CustomImageNode } from "@/components/tiptap-node/image-node/image-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
import "@/components/tiptap-node/video-upload-node/video-upload-node.scss"
import "@/components/tiptap-node/audio-upload-node/audio-upload-node.scss"
import "@/components/tiptap-node/document-upload-node/document-upload-node.scss"
import "@/components/tiptap-node/video-node/video-node.scss"
import "@/components/tiptap-node/audio-node/audio-node.scss"
import "@/components/tiptap-node/document-node/document-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { MediaUploadDropdown } from "@/components/tiptap-ui/media-upload-dropdown"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon, HighlighterIcon, LinkIcon } from "@/components/tiptap-icons"
import { History } from "lucide-react"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { EnhancedEditor } from "@/components/TiptapEditor/EnhancedEditor"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { UPLOAD_LIMITS } from "@/lib/media-constants"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"
import Mention from "@tiptap/extension-mention"
import BASE_URL from "@/config/api"

import content from "@/components/tiptap-templates/simple/data/content.json"

// ── @Mention suggestion renderer ─────────────────────────────────────────────
const createMentionSuggestion = () => ({
  items: async ({ query }) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/admin/employees?limit=20&search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const users = data.data || [];
      return users
        .filter(u => u.name?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
        .map(u => ({ id: u._id || u.id, label: u.name, division: u.division }));
    } catch (e) { return []; }
  },

  render: () => {
    let popup;
    let el;

    return {
      onStart: (props) => {
        el = document.createElement('div');
        Object.assign(el.style, {
          position: 'fixed',
          background: 'hsl(var(--card, 255 255 255))',
          border: '1px solid hsl(215,20%,85%)',
          borderRadius: '0.625rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '0.375rem',
          zIndex: '9999',
          minWidth: '160px',
          maxWidth: '240px',
          fontFamily: 'inherit',
        });
        document.body.appendChild(el);
        renderMentionList(props, el);
        // Position below cursor
        const { x, y, height } = props.clientRect();
        el.style.top = `${y + height + 4}px`;
        el.style.left = `${x}px`;
      },
      onUpdate: (props) => {
        renderMentionList(props, el);
        if (props.clientRect) {
          const { x, y, height } = props.clientRect();
          el.style.top = `${y + height + 4}px`;
          el.style.left = `${x}px`;
        }
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') { el?.remove(); return true; }
        return false;
      },
      onExit: () => { el?.remove(); },
    };
  },
});

function renderMentionList(props, container) {
  container.innerHTML = '';
  if (!props.items.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No users found';
    Object.assign(empty.style, { padding: '0.5rem', fontSize: '0.8rem', color: '#999', margin: 0 });
    container.appendChild(empty);
    return;
  }
  props.items.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.textContent = item.label;
    Object.assign(btn.style, {
      display: 'block', width: '100%', padding: '0.4rem 0.625rem',
      textAlign: 'left', background: i === props.selectedIndex ? 'hsl(250,60%,95%)' : 'none',
      border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
      fontSize: '0.8rem', fontWeight: '500', color: '#333'
    });
    if (item.division) {
      const div = document.createElement('span');
      div.textContent = ' · ' + item.division;
      Object.assign(div.style, { fontSize: '0.7rem', color: '#888', fontWeight: '400' });
      btn.appendChild(div);
    }
    btn.addEventListener('click', () => props.command({ id: item.id, label: item.label }));
    container.appendChild(btn);
  });
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  onBack,
  onVersion,
  isMobile
}) => {
  return (
    <>
      <ToolbarGroup>
        {/* Back Button - allow when in title */}
        <Button data-style="ghost" onClick={onBack} tooltip="Back" allowWhenInTitle={true}>
          <ArrowLeftIcon className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} portal={isMobile} />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MediaUploadDropdown text="Add Media" portal={isMobile} />
      </ToolbarGroup>
      <Spacer />
      <ToolbarGroup>
        {/* Version Button with icon - allow when in title */}
        <Button data-style="ghost" onClick={onVersion} tooltip="Version History" allowWhenInTitle={true}>
          <History className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>
    </>
  );
}

const MobileToolbarContent = ({
  type,
  onBack
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({ 
  onBack, 
  onVersion, 
  sidebarCollapsed, 
  initialContent = "", 
  onContentChange, 
  initialTitle = "", 
  initialTags = [], 
  onTitleChange, 
  onTagsChange
}) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState("main")
  const [isToolbarDisabled, setIsToolbarDisabled] = React.useState(false)
  const toolbarRef = React.useRef(null)

  // Log when component mounts/re-mounts
  React.useEffect(() => {
    console.log('[SimpleEditor] Component mounted/re-mounted');
    console.log('[SimpleEditor] Initial content length:', initialContent?.length || 0);
    console.log('[SimpleEditor] Has blob URLs in initial content:', initialContent?.includes('blob:') || false);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          // Only show placeholder on the first paragraph if editor is truly empty
          if (node.type.name === 'paragraph') {
            return 'Start writing your worklog...'
          }
          return ''
        },
        emptyEditorClass: "is-editor-empty",
        showOnlyWhenEditable: true,
        includeChildren: false,
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      CustomImageNode,
      Typography,
      Superscript,
      Subscript,
      Selection,
      VideoNode,
      AudioNode,
      DocumentNode,
      ImageUploadNode.configure({
        accept: UPLOAD_LIMITS.IMAGE.accept,
        maxSize: UPLOAD_LIMITS.IMAGE.maxSize,
        limit: UPLOAD_LIMITS.IMAGE.maxFiles,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      VideoUploadNode.configure({
        accept: UPLOAD_LIMITS.VIDEO.accept,
        maxSize: UPLOAD_LIMITS.VIDEO.maxSize,
        limit: UPLOAD_LIMITS.VIDEO.maxFiles,
        upload: handleImageUpload,
        onError: (error) => console.error("Video upload failed:", error),
      }),
      AudioUploadNode.configure({
        accept: UPLOAD_LIMITS.AUDIO.accept,
        maxSize: UPLOAD_LIMITS.AUDIO.maxSize,
        limit: UPLOAD_LIMITS.AUDIO.maxFiles,
        upload: handleImageUpload,
        onError: (error) => console.error("Audio upload failed:", error),
      }),
      DocumentUploadNode.configure({
        accept: UPLOAD_LIMITS.DOCUMENT.accept,
        maxSize: UPLOAD_LIMITS.DOCUMENT.maxSize,
        limit: UPLOAD_LIMITS.DOCUMENT.maxFiles,
        upload: handleImageUpload,
        onError: (error) => console.error("Document upload failed:", error),
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
          style: [
            'background: hsl(250,60%,92%)',
            'color: hsl(250,60%,35%)',
            'border-radius: 0.25rem',
            'padding: 0.1em 0.35em',
            'font-weight: 600',
            'font-size: 0.875em',
          ].join(';'),
        },
        renderLabel: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
        suggestion: createMentionSuggestion(),
      }),
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => {
      // Call onContentChange callback when content changes
      if (onContentChange) {
        const html = editor.getHTML();
        onContentChange(html);
      }
    },
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  // Load initial content when it changes
  // Using emitUpdate: false to preserve undo/redo history when content is updated after save
  React.useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      console.log('[SimpleEditor] Setting content - initialContent changed');
      console.log('[SimpleEditor] Content length:', initialContent.length);
      console.log('[SimpleEditor] Has blob URLs:', initialContent.includes('blob:'));
      editor.commands.setContent(initialContent, false);
    }
  }, [initialContent, editor]);

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  // Click handler for focusing editor when clicking empty space
  const handleContentClick = (e) => {
    // If clicking on the content wrapper (not on actual content)
    if (e.target.classList.contains('simple-editor-content')) {
      editor?.commands.focus('end')
    }
  }

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          data-variant="fixed"
          className={isToolbarDisabled ? "toolbar-disabled" : ""}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}>
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              onBack={onBack}
              onVersion={onVersion}
              isMobile={isMobile} />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")} />
          )}
        </Toolbar>

        <div 
          className={`simple-editor-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} 
          onClick={handleContentClick}
        >
          <EnhancedEditor 
            onFocusChange={setIsToolbarDisabled} 
            editor={editor}
            initialTitle={initialTitle}
            initialTags={initialTags}
            onTitleChange={onTitleChange}
            onTagsChange={onTagsChange}
          />
          <EditorContent editor={editor} role="presentation" />
        </div>
      </EditorContext.Provider>
    </div>
  );
}
