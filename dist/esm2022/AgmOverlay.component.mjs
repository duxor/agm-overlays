import { Component, ContentChildren, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild } from "@angular/core";
import { AgmInfoWindow } from "@duxor/agm-core";
import * as i0 from "@angular/core";
import * as i1 from "@duxor/agm-core";
export class AgmOverlay {
    _mapsWrapper;
    _markerManager;
    latitude;
    longitude;
    visible = true;
    zIndex = 1;
    bounds;
    //TIP: Do NOT use this... Just put (click) on your html overlay element
    markerClick = new EventEmitter();
    openInfoWindow = true;
    infoWindow = new QueryList();
    //TODO, implement this
    draggable = false;
    template;
    destroyed;
    overlayView;
    //elmGuts:any
    _observableSubscriptions = [];
    constructor(_mapsWrapper, _markerManager //rename to fight the private declaration of parent
    ) {
        this._mapsWrapper = _mapsWrapper;
        this._markerManager = _markerManager;
    }
    ngAfterViewInit() {
        //remove reference of info windows
        const iWins = this.template.nativeElement.getElementsByTagName('agm-info-window');
        for (let x = iWins.length - 1; x >= 0; --x) {
            iWins[x].parentNode.removeChild(iWins[x]);
        }
        this.load().then(() => {
            this.onChanges = this.onChangesOverride;
        });
    }
    ngAfterContentInit() {
        this.infoWindow.changes.subscribe(() => this.handleInfoWindowUpdate());
    }
    ngOnChanges(changes) {
        this.onChanges(changes);
    }
    onChanges(changes) { }
    onChangesOverride(changes) {
        if (changes.latitude || changes.longitude || changes.zIndex) {
            this.overlayView.latitude = this.latitude;
            this.overlayView.longitude = this.longitude;
            this.overlayView.zIndex = this.zIndex;
            this.destroy().then(() => this.load());
        }
    }
    ngOnDestroy() {
        this.destroy();
    }
    destroy() {
        this.destroyed = true;
        this._markerManager.deleteMarker(this.overlayView);
        if (this.overlayView) {
            if (this.overlayView.div) {
                this.overlayView.remove();
            }
            this.overlayView.setMap(null);
        }
        this._observableSubscriptions.forEach((s) => s.unsubscribe());
        delete this.overlayView;
        //delete this.elmGuts
    }
    handleInfoWindowUpdate() {
        if (this.infoWindow.length > 1) {
            throw new Error('Expected no more than one info window.');
        }
        this.infoWindow.forEach(iWin => {
            iWin.hostMarker = this.overlayView;
        });
    }
    load() {
        return this._mapsWrapper.getNativeMap()
            .then((map) => {
            const overlay = this.getOverlay(map);
            this._markerManager.addMarker(overlay);
            this._addEventListeners();
            return this._markerManager.getNativeMarker(overlay);
        })
            .then((nativeMarker) => {
            const setMap = nativeMarker.setMap;
            if (nativeMarker['map']) {
                this.overlayView.setMap(nativeMarker['map']);
            }
            nativeMarker.setMap = (map) => {
                setMap.call(nativeMarker, map);
                if (this.overlayView) {
                    this.overlayView.setMap(map);
                }
            };
        });
    }
    getOverlay(map) {
        this.overlayView = this.overlayView || new google.maps.OverlayView();
        /* make into foo marker that AGM likes */
        this.overlayView.iconUrl = " ";
        this.overlayView.latitude = this.latitude;
        this.overlayView.longitude = this.longitude;
        this.overlayView.visible = false; //hide 40x40 transparent placeholder that prevents hover events
        /* end */
        if (this.bounds) {
            this.overlayView.bounds_ = new google.maps.LatLngBounds(new google.maps.LatLng(this.latitude + this.bounds.x.latitude, this.longitude + this.bounds.x.longitude), new google.maps.LatLng(this.latitude + this.bounds.y.latitude, this.longitude + this.bounds.y.longitude));
        }
        // js-marker-clusterer does not support updating positions. We are forced to delete/add and compensate for .removeChild calls
        const elm = this.template.nativeElement.children[0];
        //const elm =  this.elmGuts || this.template.nativeElement.children[0]
        //we must always be sure to steal our stolen element back incase we are just in middle of changes and will redraw
        const restore = (div) => {
            this.template.nativeElement.appendChild(div);
        };
        this.overlayView.remove = function () {
            if (!this.div)
                return;
            this.div.parentNode.removeChild(this.div);
            restore(this.div);
            delete this.div;
        };
        this.overlayView.getDiv = function () {
            return this.div;
        };
        this.overlayView.draw = function () {
            if (!this.div) {
                this.div = elm;
                const panes = this.getPanes();
                // if no panes then assumed not on map
                if (!panes || !panes.overlayImage)
                    return;
                panes.overlayImage.appendChild(elm);
            }
            const latlng = new google.maps.LatLng(this.latitude, this.longitude);
            const proj = this.getProjection();
            if (!proj)
                return;
            const point = proj.fromLatLngToDivPixel(latlng);
            if (point) {
                elm.style.left = (point.x - 10) + 'px';
                elm.style.top = (point.y - 20) + 'px';
            }
            if (this.bounds_) {
                // stretch content between two points leftbottom and righttop and resize
                const proj = this.getProjection();
                const sw = proj.fromLatLngToDivPixel(this.bounds_.getSouthWest());
                const ne = proj.fromLatLngToDivPixel(this.bounds_.getNorthEast());
                this.div.style.left = sw.x + 'px';
                this.div.style.top = ne.y + 'px';
                this.div.children[0].style.width = ne.x - sw.x + 'px';
                this.div.children[0].style.height = sw.y - ne.y + 'px';
            }
        };
        elm.addEventListener("click", (event) => {
            this.handleTap();
            event.stopPropagation();
        });
        this.handleInfoWindowUpdate();
        return this.overlayView;
    }
    handleTap() {
        if (this.openInfoWindow) {
            this.infoWindow.forEach(infoWindow => {
                infoWindow.open();
            });
        }
        this.markerClick.emit();
    }
    _addEventListeners() {
        const eo = this._markerManager.createEventObservable('click', this.overlayView);
        const cs = eo.subscribe(() => this.handleTap());
        this._observableSubscriptions.push(cs);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.4", ngImport: i0, type: AgmOverlay, deps: [{ token: i1.GoogleMapsAPIWrapper }, { token: i1.MarkerManager }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.2.4", type: AgmOverlay, selector: "agm-overlay", inputs: { latitude: "latitude", longitude: "longitude", visible: "visible", zIndex: "zIndex", bounds: "bounds", openInfoWindow: "openInfoWindow", draggable: ["markerDraggable", "draggable"] }, outputs: { markerClick: "markerClick" }, queries: [{ propertyName: "infoWindow", predicate: AgmInfoWindow }], viewQueries: [{ propertyName: "template", first: true, predicate: ["content"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: '<div #content><div style="position:absolute"><ng-content></ng-content></div></div>', isInline: true });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.4", ngImport: i0, type: AgmOverlay, decorators: [{
            type: Component,
            args: [{
                    selector: "agm-overlay",
                    template: '<div #content><div style="position:absolute"><ng-content></ng-content></div></div>'
                }]
        }], ctorParameters: () => [{ type: i1.GoogleMapsAPIWrapper }, { type: i1.MarkerManager }], propDecorators: { latitude: [{
                type: Input
            }], longitude: [{
                type: Input
            }], visible: [{
                type: Input
            }], zIndex: [{
                type: Input
            }], bounds: [{
                type: Input
            }], markerClick: [{
                type: Output
            }], openInfoWindow: [{
                type: Input
            }], infoWindow: [{
                type: ContentChildren,
                args: [AgmInfoWindow]
            }], draggable: [{
                type: Input,
                args: ['markerDraggable']
            }], template: [{
                type: ViewChild,
                args: ['content', { read: ElementRef }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWdtT3ZlcmxheS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvQWdtT3ZlcmxheS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUNMLFNBQVMsRUFDVCxlQUFlLEVBQ2YsVUFBVSxFQUNWLFlBQVksRUFDWixLQUFLLEVBQ0wsTUFBTSxFQUNOLFNBQVMsRUFDVCxTQUFTLEVBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLGFBQWEsRUFBdUMsTUFBTSxpQkFBaUIsQ0FBQzs7O0FBdUJsRixNQUFNLE9BQU8sVUFBVTtJQXlCWjtJQUNGO0lBekJELFFBQVEsQ0FBUztJQUNqQixTQUFTLENBQVM7SUFFbEIsT0FBTyxHQUFZLElBQUksQ0FBQTtJQUN2QixNQUFNLEdBQVcsQ0FBQyxDQUFBO0lBQ2xCLE1BQU0sQ0FBUztJQUV4Qix1RUFBdUU7SUFDN0QsV0FBVyxHQUF1QixJQUFJLFlBQVksRUFBUSxDQUFBO0lBRTNELGNBQWMsR0FBWSxJQUFJLENBQUE7SUFDUCxVQUFVLEdBQTZCLElBQUksU0FBUyxFQUFpQixDQUFBO0lBRXJHLHNCQUFzQjtJQUNJLFNBQVMsR0FBWSxLQUFLLENBQUE7SUFFUixRQUFRLENBQWE7SUFFakUsU0FBUyxDQUFVO0lBQ25CLFdBQVcsQ0FBTTtJQUNqQixhQUFhO0lBQ0wsd0JBQXdCLEdBQW1CLEVBQUUsQ0FBQTtJQUVyRCxZQUNZLFlBQWtDLEVBQ3BDLGNBQTZCLENBQUEsbURBQW1EOztRQUQ5RSxpQkFBWSxHQUFaLFlBQVksQ0FBc0I7UUFDcEMsbUJBQWMsR0FBZCxjQUFjLENBQWU7SUFDckMsQ0FBQztJQUVILGVBQWU7UUFDYixrQ0FBa0M7UUFDbEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUNqRixLQUFJLElBQUksQ0FBQyxHQUFDLEtBQUss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c1wiO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBWaWV3Q2hpbGRcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IEFnbUluZm9XaW5kb3csIEdvb2dsZU1hcHNBUElXcmFwcGVyLCBNYXJrZXJNYW5hZ2VyIH0gZnJvbSBcIkBkdXhvci9hZ20tY29yZVwiO1xuXG5kZWNsYXJlIHZhciBnb29nbGU6IGFueVxuXG5leHBvcnQgaW50ZXJmYWNlIGxhdExuZ3tcbiAgbGF0aXR1ZGUgIDogbnVtYmVyXG4gIGxvbmdpdHVkZSA6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIGJvdW5kc3tcbiAgeDogbGF0TG5nLy9yZWxhdGl2ZSBhZGp1c3RtZW50IG1hdGhlbWF0aWNzXG4gIHk6IGxhdExuZy8vcmVsYXRpdmUgYWRqdXN0bWVudCBtYXRoZW1hdGljc1xufSBcblxuZXhwb3J0IGludGVyZmFjZSBsYXRMbmdQbHVze1xuICBsYXRpdHVkZSAgOiBudW1iZXJcbiAgbG9uZ2l0dWRlIDogbnVtYmVyXG4gIGJvdW5kcz8gICA6IGJvdW5kc1xufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6XCJhZ20tb3ZlcmxheVwiLFxuICB0ZW1wbGF0ZTonPGRpdiAjY29udGVudD48ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIj48bmctY29udGVudD48L25nLWNvbnRlbnQ+PC9kaXY+PC9kaXY+J1xufSkgZXhwb3J0IGNsYXNzIEFnbU92ZXJsYXl7XG4gIEBJbnB1dCgpIGxhdGl0dWRlITogbnVtYmVyXG4gIEBJbnB1dCgpIGxvbmdpdHVkZSE6IG51bWJlclxuICBcbiAgQElucHV0KCkgdmlzaWJsZTogYm9vbGVhbiA9IHRydWVcbiAgQElucHV0KCkgekluZGV4OiBudW1iZXIgPSAxXG4gIEBJbnB1dCgpIGJvdW5kcyE6IGJvdW5kc1xuICBcbiAgLy9USVA6IERvIE5PVCB1c2UgdGhpcy4uLiBKdXN0IHB1dCAoY2xpY2spIG9uIHlvdXIgaHRtbCBvdmVybGF5IGVsZW1lbnRcbiAgQE91dHB1dCgpIG1hcmtlckNsaWNrOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KClcbiAgXG4gIEBJbnB1dCgpIG9wZW5JbmZvV2luZG93OiBib29sZWFuID0gdHJ1ZVxuICBAQ29udGVudENoaWxkcmVuKEFnbUluZm9XaW5kb3cpIGluZm9XaW5kb3c6IFF1ZXJ5TGlzdDxBZ21JbmZvV2luZG93PiA9IG5ldyBRdWVyeUxpc3Q8QWdtSW5mb1dpbmRvdz4oKVxuXG4gIC8vVE9ETywgaW1wbGVtZW50IHRoaXNcbiAgQElucHV0KCdtYXJrZXJEcmFnZ2FibGUnKSBkcmFnZ2FibGU6IGJvb2xlYW4gPSBmYWxzZVxuXG4gIEBWaWV3Q2hpbGQoJ2NvbnRlbnQnLCB7IHJlYWQ6IEVsZW1lbnRSZWYgfSkgdGVtcGxhdGUhOiBFbGVtZW50UmVmXG5cbiAgZGVzdHJveWVkITogYm9vbGVhblxuICBvdmVybGF5VmlldyE6IGFueVxuICAvL2VsbUd1dHM6YW55XG4gIHByaXZhdGUgX29ic2VydmFibGVTdWJzY3JpcHRpb25zOiBTdWJzY3JpcHRpb25bXSA9IFtdXG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIF9tYXBzV3JhcHBlcjogR29vZ2xlTWFwc0FQSVdyYXBwZXIsXG4gICAgcHJpdmF0ZSBfbWFya2VyTWFuYWdlcjogTWFya2VyTWFuYWdlci8vcmVuYW1lIHRvIGZpZ2h0IHRoZSBwcml2YXRlIGRlY2xhcmF0aW9uIG9mIHBhcmVudFxuICApe31cblxuICBuZ0FmdGVyVmlld0luaXQoKXtcbiAgICAvL3JlbW92ZSByZWZlcmVuY2Ugb2YgaW5mbyB3aW5kb3dzXG4gICAgY29uc3QgaVdpbnMgPSB0aGlzLnRlbXBsYXRlLm5hdGl2ZUVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2FnbS1pbmZvLXdpbmRvdycpXG4gICAgZm9yKGxldCB4PWlXaW5zLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBpV2luc1t4XS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlXaW5zW3hdKVxuICAgIH1cblxuICAgIHRoaXMubG9hZCgpLnRoZW4oKCk9PntcbiAgICAgIHRoaXMub25DaGFuZ2VzID0gdGhpcy5vbkNoYW5nZXNPdmVycmlkZVxuICAgIH0pXG4gIH1cbiAgXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICB0aGlzLmluZm9XaW5kb3cuY2hhbmdlcy5zdWJzY3JpYmUoKCkgPT4gdGhpcy5oYW5kbGVJbmZvV2luZG93VXBkYXRlKCkpO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogYW55KSB7XG4gICAgdGhpcy5vbkNoYW5nZXMoY2hhbmdlcylcbiAgfVxuXG4gIG9uQ2hhbmdlcyhjaGFuZ2VzOiBhbnkpIHsgfVxuXG4gIG9uQ2hhbmdlc092ZXJyaWRlKGNoYW5nZXM6IGFueSkge1xuICAgIGlmKCBjaGFuZ2VzLmxhdGl0dWRlIHx8IGNoYW5nZXMubG9uZ2l0dWRlIHx8IGNoYW5nZXMuekluZGV4ICl7XG4gICAgICB0aGlzLm92ZXJsYXlWaWV3LmxhdGl0dWRlID0gdGhpcy5sYXRpdHVkZVxuICAgICAgdGhpcy5vdmVybGF5Vmlldy5sb25naXR1ZGUgPSB0aGlzLmxvbmdpdHVkZVxuICAgICAgdGhpcy5vdmVybGF5Vmlldy56SW5kZXggPSB0aGlzLnpJbmRleFxuICAgICAgdGhpcy5kZXN0cm95KCkudGhlbigoKT0+dGhpcy5sb2FkKCkpXG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKXtcbiAgICB0aGlzLmRlc3Ryb3koKVxuICB9XG5cbiAgZGVzdHJveSgpOiBhbnkge1xuICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZVxuXG4gICAgdGhpcy5fbWFya2VyTWFuYWdlci5kZWxldGVNYXJrZXIodGhpcy5vdmVybGF5VmlldylcbiAgICBcbiAgICBpZiggdGhpcy5vdmVybGF5VmlldyApe1xuICAgICAgaWYoIHRoaXMub3ZlcmxheVZpZXcuZGl2ICl7XG4gICAgICAgIHRoaXMub3ZlcmxheVZpZXcucmVtb3ZlKClcbiAgICAgIH1cbiAgICAgIHRoaXMub3ZlcmxheVZpZXcuc2V0TWFwKG51bGwpXG4gICAgfVxuICAgIFxuICAgIHRoaXMuX29ic2VydmFibGVTdWJzY3JpcHRpb25zLmZvckVhY2goKHMpID0+IHMudW5zdWJzY3JpYmUoKSlcbiAgICBcbiAgICBkZWxldGUgdGhpcy5vdmVybGF5Vmlld1xuICAgIC8vZGVsZXRlIHRoaXMuZWxtR3V0c1xuICB9XG4gIFxuICBwcml2YXRlIGhhbmRsZUluZm9XaW5kb3dVcGRhdGUoKSB7XG4gICAgaWYgKHRoaXMuaW5mb1dpbmRvdy5sZW5ndGggPiAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIG5vIG1vcmUgdGhhbiBvbmUgaW5mbyB3aW5kb3cuJyk7XG4gICAgfVxuICAgIFxuICAgIHRoaXMuaW5mb1dpbmRvdy5mb3JFYWNoKGlXaW4gPT4ge1xuICAgICAgaVdpbi5ob3N0TWFya2VyID0gPGFueT50aGlzLm92ZXJsYXlWaWV3XG4gICAgfSk7XG4gIH1cblxuICBsb2FkKCk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcHNXcmFwcGVyLmdldE5hdGl2ZU1hcCgpXG4gICAgLnRoZW4oKG1hcDogYW55KSA9PiB7XG4gICAgICBjb25zdCBvdmVybGF5ID0gdGhpcy5nZXRPdmVybGF5KCBtYXAgKVxuXG4gICAgICB0aGlzLl9tYXJrZXJNYW5hZ2VyLmFkZE1hcmtlcihvdmVybGF5KVxuICAgICAgdGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoKVxuXG4gICAgICByZXR1cm4gdGhpcy5fbWFya2VyTWFuYWdlci5nZXROYXRpdmVNYXJrZXIoIG92ZXJsYXkgKVxuICAgIH0pXG4gICAgICAudGhlbigobmF0aXZlTWFya2VyOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IHNldE1hcCA9IG5hdGl2ZU1hcmtlci5zZXRNYXBcbiAgICAgIGlmKCBuYXRpdmVNYXJrZXJbJ21hcCddICl7XG4gICAgICAgIHRoaXMub3ZlcmxheVZpZXcuc2V0TWFwKCBuYXRpdmVNYXJrZXJbJ21hcCddIClcbiAgICAgIH1cblxuICAgICAgbmF0aXZlTWFya2VyLnNldE1hcCA9IChtYXA6IGFueSkgPT4ge1xuICAgICAgICBzZXRNYXAuY2FsbChuYXRpdmVNYXJrZXIsbWFwKVxuXG4gICAgICAgIGlmKCB0aGlzLm92ZXJsYXlWaWV3ICl7XG4gICAgICAgICAgdGhpcy5vdmVybGF5Vmlldy5zZXRNYXAobWFwKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGdldE92ZXJsYXkobWFwOiBhbnkpIHtcbiAgICB0aGlzLm92ZXJsYXlWaWV3ID0gdGhpcy5vdmVybGF5VmlldyB8fCBuZXcgZ29vZ2xlLm1hcHMuT3ZlcmxheVZpZXcoKVxuXG4gICAgLyogbWFrZSBpbnRvIGZvbyBtYXJrZXIgdGhhdCBBR00gbGlrZXMgKi9cbiAgICAgIHRoaXMub3ZlcmxheVZpZXcuaWNvblVybCA9IFwiIFwiXG4gICAgICB0aGlzLm92ZXJsYXlWaWV3LmxhdGl0dWRlID0gdGhpcy5sYXRpdHVkZVxuICAgICAgdGhpcy5vdmVybGF5Vmlldy5sb25naXR1ZGUgPSB0aGlzLmxvbmdpdHVkZVxuICAgICAgdGhpcy5vdmVybGF5Vmlldy52aXNpYmxlID0gZmFsc2UvL2hpZGUgNDB4NDAgdHJhbnNwYXJlbnQgcGxhY2Vob2xkZXIgdGhhdCBwcmV2ZW50cyBob3ZlciBldmVudHNcbiAgICAvKiBlbmQgKi9cblxuICAgIGlmKCB0aGlzLmJvdW5kcyApe1xuICAgICAgdGhpcy5vdmVybGF5Vmlldy5ib3VuZHNfID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcyhcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhcbiAgICAgICAgICB0aGlzLmxhdGl0dWRlICsgdGhpcy5ib3VuZHMueC5sYXRpdHVkZSxcbiAgICAgICAgICB0aGlzLmxvbmdpdHVkZSArIHRoaXMuYm91bmRzLngubG9uZ2l0dWRlXG4gICAgICAgICksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5MYXRMbmcoXG4gICAgICAgICAgdGhpcy5sYXRpdHVkZSArIHRoaXMuYm91bmRzLnkubGF0aXR1ZGUsXG4gICAgICAgICAgdGhpcy5sb25naXR1ZGUgKyB0aGlzLmJvdW5kcy55LmxvbmdpdHVkZVxuICAgICAgICApXG4gICAgICApXG4gICAgfVxuXG4gICAgLy8ganMtbWFya2VyLWNsdXN0ZXJlciBkb2VzIG5vdCBzdXBwb3J0IHVwZGF0aW5nIHBvc2l0aW9ucy4gV2UgYXJlIGZvcmNlZCB0byBkZWxldGUvYWRkIGFuZCBjb21wZW5zYXRlIGZvciAucmVtb3ZlQ2hpbGQgY2FsbHNcbiAgICBjb25zdCBlbG0gPSB0aGlzLnRlbXBsYXRlLm5hdGl2ZUVsZW1lbnQuY2hpbGRyZW5bMF1cbiAgICAvL2NvbnN0IGVsbSA9ICB0aGlzLmVsbUd1dHMgfHwgdGhpcy50ZW1wbGF0ZS5uYXRpdmVFbGVtZW50LmNoaWxkcmVuWzBdXG5cbiAgICAvL3dlIG11c3QgYWx3YXlzIGJlIHN1cmUgdG8gc3RlYWwgb3VyIHN0b2xlbiBlbGVtZW50IGJhY2sgaW5jYXNlIHdlIGFyZSBqdXN0IGluIG1pZGRsZSBvZiBjaGFuZ2VzIGFuZCB3aWxsIHJlZHJhd1xuICAgIGNvbnN0IHJlc3RvcmUgPSAoZGl2OiBhbnkpID0+IHtcbiAgICAgIHRoaXMudGVtcGxhdGUubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZCggZGl2IClcbiAgICB9XG5cbiAgICB0aGlzLm92ZXJsYXlWaWV3LnJlbW92ZSA9IGZ1bmN0aW9uKCl7XG4gICAgICBpZighdGhpcy5kaXYpcmV0dXJuXG4gICAgICB0aGlzLmRpdi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZGl2KTtcbiAgICAgIHJlc3RvcmUoIHRoaXMuZGl2IClcbiAgICAgIGRlbGV0ZSB0aGlzLmRpdlxuICAgIH1cblxuICAgIHRoaXMub3ZlcmxheVZpZXcuZ2V0RGl2ID0gZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB0aGlzLmRpdlxuICAgIH1cblxuICAgIHRoaXMub3ZlcmxheVZpZXcuZHJhdyA9IGZ1bmN0aW9uKCl7XG4gICAgICBpZiAoICF0aGlzLmRpdiApIHtcbiAgICAgICAgdGhpcy5kaXYgPSBlbG1cbiAgICAgICAgY29uc3QgcGFuZXMgPSB0aGlzLmdldFBhbmVzKClcbiAgICAgICAgLy8gaWYgbm8gcGFuZXMgdGhlbiBhc3N1bWVkIG5vdCBvbiBtYXBcbiAgICAgICAgaWYoIXBhbmVzIHx8ICFwYW5lcy5vdmVybGF5SW1hZ2UpcmV0dXJuXG5cbiAgICAgICAgcGFuZXMub3ZlcmxheUltYWdlLmFwcGVuZENoaWxkKCBlbG0gKVxuICAgICAgfVxuXG4gICAgICBjb25zdCBsYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHRoaXMubGF0aXR1ZGUsdGhpcy5sb25naXR1ZGUpXG5cbiAgICAgIGNvbnN0IHByb2ogPSB0aGlzLmdldFByb2plY3Rpb24oKVxuICAgICAgaWYoIXByb2opcmV0dXJuXG5cbiAgICAgIGNvbnN0IHBvaW50ID0gcHJvai5mcm9tTGF0TG5nVG9EaXZQaXhlbCggbGF0bG5nIClcblxuICAgICAgaWYgKHBvaW50KSB7XG4gICAgICAgIGVsbS5zdHlsZS5sZWZ0ID0gKHBvaW50LnggLSAxMCkgKyAncHgnXG4gICAgICAgIGVsbS5zdHlsZS50b3AgPSAocG9pbnQueSAtIDIwKSArICdweCdcbiAgICAgIH0gICAgICAgIFxuXG4gICAgICBpZiggdGhpcy5ib3VuZHNfICl7XG4gICAgICAgIC8vIHN0cmV0Y2ggY29udGVudCBiZXR3ZWVuIHR3byBwb2ludHMgbGVmdGJvdHRvbSBhbmQgcmlnaHR0b3AgYW5kIHJlc2l6ZVxuICAgICAgICBjb25zdCBwcm9qID0gdGhpcy5nZXRQcm9qZWN0aW9uKClcbiAgICAgICAgY29uc3Qgc3cgPSBwcm9qLmZyb21MYXRMbmdUb0RpdlBpeGVsKHRoaXMuYm91bmRzXy5nZXRTb3V0aFdlc3QoKSlcbiAgICAgICAgY29uc3QgbmUgPSBwcm9qLmZyb21MYXRMbmdUb0RpdlBpeGVsKHRoaXMuYm91bmRzXy5nZXROb3J0aEVhc3QoKSlcbiAgXG4gICAgICAgIHRoaXMuZGl2LnN0eWxlLmxlZnQgPSBzdy54ICsgJ3B4J1xuICAgICAgICB0aGlzLmRpdi5zdHlsZS50b3AgPSBuZS55ICsgJ3B4J1xuICAgICAgICB0aGlzLmRpdi5jaGlsZHJlblswXS5zdHlsZS53aWR0aCA9IG5lLnggLSBzdy54ICsgJ3B4J1xuICAgICAgICB0aGlzLmRpdi5jaGlsZHJlblswXS5zdHlsZS5oZWlnaHQgPSBzdy55IC0gbmUueSArICdweCdcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudDogYW55KSA9PiB7XG4gICAgICB0aGlzLmhhbmRsZVRhcCgpXG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIH0pXG5cbiAgICB0aGlzLmhhbmRsZUluZm9XaW5kb3dVcGRhdGUoKVxuXG4gICAgcmV0dXJuIHRoaXMub3ZlcmxheVZpZXdcbiAgfVxuXG4gIGhhbmRsZVRhcCgpe1xuICAgIGlmICh0aGlzLm9wZW5JbmZvV2luZG93KSB7XG4gICAgICB0aGlzLmluZm9XaW5kb3cuZm9yRWFjaChpbmZvV2luZG93PT57XG4gICAgICAgIGluZm9XaW5kb3cub3BlbigpXG4gICAgICB9KVxuICAgIH1cbiAgICB0aGlzLm1hcmtlckNsaWNrLmVtaXQoKTtcbiAgfVxuXG4gIF9hZGRFdmVudExpc3RlbmVycygpe1xuICAgIGNvbnN0IGVvID0gdGhpcy5fbWFya2VyTWFuYWdlci5jcmVhdGVFdmVudE9ic2VydmFibGUoJ2NsaWNrJywgPGFueT50aGlzLm92ZXJsYXlWaWV3KVxuICAgIGNvbnN0IGNzID0gZW8uc3Vic2NyaWJlKCgpID0+IHRoaXMuaGFuZGxlVGFwKCkpXG4gICAgdGhpcy5fb2JzZXJ2YWJsZVN1YnNjcmlwdGlvbnMucHVzaChjcylcbiAgfVxufVxuIl19