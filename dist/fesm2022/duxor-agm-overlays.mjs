import * as i0 from '@angular/core';
import { EventEmitter, QueryList, ElementRef, Component, Input, Output, ContentChildren, ViewChild, NgModule } from '@angular/core';
import * as i1 from '@duxor/agm-core';
import { AgmInfoWindow } from '@duxor/agm-core';
import { CommonModule } from '@angular/common';

class AgmOverlay {
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

class AgmOverlays {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.4", ngImport: i0, type: AgmOverlays, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "17.2.4", ngImport: i0, type: AgmOverlays, declarations: [AgmOverlay], imports: [CommonModule], exports: [AgmOverlay] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "17.2.4", ngImport: i0, type: AgmOverlays, imports: [CommonModule] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.4", ngImport: i0, type: AgmOverlays, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        CommonModule
                    ],
                    declarations: [AgmOverlay],
                    exports: [AgmOverlay],
                }]
        }] });

/**
 * Generated bundle index. Do not edit.
 */

export { AgmOverlay, AgmOverlays };
//# sourceMappingURL=duxor-agm-overlays.mjs.map
