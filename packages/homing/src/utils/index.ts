import { __observer__, __target__ } from '../constants/index';
import { Observer } from '../core/observer';

export const createProperty = (fn: () => any) => {
  return {
    get: fn,
    configurable: true,
    enumerable: false
  };
};

export const getObserver = (target: any): Observer | undefined => {
  if (typeof target !== 'object' || target === null) {
    return;
  }
  const desc = Object.getOwnPropertyDescriptor(target, __observer__);
  return desc?.get?.();
};

export const getObserverProxy = <T>(target: T): T | undefined => {
  const observer = getObserver(target);
  return observer?.proxy;
};

export const getObserverTarget = <T>(target: T): T | undefined => {
  if (typeof target !== 'object' || target === null) {
    return;
  }
  const desc = Object.getOwnPropertyDescriptor(target, __target__);
  return desc?.get?.();
};
