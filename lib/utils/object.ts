export function createInheritedObject<T extends object, U extends object>(object: T, properties: U): T & U;
export function createInheritedObject<T extends null, U extends object>(object: T, properties: U): U;

export function createInheritedObject<T extends object | null, U extends object>(
  object: T,
  properties: U,
): T extends null ? U : T & U {
  const inherited: T extends null ? U : T & U = Object.create(object, Object.getOwnPropertyDescriptors(properties));

  if (!object) {
    return inherited;
  }

  return new Proxy(inherited, {
    set: (inherited, p, value: unknown) => {
      const target = {}.hasOwnProperty.call(inherited, p) ? inherited : p in object ? object : inherited;

      // @ts-ignore
      target[p] = value;

      return true;
    },
  });
}
