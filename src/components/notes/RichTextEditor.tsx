import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  CheckSquare,
  Link2,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Type,
  ChevronDown,
  Check,
  ExternalLink
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  id?: string;
}

type HeadingType = 'p' | 'h1' | 'h2' | 'h3';

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing your thoughts, headings, lists, or checklists...',
  minHeight = '280px',
  id = 'notes-rich-text-editor'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Active state trackers
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    highlight: false,
    bulletList: false,
    orderedList: false,
    checklist: false,
    link: false,
    heading: 'p' as HeadingType
  });

  // Heading dropdown state
  const [isHeadingDropdownOpen, setIsHeadingDropdownOpen] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);

  // Link dialog state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // Sync incoming value safely
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current || !editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (headingDropdownRef.current && !headingDropdownRef.current.contains(e.target as Node)) {
        setIsHeadingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Emit changes to parent
  const emitChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Query and update current formatting active states
  const updateActiveStates = useCallback(() => {
    if (!editorRef.current) return;

    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const isUnderline = document.queryCommandState('underline');
    const isStrike = document.queryCommandState('strikeThrough');
    const isBullet = document.queryCommandState('insertUnorderedList');
    const isOrdered = document.queryCommandState('insertOrderedList');

    let currentHeading: HeadingType = 'p';
    let isBlockquote = false;
    let isChecklist = false;
    let isHighlight = false;
    let isLink = false;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();

          if (tag === 'h1') currentHeading = 'h1';
          else if (tag === 'h2') currentHeading = 'h2';
          else if (tag === 'h3') currentHeading = 'h3';
          else if (tag === 'blockquote') isBlockquote = true;
          else if (el.classList.contains('note-checklist-item') || el.classList.contains('note-checklist-row')) {
            isChecklist = true;
          }

          if (
            tag === 'mark' ||
            el.classList.contains('note-highlight') ||
            el.style.backgroundColor?.includes('212, 175, 55')
          ) {
            isHighlight = true;
          }

          if (tag === 'a') {
            isLink = true;
          }
        }
        node = node.parentNode;
      }
    }

    setActiveFormats({
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      strike: isStrike,
      highlight: isHighlight,
      bulletList: isBullet,
      orderedList: isOrdered,
      checklist: isChecklist,
      link: isLink,
      heading: currentHeading
    });
  }, []);

  // Run state check on selectionchange
  useEffect(() => {
    const handleSelection = () => {
      if (document.activeElement === editorRef.current || editorRef.current?.contains(document.activeElement)) {
        updateActiveStates();
      }
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [updateActiveStates]);

  // Execute standard execCommand
  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    emitChange();
    setTimeout(updateActiveStates, 20);
  };

  // Heading application
  const applyHeading = (level: HeadingType) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    setIsHeadingDropdownOpen(false);

    if (level === 'p') {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, `<${level}>`);
    }
    emitChange();
    setTimeout(updateActiveStates, 20);
  };

  // Toggle highlight with gold liquid accent
  const toggleHighlight = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (selection.isCollapsed) {
      // If no text selected, just toggle command if supported or alert
      return;
    }

    const range = selection.getRangeAt(0);
    const parentMark = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as HTMLElement).closest('mark, .note-highlight')
      : range.commonAncestorContainer.parentElement?.closest('mark, .note-highlight');

    if (parentMark) {
      // Unwrap highlight
      const parent = parentMark.parentNode;
      while (parentMark.firstChild) {
        parent?.insertBefore(parentMark.firstChild, parentMark);
      }
      parent?.removeChild(parentMark);
    } else {
      // Apply highlight
      const mark = document.createElement('mark');
      mark.className = 'note-highlight';
      try {
        const contents = range.extractContents();
        mark.appendChild(contents);
        range.insertNode(mark);
        selection.selectAllChildren(mark);
      } catch (err) {
        console.warn('Highlight extraction error:', err);
      }
    }
    emitChange();
    setTimeout(updateActiveStates, 20);
  };

  // Insert Checklist Item
  const insertChecklist = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const selection = window.getSelection();
    let selectedText = '';
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      selectedText = selection.toString();
    }
    const textLabel = selectedText.trim() || 'Task item...';

    const checklistHtml = `
      <div class="note-checklist-item" data-checked="false" style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;">
        <input type="checkbox" class="note-checkbox" style="margin-top: 4px; accent-color: var(--gold-primary); cursor: pointer; width: 16px; height: 16px;" />
        <span class="note-checklist-text" style="flex: 1; min-width: 0; outline: none;">${textLabel}</span>
      </div>
    `;

    document.execCommand('insertHTML', false, checklistHtml);
    emitChange();
    setTimeout(updateActiveStates, 20);
  };

  // Link Modal
  const openLinkDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0).cloneRange());
      const text = selection.toString();
      setLinkText(text);

      // Check if cursor is inside an existing link
      let node: Node | null = selection.anchorNode;
      let existingHref = '';
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
          existingHref = (node as HTMLAnchorElement).getAttribute('href') || '';
          break;
        }
        node = node.parentNode;
      }
      setLinkUrl(existingHref);
    } else {
      setLinkText('');
      setLinkUrl('');
    }
    setShowLinkModal(true);
  };

  const handleSaveLink = () => {
    setShowLinkModal(false);
    if (!linkUrl.trim()) return;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (savedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }

    let validUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(validUrl) && !/^mailto:/i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }

    const displayText = linkText.trim() || validUrl;

    // If selection had text, or user supplied display text
    const selection = window.getSelection();
    if (selection && (!selection.isCollapsed || linkText.trim())) {
      const linkHtml = `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="note-link">${displayText}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
    } else {
      document.execCommand('createLink', false, validUrl);
    }

    emitChange();
    setSavedRange(null);
    setTimeout(updateActiveStates, 20);
  };

  // Checklist clicking inside the editor
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      const isChecked = checkbox.checked;
      if (isChecked) {
        checkbox.setAttribute('checked', 'checked');
      } else {
        checkbox.removeAttribute('checked');
      }
      const itemRow = checkbox.closest('.note-checklist-item') || checkbox.parentElement;
      if (itemRow) {
        itemRow.setAttribute('data-checked', isChecked ? 'true' : 'false');
        const textSpan = itemRow.querySelector('.note-checklist-text') as HTMLElement;
        if (textSpan) {
          if (isChecked) {
            textSpan.style.textDecoration = 'line-through';
            textSpan.style.opacity = '0.6';
          } else {
            textSpan.style.textDecoration = 'none';
            textSpan.style.opacity = '1';
          }
        }
      }
      emitChange();
    }
    updateActiveStates();
  };

  // Keyboard Navigation: Enter key logic for Headings, Checklists, Lists, and Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          document.execCommand('redo');
        } else {
          document.execCommand('undo');
        }
        emitChange();
        setTimeout(updateActiveStates, 20);
        return;
      }
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        document.execCommand('redo');
        emitChange();
        setTimeout(updateActiveStates, 20);
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        openLinkDialog();
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        // Let native handler run or execCommand
        setTimeout(updateActiveStates, 20);
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        setTimeout(updateActiveStates, 20);
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        setTimeout(updateActiveStates, 20);
        return;
      }
    }

    // Enter Key Logic
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      let blockNode: HTMLElement | null = null;
      let curr: Node | null = range.startContainer;

      while (curr && curr !== editorRef.current) {
        if (curr.nodeType === Node.ELEMENT_NODE) {
          const el = curr as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (['h1', 'h2', 'h3', 'blockquote'].includes(tag) || el.classList.contains('note-checklist-item')) {
            blockNode = el;
            break;
          }
        }
        curr = curr.parentNode;
      }

      if (blockNode) {
        const tag = blockNode.tagName.toLowerCase();

        // 1. Heading Enter Key: Automatically returns to Normal paragraph on new line
        if (['h1', 'h2', 'h3'].includes(tag)) {
          e.preventDefault();
          const p = document.createElement('p');

          // Extract contents if in the middle
          const afterRange = range.cloneRange();
          afterRange.selectNodeContents(blockNode);
          afterRange.setStart(range.endContainer, range.endOffset);
          const afterContent = afterRange.extractContents();

          if (afterContent.textContent && afterContent.textContent.trim().length > 0) {
            p.appendChild(afterContent);
          } else {
            p.innerHTML = '<br>';
          }

          if (blockNode.nextSibling) {
            blockNode.parentNode?.insertBefore(p, blockNode.nextSibling);
          } else {
            blockNode.parentNode?.appendChild(p);
          }

          const newRange = document.createRange();
          newRange.setStart(p, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          emitChange();
          setTimeout(updateActiveStates, 20);
          return;
        }

        // 2. Checklist Enter Key: creates next item or exits checklist on empty
        if (blockNode.classList.contains('note-checklist-item')) {
          e.preventDefault();
          const textSpan = blockNode.querySelector('.note-checklist-text') || blockNode;
          const text = textSpan.textContent?.trim() || '';

          // If empty item: exit checklist, turn into normal paragraph
          if (!text || text === '\u200B') {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            blockNode.parentNode?.replaceChild(p, blockNode);
            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            emitChange();
            setTimeout(updateActiveStates, 20);
            return;
          }

          // Otherwise, create next checklist item
          const newItem = document.createElement('div');
          newItem.className = 'note-checklist-item';
          newItem.setAttribute('data-checked', 'false');
          newItem.setAttribute('style', 'display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;');
          newItem.innerHTML = `
            <input type="checkbox" class="note-checkbox" style="margin-top: 4px; accent-color: var(--gold-primary); cursor: pointer; width: 16px; height: 16px;" />
            <span class="note-checklist-text" style="flex: 1; min-width: 0; outline: none;"><br></span>
          `;

          if (blockNode.nextSibling) {
            blockNode.parentNode?.insertBefore(newItem, blockNode.nextSibling);
          } else {
            blockNode.parentNode?.appendChild(newItem);
          }

          const nextSpan = newItem.querySelector('.note-checklist-text');
          if (nextSpan) {
            const newRange = document.createRange();
            newRange.setStart(nextSpan, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
          emitChange();
          setTimeout(updateActiveStates, 20);
          return;
        }

        // 3. Blockquote Enter Key: If at end of empty blockquote line, exit to paragraph
        if (tag === 'blockquote') {
          const text = blockNode.textContent?.trim() || '';
          if (!text) {
            e.preventDefault();
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            blockNode.parentNode?.replaceChild(p, blockNode);
            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            emitChange();
            setTimeout(updateActiveStates, 20);
            return;
          }
        }
      }
    }
  };

  const getHeadingLabel = (h: HeadingType) => {
    switch (h) {
      case 'h1':
        return 'Heading 1';
      case 'h2':
        return 'Heading 2';
      case 'h3':
        return 'Heading 3';
      default:
        return 'Normal Text';
    }
  };

  return (
    <div
      id={id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-gold-subtle)',
        boxShadow: 'var(--neu-shadow-recessed-sm)',
        position: 'relative',
        width: '100%'
      }}
    >
      {/* 1. WORD / APPLE NOTES STYLE STICKY TOOLBAR */}
      <div
        ref={toolbarRef}
        id={`${id}-toolbar`}
        role="toolbar"
        aria-label="Rich text formatting toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 10px',
          backgroundColor: 'var(--surface-base)',
          borderBottom: '1px solid var(--border-gold-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 25,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          userSelect: 'none'
        }}
      >
        {/* Undo / Redo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            onClick={() => executeCommand('undo')}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="neu-editor-btn"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('redo')}
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            aria-label="Redo"
            className="neu-editor-btn"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <span style={dividerStyle} />

        {/* Heading Selector Dropdown */}
        <div ref={headingDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsHeadingDropdownOpen(!isHeadingDropdownOpen)}
            title="Block Style / Headings"
            aria-haspopup="true"
            aria-expanded={isHeadingDropdownOpen}
            className={`neu-editor-btn ${activeFormats.heading !== 'p' ? 'is-active' : ''}`}
            style={{
              padding: '0 8px',
              gap: '4px',
              fontWeight: 600,
              fontSize: '0.75rem',
              minWidth: '105px',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Type size={13} color="var(--gold-primary)" />
              <span>{getHeadingLabel(activeFormats.heading)}</span>
            </span>
            <ChevronDown size={12} />
          </button>

          {isHeadingDropdownOpen && (
            <div
              className="neu-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                zIndex: 50,
                minWidth: '170px',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-raised)',
                boxShadow: 'var(--neu-shadow-raised-lg)',
                border: '1.5px solid var(--border-gold-strong)'
              }}
            >
              <button
                type="button"
                onClick={() => applyHeading('p')}
                style={{
                  ...dropdownItemStyle,
                  fontWeight: activeFormats.heading === 'p' ? 700 : 400,
                  color: activeFormats.heading === 'p' ? 'var(--text-gold)' : 'var(--text-primary)'
                }}
              >
                <span>Normal Text</span>
                {activeFormats.heading === 'p' && <Check size={13} color="var(--gold-primary)" />}
              </button>
              <button
                type="button"
                onClick={() => applyHeading('h1')}
                style={{
                  ...dropdownItemStyle,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: activeFormats.heading === 'h1' ? 'var(--text-gold)' : 'var(--text-primary)'
                }}
              >
                <span>Heading 1</span>
                {activeFormats.heading === 'h1' && <Check size={13} color="var(--gold-primary)" />}
              </button>
              <button
                type="button"
                onClick={() => applyHeading('h2')}
                style={{
                  ...dropdownItemStyle,
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: activeFormats.heading === 'h2' ? 'var(--text-gold)' : 'var(--text-primary)'
                }}
              >
                <span>Heading 2</span>
                {activeFormats.heading === 'h2' && <Check size={13} color="var(--gold-primary)" />}
              </button>
              <button
                type="button"
                onClick={() => applyHeading('h3')}
                style={{
                  ...dropdownItemStyle,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: activeFormats.heading === 'h3' ? 'var(--text-gold)' : 'var(--text-primary)'
                }}
              >
                <span>Heading 3</span>
                {activeFormats.heading === 'h3' && <Check size={13} color="var(--gold-primary)" />}
              </button>
            </div>
          )}
        </div>

        {/* Quick Heading Buttons */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            onClick={() => applyHeading(activeFormats.heading === 'h1' ? 'p' : 'h1')}
            title="Heading 1 - Large Title"
            aria-label="Heading 1"
            className={`neu-editor-btn ${activeFormats.heading === 'h1' ? 'is-active' : ''}`}
          >
            <Heading1 size={14} />
          </button>
          <button
            type="button"
            onClick={() => applyHeading(activeFormats.heading === 'h2' ? 'p' : 'h2')}
            title="Heading 2 - Medium Title"
            aria-label="Heading 2"
            className={`neu-editor-btn ${activeFormats.heading === 'h2' ? 'is-active' : ''}`}
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => applyHeading(activeFormats.heading === 'h3' ? 'p' : 'h3')}
            title="Heading 3 - Subsection Title"
            aria-label="Heading 3"
            className={`neu-editor-btn ${activeFormats.heading === 'h3' ? 'is-active' : ''}`}
          >
            <Heading3 size={14} />
          </button>
        </div>

        <span style={dividerStyle} />

        {/* Inline Formatting: Bold, Italic, Underline, Strikethrough, Highlight */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            title="Bold (Ctrl+B)"
            aria-label="Bold text"
            className={`neu-editor-btn ${activeFormats.bold ? 'is-active' : ''}`}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            title="Italic (Ctrl+I)"
            aria-label="Italic text"
            className={`neu-editor-btn ${activeFormats.italic ? 'is-active' : ''}`}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            title="Underline (Ctrl+U)"
            aria-label="Underline text"
            className={`neu-editor-btn ${activeFormats.underline ? 'is-active' : ''}`}
          >
            <Underline size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('strikeThrough')}
            title="Strikethrough"
            aria-label="Strikethrough text"
            className={`neu-editor-btn ${activeFormats.strike ? 'is-active' : ''}`}
          >
            <Strikethrough size={14} />
          </button>
          <button
            type="button"
            onClick={toggleHighlight}
            title="Gold Liquid Highlight"
            aria-label="Highlight text"
            className={`neu-editor-btn ${activeFormats.highlight ? 'is-active' : ''}`}
          >
            <Highlighter size={14} color="var(--gold-primary)" />
          </button>
        </div>

        <span style={dividerStyle} />

        {/* Lists & Block Elements: Bullet, Numbered, Checklist, Quote, Link */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            title="Bullet List"
            aria-label="Bullet list"
            className={`neu-editor-btn ${activeFormats.bulletList ? 'is-active' : ''}`}
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            title="Numbered List"
            aria-label="Numbered list"
            className={`neu-editor-btn ${activeFormats.orderedList ? 'is-active' : ''}`}
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            onClick={insertChecklist}
            title="Interactive Checklist Item"
            aria-label="Checklist item"
            className={`neu-editor-btn ${activeFormats.checklist ? 'is-active' : ''}`}
          >
            <CheckSquare size={14} color="var(--text-gold)" />
          </button>
          <button
            type="button"
            onClick={openLinkDialog}
            title="Insert or Edit Link (Ctrl+K)"
            aria-label="Insert link"
            className={`neu-editor-btn ${activeFormats.link ? 'is-active' : ''}`}
          >
            <Link2 size={14} />
          </button>
        </div>
      </div>

      {/* 2. CONTENTEDITABLE WRITING AREA */}
      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        onBlur={() => {
          emitChange();
          updateActiveStates();
        }}
        onClick={handleEditorClick}
        onKeyUp={updateActiveStates}
        onMouseUp={updateActiveStates}
        onKeyDown={handleKeyDown}
        role="textbox"
        aria-multiline="true"
        aria-label="Note content rich text editor"
        data-placeholder={placeholder}
        className="notes-rich-content-area"
        style={{
          minHeight,
          padding: '1.25rem',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          lineHeight: '1.65',
          fontFamily: 'var(--font-body)',
          overflowY: 'auto',
          wordBreak: 'break-word',
          cursor: 'text'
        }}
      />

      {/* 3. INLINE LINK MODAL / POPOVER */}
      {showLinkModal && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--surface-raised)',
            borderTop: '1px solid var(--border-gold-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
            <Link2 size={15} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Display label..."
              style={{
                width: '130px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-control)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL (e.g. https://example.com)..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveLink();
                } else if (e.key === 'Escape') {
                  setShowLinkModal(false);
                }
              }}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-control)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleSaveLink}
              className="neu-btn neu-btn-gold"
              style={{ padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Apply Link
            </button>
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              style={{
                padding: '6px 10px',
                fontSize: '0.75rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease'
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '18px',
  backgroundColor: 'var(--border-subtle)',
  margin: '0 3px',
  flexShrink: 0
};
