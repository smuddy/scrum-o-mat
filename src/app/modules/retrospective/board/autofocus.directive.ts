import {AfterViewInit, Directive, ElementRef, inject} from '@angular/core';

// Fokussiert das Host-Element, sobald es eingefuegt wird. Wird auf das Karten-Textarea im Edit-Modus
// angewandt: da das Textarea per @if strukturell neu erzeugt wird (auch beim Wechsel zwischen Karten),
// feuert ngAfterViewInit jedes Mal frisch. Das native HTML-`autofocus`-Attribut greift bei dynamisch
// eingefuegten Elementen NICHT, daher diese kleine Directive. Cursor wird ans Textende gesetzt.
@Directive({
  selector: '[appAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements AfterViewInit {
  private el = inject<ElementRef<HTMLTextAreaElement | HTMLInputElement>>(ElementRef);

  public ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    node.focus();
    const length = node.value?.length ?? 0;
    try {
      node.setSelectionRange(length, length);
    } catch {
      // setSelectionRange ist nicht auf allen Input-Typen erlaubt -- Fokus allein genuegt dann.
    }
  }
}
