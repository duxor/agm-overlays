import { Component } from "@angular/core"
import { template } from "./app.template"
import * as packJson from "../../package.json"
import {
  exampleLatLng, points, resizesPoint
} from "./points"

@Component({
  selector:"app",
  template:template,
  styles:['.block {justify-content:center;align-items:center;display:flex;width:50px;height:50px;background-color:blue;}']
}) export class AppComponent{
  markerEdit: exampleLatLng | undefined
  view: "data" | null = null;
  destroyMap: boolean | undefined
  latLngArray:exampleLatLng[] = points
  resizesPoint:exampleLatLng = resizesPoint

  setLatLngArrayString( string:string ){
    const json = JSON.parse(string)
    this.latLngArray = json
  }

  toNumber(value: string) {
    return Number(value)
  }
}