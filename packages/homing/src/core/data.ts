import { ChangeType } from '../constants/index';
import { getObserver } from '../utils/index';
import { observable } from './observable';
import { Observer } from './observer';

export const objectObservable = <T extends object>(target: T, observer: Observer) => {
  let _proxy: any = null;
  const proxy = new Proxy(target, {
    get(v, key) {
      const _get = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), key)?.get;
      if (_get) {
        return _get.call(_proxy);
      }

      observer.collect(key);
      return observable((target as any)[key], key, observer);
    },
    set(v, key, newValue) {
      const oldValue = (target as any)[key];
      if (oldValue === newValue) {
        return true;
      }
      const oldObserver = getObserver(oldValue);
      const newObserver = getObserver(newValue);

      if (oldObserver && oldObserver === newObserver) {
        return true;
      }

      if (oldObserver) {
        oldObserver.removeParent(observer);
      }

      if (newObserver) {
        newObserver.addParent(key, observer);
      }

      observer.pushChange({
        key: key,
        type: ChangeType.Set,
        oldValue: (target as any)[key],
        newValue: newValue
      });
      (target as any)[key] = newValue;
      observer.run(key);
      return true;
    }
  });
  _proxy = proxy;
  return proxy;
};

const methodsToProxy: string[] = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
const arrayMethodsProxyFactory = (observer: Observer) => {
  const methodsCache: Record<string, Function> = {};

  return (p: string) => {
    if (!methodsCache[p]) {
      methodsCache[p] = new Proxy<Function>(observer.target[p], {
        apply(method, thisArg, argArray) {
          switch (p) {
            case 'push': {
              observer.pushChange({
                type: ChangeType.ArrayPush,
                items: argArray,
                start: thisArg.length
              });
              break;
            }
            case 'pop': {
              observer.pushChange({
                type: ChangeType.ArrayPop,
                length: observer.target.length
              });
              break;
            }
            case 'shift': {
              observer.pushChange({
                type: ChangeType.ArrayShift
              });
              break;
            }
            case 'unshift': {
              observer.pushChange({
                type: ChangeType.ArrayUnshift
              });
              break;
            }
            case 'splice': {
              const [start, deleteCount, ...items] = argArray;
              observer.pushChange({
                type: ChangeType.ArraySplice,
                start: start,
                deleteCount: deleteCount,
                length: observer.target.length,
                items: items
              });
              break;
            }
            case 'sort': {
              observer.pushChange({
                type: ChangeType.ArraySort
              });
              break;
            }
            case 'reverse': {
              observer.pushChange({
                type: ChangeType.ArrayReverse
              });
              break;
            }
          }
          const res = method.apply(observer.target, argArray);
          observer.run();
          return res;
        }
      });
    }
    return methodsCache[p];
  };
};

export const arrayObservable = <T extends any[]>(target: T, observer: Observer) => {
  const arrayMethodsProxy = arrayMethodsProxyFactory(observer);

  const proxy = new Proxy(target, {
    get(v, p) {
      if (typeof p === 'string' && methodsToProxy.includes(p)) {
        return arrayMethodsProxy(p);
      }

      observer.collect(p);
      return observable((target as any)[p], p, observer);
    },
    set(v, key, newValue) {
      const oldValue = (target as any)[key];
      if (oldValue === newValue) {
        return true;
      }
      const oldObserver = getObserver(oldValue);
      const newObserver = getObserver(newValue);

      if (oldObserver && oldObserver === newObserver) {
        return true;
      }

      if (oldObserver) {
        oldObserver.removeParent(observer);
      }

      if (newObserver) {
        newObserver.addParent(key, observer);
      }
      observer.pushChange({
        key: key,
        type: ChangeType.Set,
        oldValue: oldValue,
        newValue: newValue
      });
      (target as any)[key] = newValue;
      observer.run(key);
      return true;
    }
  });

  return proxy;
};
