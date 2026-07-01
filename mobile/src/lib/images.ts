import { Asset } from "expo-asset";

export const images = {
  image: require("../../assets/images/image.png"),
  parcel: require("../../assets/images/parcel.png"),
  sender: require("../../assets/images/sender.png"),
  receiver: require("../../assets/images/receiver.png"),
  receiver1: require("../../assets/images/receiver1.png"),
  logo: require("../../assets/images/logo.png"),
  collection: require("../../assets/images/collection.png"),
  map: require("../../assets/images/map.png"),
  confirmed: require("../../assets/images/confirmed.jpg"),
} as const;

export type ImageKey = keyof typeof images;

/** Warm the image cache while splash is visible. */
export async function preloadAppImages(): Promise<void> {
  await Asset.loadAsync(Object.values(images));
}
