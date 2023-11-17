import { NgModule } from "@angular/core"
import { BrowserModule } from '@angular/platform-browser'
import { AgmCoreModule } from "@grupo-san-cristobal/agm-core"
import { AppComponent } from "./app.component"
import { AgmMarkerClustererModule } from '@grupo-san-cristobal/agm-markerclusterer';

//DO NOT USE BELOW
//YOU NEED USE: import { AgmOverlays } from "agm-overlays"
import { AgmOverlays } from "../../src"

@NgModule({
  imports:[
    BrowserModule,
    AgmOverlays,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyD2Z0LzbjZXiqRAsVYTl4OP7cK7hdgR89U'
    }),
    AgmMarkerClustererModule
  ],
  bootstrap: [ AppComponent ],
  declarations: [ AppComponent ]
}) export class AppModule{}