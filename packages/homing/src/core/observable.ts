import { __observer__, __target__ } from '../constants/index';
import { IKey } from '../typings/index';
import { createProperty } from '../utils/index';
import { arrayObservable, objectObservable } from './data';
import { Observer } from './observer';

/**
 * 可观察的
 * @description 将对象转换为可观察对象
 */
export const observable = <T extends object>(target: T, key?: IKey, parent?: Observer): T => {
  if (typeof target !== 'object' || target === null) {
    return target;
  }

  target = Object.getOwnPropertyDescriptor(target, __target__)?.get?.() ?? target;
  const observer = Object.getOwnPropertyDescriptor(target, __observer__)?.get?.() ?? new Observer(target);
  if (key !== undefined && parent) {
    observer.addParent(key, parent);
  }

  if (observer?.proxy) {
    return observer?.proxy;
  }

  const proxy = (() => {
    if (Array.isArray(target)) {
      return arrayObservable(target, observer);
    } else {
      return objectObservable(target, observer);
    }
  })();

  observer.setProxy(proxy);
  Object.defineProperties(target, {
    [__target__]: createProperty(() => target),
    [__observer__]: createProperty(() => observer)
  });

  return proxy;
};
