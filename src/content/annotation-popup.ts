export interface AnnotationPopupOptions {
  element: string;
  selectedText?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  position: { x: number; y: number };
  accentColor?: string;
}

export class AnnotationPopup {
  private container: HTMLDivElement;
  private textarea: HTMLTextAreaElement | null = null;
  private options: AnnotationPopupOptions;

  constructor(options: AnnotationPopupOptions) {
    this.options = options;
    this.container = this.createPopup();
    document.body.appendChild(this.container);
  }

  private createPopup(): HTMLDivElement {
    const popup = document.createElement('div');
    popup.className = 'agentation-annotation-popup';
    popup.dataset.annotationPopup = 'true';

    const accentColor = this.options.accentColor || '#3c82f7';

    Object.assign(popup.style, {
      position: 'fixed',
      left: `${this.options.position.x}px`,
      top: `${this.options.position.y}px`,
      zIndex: '1000001',
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '300px',
      maxWidth: '400px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      opacity: '0',
      transform: 'scale(0.95) translateY(8px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    });

    const elementName = document.createElement('div');
    elementName.textContent = this.options.element;
    Object.assign(elementName.style, {
      fontSize: '13px',
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.9)',
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    Object.assign(closeBtn.style, {
      background: 'transparent',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'background 0.15s ease, color 0.15s ease',
    });
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      closeBtn.style.color = 'rgba(255, 255, 255, 0.9)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.color = 'rgba(255, 255, 255, 0.5)';
    });
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cancel();
    });

    header.appendChild(elementName);
    header.appendChild(closeBtn);
    popup.appendChild(header);

    if (this.options.selectedText) {
      const selectedTextDiv = document.createElement('div');
      Object.assign(selectedTextDiv.style, {
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.6)',
        fontStyle: 'italic',
        marginBottom: '12px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        maxHeight: '60px',
        overflow: 'auto',
      });
      selectedTextDiv.textContent = `"${this.options.selectedText}"`;
      popup.appendChild(selectedTextDiv);
    }

    this.textarea = document.createElement('textarea');
    this.textarea.placeholder = this.options.placeholder || 'What should change?';
    this.textarea.value = this.options.initialValue || '';
    Object.assign(this.textarea.style, {
      width: '100%',
      minHeight: '80px',
      maxHeight: '200px',
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.08)',
      border: `2px solid transparent`,
      borderRadius: '8px',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '14px',
      fontFamily: 'inherit',
      resize: 'vertical',
      outline: 'none',
      transition: 'border-color 0.15s ease, background 0.15s ease',
      marginBottom: '12px',
    });

    this.textarea.addEventListener('focus', () => {
      if (this.textarea) {
        this.textarea.style.borderColor = accentColor;
        this.textarea.style.background = 'rgba(255, 255, 255, 0.12)';
      }
    });

    this.textarea.addEventListener('blur', () => {
      if (this.textarea) {
        this.textarea.style.borderColor = 'transparent';
        this.textarea.style.background = 'rgba(255, 255, 255, 0.08)';
      }
    });

    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancel();
      }
    });

    popup.appendChild(this.textarea);

    const buttonsDiv = document.createElement('div');
    Object.assign(buttonsDiv.style, {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    Object.assign(cancelBtn.style, {
      padding: '8px 16px',
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
    });
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      cancelBtn.style.color = 'rgba(255, 255, 255, 0.9)';
      cancelBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'transparent';
      cancelBtn.style.color = 'rgba(255, 255, 255, 0.7)';
      cancelBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cancel();
    });

    const submitBtn = document.createElement('button');
    submitBtn.textContent = this.options.submitLabel || 'Add';
    Object.assign(submitBtn.style, {
      padding: '8px 16px',
      background: accentColor,
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'transform 0.1s ease, opacity 0.15s ease',
    });
    submitBtn.addEventListener('mouseenter', () => {
      submitBtn.style.opacity = '0.9';
    });
    submitBtn.addEventListener('mouseleave', () => {
      submitBtn.style.opacity = '1';
    });
    submitBtn.addEventListener('mousedown', () => {
      submitBtn.style.transform = 'scale(0.95)';
    });
    submitBtn.addEventListener('mouseup', () => {
      submitBtn.style.transform = 'scale(1)';
    });
    submitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.submit();
    });

    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(submitBtn);
    popup.appendChild(buttonsDiv);

    // Stop all click events from bubbling to document
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Animate in after a frame
    requestAnimationFrame(() => {
      popup.style.opacity = '1';
      popup.style.transform = 'scale(1) translateY(0)';
    });

    // Focus textarea after animation
    setTimeout(() => {
      this.textarea?.focus();
    }, 50);

    return popup;
  }

  private submit(): void {
    const text = this.textarea?.value.trim();
    if (!text) return;

    this.animateOut(() => {
      this.options.onSubmit(text);
      this.destroy();
    });
  }

  private cancel(): void {
    this.animateOut(() => {
      this.options.onCancel();
      this.destroy();
    });
  }

  private animateOut(callback: () => void): void {
    this.container.style.opacity = '0';
    this.container.style.transform = 'scale(0.95) translateY(8px)';
    setTimeout(callback, 150);
  }

  public shake(): void {
    this.container.style.animation = 'shake 0.25s ease';
    setTimeout(() => {
      this.container.style.animation = '';
      this.textarea?.focus();
    }, 250);
  }

  public destroy(): void {
    this.container.remove();
  }
}
