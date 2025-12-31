export { BaseEntity } from './base.js';
export { EntityRegistry } from './registry.js';

// Explicitly export new entities to ensure visibility and registration
export { DeliveryVanEntity } from './deliveryVan.js';
export { SkyGardenTowerEntity } from './skyGardenTower.js';
export { RadioTowerEntity } from './radioTower.js';
export { NeonSignEntity } from './neonSign.js';
export { HVACEntity } from './hvac.js';
export { LandingPadEntity } from './landingPad.js';
export { RadarDishEntity } from './radarDish.js';
export { WoodenFenceEntity, PicketFenceEntity, ChainLinkFenceEntity, CementWallEntity } from './fence.js';
export { LilyPondEntity } from './lilyPond.js';
export { BurgerJointEntity, OfficeParkEntity, ModernTowerEntity } from './commercial.js';
export { HouseModernEntity, HouseCottageEntity, ApartmentBlockEntity } from './residential.js';
export { SidewalkEntity } from './infrastructure.js';
export { IntersectionEntity } from './intersections.js';
export { BusStopEntity } from './busStop.js';
export { PlayerStartEntity } from './playerStart.js';
export { WaterFountainEntity } from './waterFountain.js';
export { ObservatoryEntity } from './observatory.js';
export { FireHydrantEntity } from './fireHydrant.js';
export { FireStationEntity } from './fireStation.js';
export { WindSockEntity } from './windsock.js';
export { ChargingStationEntity } from './chargingStation.js';
export { LotusPondEntity } from './lotusPond.js';
export { MushroomPatchEntity } from './mushroomPatch.js';
export { RunwayEdgeLightEntity } from './runwayEdgeLight.js';
export { JetBridgeEntity } from './jetBridge.js';
export { ConstructionBarrierEntity } from './constructionBarrier.js';
export { SolarPanelEntity } from './solarPanel.js';
export { MarketStallEntity } from './marketStall.js';
export { PinkVendingMachineEntity } from './pinkVendingMachine.js';
export { VendingMachineEntity } from './vendingMachine.js';
export { FuturisticVendingMachineEntity } from './futuristicVendingMachine.js';
export { WindTurbineEntity } from './windTurbine.js';
export { ScooterDockEntity } from './scooterDock.js';
export { BoostGateEntity } from './boostGate.js';
export { FuturisticMailboxEntity } from './futuristicMailbox.js';
export { AerialBeaconEntity } from './aerialBeacon.js';
export { RiverBuoyEntity } from './riverBuoy.js';
export { PowerTransformerAlternateEntity } from './powerTransformerAlternate.js';
export { FuturisticEmergencySirenEntity } from './futuristicEmergencySiren.js';
export { GazeboEntity } from './gazebo.js';
export { CementMixerEntity } from './cementMixer.js';
export { FoodTruckEntity } from './foodTruck.js';
export { LighthouseEntity } from './lighthouse.js';
export { ShippingContainerEntity } from './shippingContainer.js';
export { DumpsterEntity } from './dumpster.js';
export { PortaPottyEntity } from './portaPotty.js';
export { PhoneBoothEntity } from './phoneBooth.js';
export { TugboatEntity } from './tugboat.js';
export { HologramKioskEntity } from './hologramKiosk.js';
export { SkyCourierDroneEntity } from './skyCourierDrone.js';


// Eagerly load all entity modules to trigger their registrations.
// Vite will execute each module once, ensuring EntityRegistry is populated
// without manual imports.
import.meta.glob('./*.js', { eager: true });
