# AgentFeedback Browser Extension Implementation Plan

> **Implementation Guide:** This is a complete implementation plan for building a browser extension from scratch. Follow each task sequentially. The extension will have the same UI/UX as the agentation npm package but written in vanilla TypeScript.

**Goal:** Build a Chrome/Firefox browser extension that lets users annotate any website and copy structured feedback optimized for AI coding agents.

**Architecture:** Content script injected into all pages using Shadow DOM for style isolation. Vanilla TypeScript UI (no React). Chrome extension APIs for storage and messaging. Supports 4 output detail levels: compact, standard, detailed, forensic.

**Tech Stack:** TypeScript, SCSS, esbuild, Chrome Extension Manifest V3, Shadow DOM

**Source Reference:** Copy SCSS styles from `/Users/harsh.rajmathur/Desktop/harsh-builds/agentation/_package-export/src/components/page-toolbar-css/styles.module.scss`

---

See full implementation plan at: `docs/plans/2026-02-05-agent-feedback-extension.md`

This plan includes 18 detailed tasks covering:
- Project setup & scaffolding
- Copying styles from agentation
- Type definitions & utilities
- Shadow DOM setup
- Background service worker
- Full toolbar UI implementation
- All 4 annotation modes (click, text, multi-select, area)
- All 4 output formats (compact, standard, detailed, forensic)
- Testing & packaging for distribution

Each task has step-by-step instructions with exact code, file paths, and commit messages.
