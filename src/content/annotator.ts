import type { Annotation } from '../types';
import {
  identifyElement,
  getElementPath,
  getFullElementPath,
  getNearbyText,
  getElementClasses,
  getAccessibilityInfo,
  getNearbyElements,
  getDetailedComputedStyles,
  getForensicComputedStyles,
} from '../utils/element-identification';

export class Annotator {
  private annotations: Annotation[] = [];
  private onAnnotationsChange: (annotations: Annotation[]) => void;
  private annotationColor: string;

  constructor(
    annotations: Annotation[],
    annotationColor: string,
    onAnnotationsChange: (annotations: Annotation[]) => void
  ) {
    this.annotations = annotations;
    this.annotationColor = annotationColor;
    this.onAnnotationsChange = onAnnotationsChange;
  }

  public createAnnotation(element: Element, comment: string): Annotation {
    const rect = element.getBoundingClientRect();
    const x = (rect.left / window.innerWidth) * 100;
    const y = rect.top + window.scrollY;

    const annotation: Annotation = {
      id: `annotation-${Date.now()}-${Math.random()}`,
      x,
      y,
      comment,
      element: identifyElement(element),
      elementPath: getElementPath(element),
      timestamp: Date.now(),
      boundingBox: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      },
      cssClasses: getElementClasses(element),
      nearbyText: getNearbyText(element),
      nearbyElements: getNearbyElements(element),
      fullPath: getFullElementPath(element),
      accessibility: getAccessibilityInfo(element),
      computedStyles: getDetailedComputedStyles(element),
      isFixed: window.getComputedStyle(element).position === 'fixed',
    };

    this.annotations.push(annotation);
    this.onAnnotationsChange([...this.annotations]);
    this.renderMarker(annotation);

    return annotation;
  }

  public deleteAnnotation(id: string): void {
    this.annotations = this.annotations.filter(a => a.id !== id);
    this.onAnnotationsChange([...this.annotations]);
    this.removeMarker(id);
  }

  public clearAll(): void {
    this.annotations.forEach(a => this.removeMarker(a.id));
    this.annotations = [];
    this.onAnnotationsChange([...this.annotations]);
  }

  public updateColor(color: string): void {
    this.annotationColor = color;
    // Re-render all markers with new color
    this.annotations.forEach(a => {
      this.removeMarker(a.id);
      this.renderMarker(a);
    });
  }

  private renderMarker(annotation: Annotation): void {
    const marker = document.createElement('div');
    marker.className = 'agentation-marker';
    marker.dataset.annotationId = annotation.id;
    marker.style.left = `${annotation.x}%`;
    marker.style.top = `${annotation.y}px`;
    marker.style.backgroundColor = this.annotationColor;
    marker.style.position = annotation.isFixed ? 'fixed' : 'absolute';

    const index = this.annotations.findIndex(a => a.id === annotation.id) + 1;
    marker.innerHTML = `<span>${index}</span>`;

    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'marker-delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteAnnotation(annotation.id);
    });
    marker.appendChild(deleteBtn);

    // Add tooltip with comment
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    tooltip.textContent = annotation.comment;
    marker.appendChild(tooltip);

    document.body.appendChild(marker);
  }

  private removeMarker(id: string): void {
    const marker = document.querySelector(`[data-annotation-id="${id}"]`);
    marker?.remove();
  }

  public getAnnotations(): Annotation[] {
    return [...this.annotations];
  }
}
