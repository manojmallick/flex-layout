import {
  AfterContentInit,
  ContentChild,
  ContentChildren,
  Directive,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
  QueryList
} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {MediaMarshaller} from '@angular/flex-layout';

import {SplitHandleDirective} from './split-handle.directive';
import {SplitAreaDirective} from './split-area.directive';

@Directive({
  selector: '[ngxSplit]',
  host: {
    class: 'ngx-split'
  }
})
export class SplitDirective implements AfterContentInit, OnDestroy {
  watcher;

  @Input('ngxSplit')
  direction = 'row';

  @ContentChild(SplitHandleDirective) handle: SplitHandleDirective;
  @ContentChildren(SplitAreaDirective) areas: QueryList<SplitAreaDirective>;

  constructor(private elementRef: ElementRef,
              @Inject(PLATFORM_ID) private _platformId: Object,
              private marshal: MediaMarshaller) {}

  ngAfterContentInit(): void {
    if (isPlatformBrowser(this._platformId)) {
      this.watcher = this.handle.drag.subscribe(pos => this.onDrag(pos));
    }
  }

  ngOnDestroy() {
    if (this.watcher) {
      this.watcher.unsubscribe();
    }
  }

  /**
   * While dragging, continually update the `flex.activatedValue` for each area
   * managed by the splitter.
   */
  onDrag({x, y}: {x: number, y: number}): void {
    const dragAmount = (this.direction === 'row') ? x : y;

    this.areas.forEach((area, i) => {
      // get the cur flex and the % in px
      const elRef = area.elementRef;
      const delta = (i === 0) ? dragAmount : -dragAmount;
      const currentValue = this.marshal.getValue(elRef.nativeElement, 'flex');

      const changeValues = currentValue.split(' ');
      changeValues[2] = this.calculateSize(changeValues[2], delta) + '';

      // Update Flex-Layout value to build/inject new flexbox CSS
      this.marshal.setValue(elRef.nativeElement, 'flex', changeValues.join(' '),
        this.marshal.activatedBreakpoint);
    });
  }

  /**
   * Use the pixel delta change to recalculate the area size (%)
   * Note: flex value may be '', %, px, or '<grow> <shrink> <basis>'
   */
  calculateSize(value, delta) {
    const containerSizePx = this.elementRef.nativeElement.clientWidth;
    const elementSizePx = Math.round(this.valueToPixel(value, containerSizePx));

    const elementSize = ((elementSizePx + delta) / containerSizePx) * 100;
    return Math.round(elementSize * 100) / 100;
  }

  /**
   * Convert the pixel or percentage value to a raw
   * pixel float value.
   */
  valueToPixel(value: string | number, parentWidth: number): number {
    const isPercent = () => String(value).indexOf('px') < 0;
    let size = parseFloat(String(value));
    if (isPercent()) {
      size = parentWidth * (size / 100);  // Convert percentage to actual pixel float value
    }
    return size;
  }
}
