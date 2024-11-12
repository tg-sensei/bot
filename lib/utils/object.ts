export function createInheritedObject<T extends object | null, U extends object>(
  object: T,
  properties: U,
): T extends null ? U : T & U {
  return Object.create(
    object,
    Object.keys(properties).reduce<PropertyDescriptorMap>((descriptors, property) => {
      descriptors[property] = {
        configurable: true,
        enumerable: true,
        value: properties[property as keyof U],
        writable: true,
      };

      return descriptors;
    }, {}),
  );
}
