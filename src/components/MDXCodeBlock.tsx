"use client";

import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode, FileText } from 'lucide-react';
import { Fira_Code } from 'next/font/google';

const firaCode = Fira_Code({ subsets: ['latin'], display: 'swap' });

export default function MDXCodeBlock(props: any) {
  const [copied, setCopied] = useState(false);
  
  const extractText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node && typeof node === 'object' && node.props && node.props.children) {
      return extractText(node.props.children);
    }
    return '';
  };

  const rawText = extractText(props.children);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch(e) {
      console.error(e);
    }
  };

  // Determine language and Icon
  let languageLabel = "Note / Data";
  let HeaderIcon = FileText;

  const codeClass = (props.children?.props?.className || props.className || String(props.children?.type === 'code' ? props.children.props.className : ''));

  if (codeClass && typeof codeClass === 'string') {
    const match = codeClass.match(/language-(\w+)/);
    if (match) {
        const lang = match[1].toLowerCase();
        if (lang === 'bash' || lang === 'sh') {
            languageLabel = "Terminal / Command";
            HeaderIcon = Terminal;
        } else if (lang === 'python' || lang === 'py') {
            languageLabel = "Python Code";
            HeaderIcon = FileCode;
        } else if (lang === 'html') {
            languageLabel = "HTML Payload";
            HeaderIcon = FileCode;
        } else if (lang === 'js' || lang === 'javascript') {
            languageLabel = "JavaScript";
            HeaderIcon = FileCode;
        } else if (lang !== 'undefined') {
            languageLabel = lang.toUpperCase() + " Code";
            HeaderIcon = FileCode;
        }
    }
  }

  // --- SMART HEURISTIC OVERRIDES ---
  // MDX parsers frequently "guess" or "inherit" the bash language for plaintext blocks. 
  // We can intelligently override these based on the actual text content.
  const textCheck = rawText.trim();
  if (textCheck.startsWith('IP:') || textCheck.includes('OS:') || textCheck.includes('Domain:')) {
      languageLabel = "Target Info";
      HeaderIcon = FileText;
  } else if (textCheck.match(/^http[s]?:\/\//) && !textCheck.includes('\n')) {
      languageLabel = "URL / Link";
      HeaderIcon = FileText;
  } else if (textCheck.match(/^[a-zA-Z0-9]+$/) && textCheck.length > 20) {
      languageLabel = "Hash / Flag";
      HeaderIcon = FileText;
  }

  return (
    <div 
      className={`relative group my-8 overflow-hidden rounded-xl bg-[#09090b] border border-[#00f3ff]/20 shadow-[0_0_20px_rgba(0,243,255,0.03)] [&_code]:!font-inherit [&_pre]:!font-inherit [&_code]:text-[#a5f3fc] [&_code]:!bg-transparent`}
      style={{ fontFamily: firaCode.style.fontFamily }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#00f3ff]/10 via-[#00f3ff]/5 to-transparent border-b border-[#00f3ff]/20">
        <div className="flex items-center gap-2">
          <HeaderIcon size={14} className="text-[#00f3ff]" />
          <span className="text-[0.65rem] text-[#00f3ff]/80 uppercase tracking-[0.2em] font-bold">
            {languageLabel}
          </span>
        </div>
        
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-gray-400 hover:text-[#00f3ff] transition-all rounded bg-black/20 hover:bg-[#00f3ff]/10 border border-transparent hover:border-[#00f3ff]/30 active:scale-95"
          title="Copy"
        >
          {copied ? (
            <>
              <Check size={14} className="text-[#00f3ff]" />
              <span className="text-[#00f3ff]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-5 overflow-x-auto text-[0.85rem] leading-[1.7]">
        <pre {...props} className="bg-transparent m-0 p-0 shadow-none border-none" />
      </div>
    </div>
  );
}
