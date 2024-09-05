import { ElementRef, EventEmitter, QueryList } from "@angular/core";
import { AgmInfoWindow, GoogleMapsAPIWrapper, MarkerManager } from "@duxor/agm-core";
import * as i0 from "@angular/core";
export interface latLng {
    latitude: number;
    longitude: number;
}
export interface bounds {
    x: latLng;
    y: latLng;
}
export interface latLngPlus {
    latitude: number;
    longitude: number;
    bounds?: bounds;
}
export declare class AgmOverlay {
    protected _mapsWrapper: GoogleMapsAPIWrapper;
    private _markerManager;
    latitude: number;
    longitude: number;
    visible: boolean;
    zIndex: number;
    bounds: bounds;
    markerClick: EventEmitter<void>;
    openInfoWindow: boolean;
    infoWindow: QueryList<AgmInfoWindow>;
    draggable: boolean;
    template: ElementRef;
    destroyed: boolean;
    overlayView: any;
    private _observableSubscriptions;
    constructor(_mapsWrapper: GoogleMapsAPIWrapper, _markerManager: MarkerManager);
    ngAfterViewInit(): void;
    ngAfterContentInit(): void;
    ngOnChanges(changes: any): void;
    onChanges(changes: any): void;
    onChangesOverride(changes: any): void;
    ngOnDestroy(): void;
    destroy(): any;
    private handleInfoWindowUpdate;
    load(): Promise<any>;
    getOverlay(map: any): any;
    handleTap(): void;
    _addEventListeners(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<AgmOverlay, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AgmOverlay, "agm-overlay", never, { "latitude": { "alias": "latitude"; "required": false; }; "longitude": { "alias": "longitude"; "required": false; }; "visible": { "alias": "visible"; "required": false; }; "zIndex": { "alias": "zIndex"; "required": false; }; "bounds": { "alias": "bounds"; "required": false; }; "openInfoWindow": { "alias": "openInfoWindow"; "required": false; }; "draggable": { "alias": "markerDraggable"; "required": false; }; }, { "markerClick": "markerClick"; }, ["infoWindow"], ["*"], false, never>;
}
