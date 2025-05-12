import { Control, LatLng } from 'leaflet';

interface RoutingOptions {
  waypoints: LatLng[];
  routeWhileDragging?: boolean;
  show?: boolean;
  addWaypoints?: boolean;
  draggableWaypoints?: boolean;
  fitSelectedRoutes?: boolean;
  showAlternatives?: boolean;
}

interface RoutingControl extends Control {
  setWaypoints(waypoints: LatLng[]): void;
  getWaypoints(): LatLng[];
  spliceWaypoints(index: number, toRemove: number, ...waypoints: LatLng[]): LatLng[];
}

interface Routing {
  control(options: RoutingOptions): RoutingControl;
}

declare const Routing: Routing;

export { Routing, RoutingOptions, RoutingControl }; 