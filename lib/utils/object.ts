export function createInheritedObject<T extends object, U extends object>(object: T, properties: U): T & U;
export function createInheritedObject<T extends null, U extends object>(object: T, properties: U): U;

export function createInheritedObject<T extends object | null, U extends object>(
  object: T,
  properties: U,
): T extends null ? U : T & U {
  return Object.create(object, Object.getOwnPropertyDescriptors(properties));
}
